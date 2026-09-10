"use client"
import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Memory, ProfileData, ProfileSection } from "@/components/profile/types"
import { getProfileView, generateProfile, getGEval } from "@/lib/api"
import { groupMemoriesBySection } from "@/lib/profileUtils"
import { useSharedWebSocket } from "@/contexts/WebSocketContext"
import { useProfileUpdate } from "@/contexts/ProfileUpdateContext"
import { useContentWidth } from "@/hooks/useContentWidth"
// Card Components
import ProgressBarCard from "@/components/profile/cards/ProgressBarCard"
import TagsCard from "@/components/profile/cards/TagsCard"
import TimelineCard from "@/components/profile/cards/TimelineCard"
import SpectrumCard from "@/components/profile/cards/SpectrumCard"
import InsightsCard from "@/components/profile/cards/InsightsCard"
import MetricsCard from "@/components/profile/cards/MetricsCard"
import MemoryModal from "@/components/profile/MemoryModal"
import { Brain, RefreshCw } from "lucide-react"

interface ProfilePageContentProps {
  userId: string;
  profileData: ProfileData | null;
  allMemories: Memory[];
  memoriesBySection: Record<string, Memory[]>;
  onProfileDataChange: (data: ProfileData) => void;
  onAllMemoriesChange: (memories: Memory[]) => void;
  onMemoriesBySectionChange: (sections: Record<string, Memory[]>) => void;
  session: any;
}

function ProfilePageContent({
  userId,
  profileData,
  allMemories,
  memoriesBySection,
  onProfileDataChange,
  onAllMemoriesChange,
  onMemoriesBySectionChange,
  session
}: ProfilePageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { wsUpdating } = useProfileUpdate()
  const { containerRef, gridClassName } = useContentWidth()

  // Local state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null) // Track current user ID
  const [profileUpdating, setProfileUpdating] = useState(false) // Track profile auto-update from MemoryModal
  const [gEvalScore, setGEvalScore] = useState<number | null>(null) // G-eval score
  const [gEvalLoading, setGEvalLoading] = useState(false) // Loading state for g-eval

  // Modal state
  const [memoryModalOpen, setMemoryModalOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [newMemoryContent, setNewMemoryContent] = useState("")
  const [sectionMemories, setSectionMemories] = useState<Memory[]>([])

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Try to fetch existing profile first (using userId from session)
        try {
          const data = await getProfileView(userId, true)
          
          // Store the userId for future operations
          setCurrentUserId(data.userId)
          
          // Set profile data directly from API response
          onProfileDataChange({
            name: data.name,
            title: data.title,
            bio: data.bio,
            sections: data.sections,
            memories: data.memories
          })
          onAllMemoriesChange(data.memories)
          
          // Group memories by section
          const grouped = groupMemoriesBySection(data.memories, data.sections)
          onMemoriesBySectionChange(grouped)
          
        } catch (fetchError: any) {
          // If profile doesn't exist (404), generate a new one for userId
          if (fetchError.message.includes('404') || fetchError.message.includes('not found')) {
            console.log('[Profile Page] Profile not found, generating new profile for userId...')
            
            // Generate new profile for userId
            const generateResult = await generateProfile(userId)
            console.log('[Profile Page] New profile generated:', generateResult.userId)
            
            // Fetch the newly generated profile using userId
            const data = await getProfileView(userId, true)
            
            setCurrentUserId(userId)
            onProfileDataChange({
              name: data.name,
              title: data.title,
              bio: data.bio,
              sections: data.sections,
              memories: data.memories
            })
            onAllMemoriesChange(data.memories)
            
            const grouped = groupMemoriesBySection(data.memories, data.sections)
            onMemoriesBySectionChange(grouped)
          } else {
            // If it's a different error, rethrow it
            throw fetchError
          }
        }
        
      } catch (err) {
        console.error('Failed to fetch/generate profile data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  // Simulate AI Update: Generate new profile with AI and save to database
  const handleSimulateAIUpdate = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('$ [Profile Page] Simulate Target userId:', userId)
      
      // Step 1: Generate profile using AI for userId
      // This will update the existing user's profile with new AI-generated data
      const generateResult = await generateProfile(userId)
      
      console.log('[Profile Page] Profile generated successfully', generateResult)
      
      // Verify that the userId matches our expected user
      if (generateResult.userId !== userId) {
        console.warn('[Profile Page] Warning: Generated userId does not match session userId')
      }
      
      // Step 2: Fetch the newly generated profile from database using userId
      const data = await getProfileView(userId, true)
      console.log('[Profile Page] Fetched updated profile data from API', data)

      // Step 3: Update UI with new data
      onProfileDataChange({
        name: data.name,
        title: data.title,
        bio: data.bio,
        sections: data.sections,
        memories: data.memories
      })
      onAllMemoriesChange(data.memories)
      
      // Group memories by section
      const grouped = groupMemoriesBySection(data.memories, data.sections)
      onMemoriesBySectionChange(grouped)
      
      console.log('$ [Profile Page] Simulate Profile grouped successfully', grouped)
      
    } catch (err) {
      console.error('[Profile Page] Failed to generate/update profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  // Handle G-Eval fetch
  const handleGEval = async () => {
    try {
      setGEvalLoading(true)
      setError(null)
      console.log('[Profile Page] Fetching g-eval score for user:', userId)

      const result = await getGEval(userId)
      console.log('[Profile Page] G-eval score:', result.score)

      setGEvalScore(result.score)
    } catch (err) {
      console.error('[Profile Page] Failed to fetch g-eval:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch g-eval')
    } finally {
      setGEvalLoading(false)
    }
  }

  // profile handler functions
  const handleSectionDetail = useCallback((section: string) => {
    if (!profileData) return
    
    // Store profileData and memoriesBySection in localStorage for use in the detail page
    localStorage.setItem('profileData', JSON.stringify(profileData))
    localStorage.setItem('mockMemories', JSON.stringify(memoriesBySection))
    router.push(`/profile/detail?section=${section}`)
  }, [router, profileData, memoriesBySection])

  const openMemoryModal = (sectionIdOrKey: string) => {
    // If section is "profile", show all memories
    if (sectionIdOrKey === "profile") {
      setSelectedSection("profile")
      setSectionMemories(allMemories)
    } else {
      // Find the section by ID to get its title
      const section = profileData?.sections.find(s => s.id === sectionIdOrKey)
      if (section) {
        setSelectedSection(section.title)
        setSectionMemories(memoriesBySection[section.title] || [])
      } else {
        // Fallback: try to use the parameter as a direct key
        setSelectedSection(sectionIdOrKey)
        setSectionMemories(memoriesBySection[sectionIdOrKey] || [])
      }
    }
    setMemoryModalOpen(true)
  }

  const handleAddMemory = () => {
    if (newMemoryContent.trim()) {
      const newMemory: Memory = {
        id: Date.now().toString(),
        type: "user",
        content: newMemoryContent.trim(),
        source: "Manual entry",
        timestamp: new Date().toISOString(),
        categories: [],
      }
      setSectionMemories([...sectionMemories, newMemory])
      setNewMemoryContent("")
    }
  }

  // Render card based on section type
  const renderCard = (section: ProfileSection) => {
    const commonProps = {
      section: section as any,
      onSectionDetail: handleSectionDetail,
      onOpenMemories: openMemoryModal,
    }

    switch (section.type) {
      case "progressBar":
        return <ProgressBarCard key={section.id} {...commonProps} />
      case "tags":
        return <TagsCard key={section.id} {...commonProps} />
      case "metrics":
        return <MetricsCard key={section.id} {...commonProps} />
      case "timeline":
        return <TimelineCard key={section.id} {...commonProps} />
      case "spectrum":
        return <SpectrumCard key={section.id} {...commonProps} />
      case "insights":
        return <InsightsCard key={section.id} {...commonProps} />
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 p-6 overflow-auto leading-7 min-h-0" ref={containerRef}>
          {/* Loading State - Show when initial loading, simulated update, OR profile auto-update from MemoryModal */}
          {(loading || profileUpdating || wsUpdating) && (
            <div className="flex items-center justify-center h-64">
              <div className="text-[#A0EFFF]">Loading profile...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="text-red-400">Error: {error}</div>
              <Button onClick={handleSimulateAIUpdate} variant="outline">
                Retry
              </Button>
            </div>
          )}

          {/* Profile Content */}
          {!(loading || profileUpdating || wsUpdating) && !error && profileData && (
            <>
              {/* Profile Header */}
              <div className="mb-8">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-2 border-[#A0EFFF]/30">
                      <AvatarImage src={session?.user?.image} alt={profileData.name || "Profile"} />
                      <AvatarFallback className="bg-[#A0EFFF] text-[#172A3A] font-semibold text-xl">
                        {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-heading text-white mb-2">{profileData.name}</h2>
                      <div className="flex gap-2 items-center">
                        <div className="flex flex-col gap-1 items-end">
                          <Button
                            onClick={handleGEval}
                            size="sm"
                            variant="ghost"
                            disabled={gEvalLoading}
                            className="text-[#A0EFFF] hover:text-[#FF9500] hover:bg-[#FF9500]/10"
                          >
                            <span className="text-xs">
                              {gEvalLoading ? 'Loading...' : gEvalScore !== null ? 'Update G-Eval' : 'Get G-Eval'}
                            </span>
                          </Button>
                          {gEvalScore !== null && !gEvalLoading && (
                            <div className="text-[#A0EFFF] text-xs px-2 py-1 bg-[#A0EFFF]/10 rounded">
                              Score: {gEvalScore}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handleSimulateAIUpdate}
                          size="sm"
                          variant="outline"
                          className="text-[#FF9500] hover:text-[#FF9500] hover:bg-[#FF9500]/10"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span className="text-xs ml-1">Simulate AI Update</span>
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            openMemoryModal("profile")
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-[#A0EFFF] hover:text-[#FF9500] hover:bg-[#FF9500]/10"
                        >
                          <Brain className="w-4 h-4" />
                          <span className="text-xs ml-1">All Memories</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-[#A0EFFF] mb-3">{profileData.title}</p>
                    <p className="text-white/80 leading-relaxed max-w-2xl">{profileData.bio}</p>
                  </div>
                </div>
              </div>

              <div className={gridClassName}>
                {/* Dynamic section-based card rendering */}
                {profileData.sections.map((section) => renderCard(section))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Memory Modal */}
      <MemoryModal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        selectedSection={selectedSection}
        memories={sectionMemories}
        onUpdateMemories={setSectionMemories}
        newMemoryContent={newMemoryContent}
        onNewMemoryContentChange={setNewMemoryContent}
        onAddMemory={handleAddMemory}
        editingMemoryId={editingMemoryId}
        onStartEdit={setEditingMemoryId}
        onStopEdit={() => setEditingMemoryId(null)}
        userId={currentUserId || userId}
        onProfileUpdating={setProfileUpdating}  // Handle profile auto-update loading state
      />
    </>
  )
}

// Main export
export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { ai } = useSharedWebSocket()
  const { pendingProfileData, pendingAllMemories, pendingMemoriesBySection, clearPendingUpdate, triggerProfileUpdate } = useProfileUpdate()

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render content if not authenticated
  if (!session) {
    return null
  }

  const userId = session.user.id

  // State for API data
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [allMemories, setAllMemories] = useState<Memory[]>([])
  const [memoriesBySection, setMemoriesBySection] = useState<Record<string, Memory[]>>({})

  // Listen for WebSocket profile auto-update events
  useEffect(() => {
    const aiData = ai as any;
    
    if (aiData?.profileAutoUpdateTriggered && aiData?.profileData) {
      console.log('$ [ProfilePage] WebSocket profileAutoUpdateTriggered', aiData);
      triggerProfileUpdate(aiData.profileData, true);
    }
  }, [ai, triggerProfileUpdate]);

  // Listen for updates from ProfileUpdateContext
  useEffect(() => {
    if (pendingProfileData) {
      console.log('$ [ProfilePage] Applying pending profile update from context');
      setProfileData(pendingProfileData);
      setAllMemories(pendingAllMemories);
      setMemoriesBySection(pendingMemoriesBySection);
      
      // Clear the pending update after applying
      clearPendingUpdate();
    }
  }, [pendingProfileData, pendingAllMemories, pendingMemoriesBySection, clearPendingUpdate]);

  return (
    <ProfilePageContent
      userId={userId}
      profileData={profileData}
      allMemories={allMemories}
      memoriesBySection={memoriesBySection}
      onProfileDataChange={setProfileData}
      onAllMemoriesChange={setAllMemories}
      onMemoriesBySectionChange={setMemoriesBySection}
      session={session}
    />
  )
}



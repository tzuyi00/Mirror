"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Brain,
  Lightbulb,
  Sparkles
} from "lucide-react"
import MemoryModal from "@/components/profile/MemoryModal"
import { Memory, ProfileData, ProfileSection } from "@/components/profile/types"

export default function ProfileDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const sectionId = searchParams.get('section')
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [mockMemories, setMockMemories] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [memoryModalOpen, setMemoryModalOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [sectionMemories, setSectionMemories] = useState<Memory[]>([])

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Read data from localStorage
  useEffect(() => {
    try {
      const storedProfileData = localStorage.getItem('profileData')
      const storedMockMemories = localStorage.getItem('mockMemories')
      
      if (storedProfileData) {
        setProfileData(JSON.parse(storedProfileData))
      }
      if (storedMockMemories) {
        setMockMemories(JSON.parse(storedMockMemories))
      }
    } catch (error) {
      console.error('Error reading data from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const openMemoryModal = (sectionId: string) => {
    const section = profileData?.sections.find(s => s.id === sectionId)
    const sectionTitle = section ? section.title : sectionId
    setSelectedSection(sectionTitle)
    setSectionMemories(mockMemories?.[sectionTitle] || [])
    setMemoryModalOpen(true)
  }

  // Find the section by id from the new sections array
  const currentSection = profileData?.sections?.find(s => s.id === sectionId)

  // Render item based on section type
  const renderSectionItem = (section: ProfileSection, item: any, index: number) => {
    switch (section.type) {
      case "progressBar": {
        const progressItem = item as import("@/components/profile/types").ProgressBarItem
        return (
          <div key={progressItem.id} className="p-4 bg-[#455769] rounded-lg border border-[#A0EFFF]/20">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-white">{progressItem.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#A0EFFF]">{progressItem.level}%</span>
              </div>
            </div>
            <div className="w-full bg-[#172A3A] rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-[#E59D23] to-[#85C2D2] h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressItem.level}%` }}
              ></div>
            </div>
            <p className="text-sm text-white/70">{progressItem.desc}</p>
          </div>
        )
      }

      case "tags": {
        const tagItem = item as import("@/components/profile/types").TagItem
        return (
          <div key={tagItem.id} className="p-4 bg-[#455769] rounded-lg border border-[#A0EFFF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-[#172A3A] text-[#A0EFFF] border-[#A0EFFF]/30 text-base px-3 py-1">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {tagItem.label}
                </Badge>
                <span className="text-sm text-[#FF9500]">{tagItem.strength}% strength</span>
              </div>
            </div>
            <p className="text-sm text-white/70">{tagItem.desc}</p>
          </div>
        )
      }

      case "metrics": {
        const metricItem = item as import("@/components/profile/types").MetricItem
        return (
          <div key={metricItem.id} className="p-4 bg-[#455769] rounded-lg border border-[#A0EFFF]/20">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-white">{metricItem.name}</h3>
              {metricItem.type === "metric" ? (
                <span className="text-sm text-[#A0EFFF]">{metricItem.value}</span>
              ) : (
                <Badge className="bg-[#172A3A] text-[#A0EFFF] border-[#A0EFFF]/30">{metricItem.value}</Badge>
              )}
            </div>
            {metricItem.type === "metric" && metricItem.score && (
              <div className="w-full bg-[#172A3A] rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-[#E59D23] to-[#85C2D2] h-2 rounded-full"
                  style={{ width: `${metricItem.score}%` }}
                ></div>
              </div>
            )}
            <p className="text-sm text-white/70">{metricItem.desc}</p>
          </div>
        )
      }

      case "timeline": {
        const timelineItem = item as import("@/components/profile/types").TimelineItem
        const dataLength = section.data.length
        return (
          <div key={timelineItem.id} className="p-4 bg-[#455769] rounded-lg border border-[#A0EFFF]/20">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full border-3 border-[#455769] bg-[#FF9500] flex items-center justify-center"></div>
                {index < dataLength - 1 && (
                  <div className="w-0.5 h-20 bg-gradient-to-b from-[#A0EFFF]/50 to-[#A0EFFF]/20 mt-2"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-white">{timelineItem.event}</h3>
                  <div className="text-right">
                    <span className="text-sm text-[#A0EFFF]">{timelineItem.dateRange || timelineItem.date}</span>
                    <div className="text-xs text-[#A0EFFF]/70">
                      {timelineItem.dateRange ? "Completion Period" : "Start Date"}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/80 leading-relaxed mb-3">{timelineItem.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-[#172A3A] text-[#A0EFFF] border-[#A0EFFF]/30">
                    {timelineItem.category || "event"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )
      }

      case "spectrum": {
        const spectrumItem = item as import("@/components/profile/types").SpectrumItem
        return (
          <div key={spectrumItem.id} className="p-4 bg-[#455769] rounded-lg border border-[#A0EFFF]/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white">{spectrumItem.leftLabel}</h3>
              <h3 className="text-lg font-medium text-white">{spectrumItem.rightLabel}</h3>
            </div>
            <div className="relative">
              <div className="h-3 bg-gradient-to-r from-[#E59D23] to-[#85C2D2] rounded-full"></div>
              <div
                className="absolute top-0 w-4 h-4 bg-[#FF9500] border-2 border-[#455769] rounded-full transform -translate-y-0.5"
                style={{ left: `calc(${spectrumItem.position}% - 8px)` }}
              ></div>
              <div 
                className="absolute top-6 transform -translate-x-1/2"
                style={{ left: `${spectrumItem.position}%` }}
              >
                <span className="text-xs text-[#A0EFFF] font-medium">{spectrumItem.position}%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-white/70 mt-8"></div>
            <p className="text-sm text-white/70 mt-3">{spectrumItem.desc}</p>
          </div>
        )
      }

      case "insights": {
        const insightItem = item as import("@/components/profile/types").InsightItem
        const IconComponent = insightItem.icon ? 
          require('lucide-react')[insightItem.icon] || Sparkles : 
          Sparkles
        return (
          <div key={insightItem.id} className="p-4 bg-[#455769] rounded-lg border border-[#A0EFFF]/20">
            <div className="flex items-start gap-3">
              <div className="text-[#FF9500] mt-1">
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-[#172A3A] text-[#A0EFFF] border-[#A0EFFF]/30 text-xs">
                    {insightItem.category}
                  </Badge>
                </div>
                <p className="text-sm text-white leading-relaxed">{insightItem.insight}</p>
                <p className="text-sm text-white/70 mt-2">{insightItem.desc}</p>
              </div>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  const getSectionData = () => {
    if (!profileData) {
      return { title: "Loading...", description: "Loading data...", data: [], renderItem: () => null }
    }

    // Find section in new structure
    if (currentSection) {
      return {
        title: currentSection.title,
        description: currentSection.description,
        data: currentSection.data,
        renderItem: (item: any, index: number) => renderSectionItem(currentSection, item, index)
      }
    }

    // Section not found
    return { 
      title: "Section Not Found", 
      description: "The requested section could not be found", 
      data: [], 
      renderItem: () => null 
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading...
      </div>
    )
  }

  if (!sectionId || !profileData) {
    return (
      <div className="flex-1 p-6">
        <div className="text-white">
          <Button
            onClick={() => router.push('/profile')}
            variant="ghost"
            className="text-[#A0EFFF] hover:text-white hover:bg-[#A0EFFF]/10 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <p>Please navigate from the profile page to view section details</p>
        </div>
      </div>
    )
  }

  const sectionData = getSectionData()

  return (
    <>
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Button 
                onClick={() => router.push('/profile')} 
                variant="ghost" 
                className="text-[#A0EFFF] hover:text-white hover:bg-[#A0EFFF]/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Overview
              </Button>
              <Button
                onClick={() => openMemoryModal(sectionId)}
                variant="outline"
                className="bg-[#FF9500] text-[#172A3A] border-[#FF9500] hover:bg-[#FF9500]/90"
              >
                <Brain className="w-4 h-4 mr-2" />
                View Memories
              </Button>
            </div>
            <h1 className="text-3xl font-heading text-white mb-2">{sectionData.title}</h1>
            <p className="text-lg text-[#A0EFFF]/70">{sectionData.description}</p>
          </div>

          {/* Content Grid */}
          <div className="grid gap-6">
            {sectionData.data?.map((item: any, index: number) => sectionData.renderItem(item, index))}
          </div>
        </div>
      </div>

      {/* Memory Modal */}
      <MemoryModal 
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        selectedSection={selectedSection}
        memories={sectionMemories}
        onUpdateMemories={setSectionMemories}
        newMemoryContent=""
        onNewMemoryContentChange={() => {}}
        onAddMemory={() => {}}
        editingMemoryId={null}
        onStartEdit={() => {}}
        onStopEdit={() => {}}
        userId={session?.user?.id || ""}
      />
    </>
  )
}
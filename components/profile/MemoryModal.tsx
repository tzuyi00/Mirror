import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, Trash2, Plus } from "lucide-react"
import { MemoryModalProps, Memory } from "@/components/profile/types"
import { createMemory, updateMemory, deleteMemory, triggerProfileAutoUpdate } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useProfileUpdate } from "@/contexts/ProfileUpdateContext"

export default function MemoryModal({
  isOpen,
  onClose,
  selectedSection,
  memories,
  onUpdateMemories,
  newMemoryContent,
  onNewMemoryContentChange,
  onAddMemory,
  editingMemoryId,
  onStartEdit,
  onStopEdit,
  userId,
  onProfileUpdating,
}: MemoryModalProps) {
  const { toast } = useToast()
  const { triggerProfileUpdate } = useProfileUpdate()
  const [isLoading, setIsLoading] = useState(false)
  // Local state for editing content
  const [editingContent, setEditingContent] = useState("")

  // Helper function: Check profile auto-update after memory operation
  const checkProfileAutoUpdate = async (successCount: number) => {
    if (successCount <= 0 || !userId) return

    try {
      console.log('$ [MemoryModal] Checking profile auto-update...', { userId, successCount })
      
      if (onProfileUpdating) {
        onProfileUpdating(true)
      }
      
      // Call the API to check if profile should be auto-updated
      const result = await triggerProfileAutoUpdate(userId, successCount)
      
      console.log('$ [MemoryModal] Profile auto-update result:', result)
      
      // If profile was auto-updated, trigger UI update
      if (result.triggered && result.profileData) {
        
        // Use ProfileUpdateContext to trigger profile update (no frontend delay simulation)
        triggerProfileUpdate(result.profileData, false)
        
        // toast({
        //   title: "Profile updated",
        //   description: result.message || "Your profile has been automatically updated",
        // })
      }
    } catch (error: any) {
      console.error('[MemoryModal] Profile auto-update check failed:', error)
    } finally {
      if (onProfileUpdating) {
        onProfileUpdating(false)
      }
    }
  }

  // Delete memory - call API with soft delete mode
  const handleDeleteMemory = async (memoryId: string) => {
    try {
      setIsLoading(true)
      await deleteMemory(memoryId, 'soft')
      
      // Update local state after successful API call
      const updatedMemories = memories.filter((memory) => memory.id !== memoryId)
      onUpdateMemories(updatedMemories)
      
      toast({
        title: "Memory deleted",
        description: "Memory has been marked as deleted",
      })

      // Check if profile should be auto-updated (1 successful operation)
      await checkProfileAutoUpdate(1)
    } catch (error: any) {
      console.error('[MemoryModal] Delete error:', error)
      toast({
        title: "Delete failed",
        description: error?.message || "Failed to delete memory",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update memory content - call API (only on blur or Enter)
  const handleUpdateMemoryContent = async (memoryId: string, content: string) => {
    if (!content.trim()) return
    try {
      setIsLoading(true)
      const updatedMemoryData = await updateMemory(memoryId, { content })
      // Update local state with API response
      const updatedMemories = memories.map((memory) =>
        memory.id === memoryId ? { ...memory, content: updatedMemoryData.content } : memory
      )
      onUpdateMemories(updatedMemories)
      
      toast({
        title: "Memory updated",
        description: "Memory content has been saved",
      })

      // Check if profile should be auto-updated (1 successful operation)
      await checkProfileAutoUpdate(1)
    } catch (error: any) {
      console.error('[MemoryModal] Update error:', error)
      toast({
        title: "Update failed",
        description: error?.message || "Failed to update memory",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setEditingContent("")
    }
  }

  // Add new memory - call API
  const handleAddNewMemory = async () => {
    if (!newMemoryContent.trim() || !userId) return
    
    try {
      setIsLoading(true)
      const newMemoryData = await createMemory({
        userId,
        type: "user",
        content: newMemoryContent.trim(),
        source: "User Added",
        categories: [],
      })
      
      // Add new memory to local state
      onUpdateMemories([...memories, newMemoryData])
      onNewMemoryContentChange("")
      
      toast({
        title: "Memory added",
        description: "New memory has been created",
      })

      // Check if profile should be auto-updated (1 successful operation)
      await checkProfileAutoUpdate(1)
    } catch (error: any) {
      console.error('[MemoryModal] Create error:', error)
      toast({
        title: "Create failed",
        description: error?.message || "Failed to create memory",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] bg-[#455769] border-[#A0EFFF]/20 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-heading text-white">
            {selectedSection === "profile" ? "All Memories" : `AI Memories for ${selectedSection}`}
          </DialogTitle>
          <DialogDescription className="text-[#A0EFFF]/70">
            {selectedSection === "profile" 
              ? "View and manage all memories AI has collected about your profile"
              : "View and manage the memories AI has collected about this section of your profile"
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 max-h-[calc(80vh-200px)] overflow-y-auto [&>div>div[style]]:!pr-0">
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #162B3A;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #A1EFFF;
              border-radius: 4px;
              opacity: 0.8;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #A1EFFF;
              opacity: 1;
            }
          `}</style>
          <div className="space-y-4 pr-2 custom-scrollbar">
            {memories.map((memory) => (
              <div key={memory.id} className="p-4 bg-[#172A3A] rounded-lg border border-[#A0EFFF]/20 relative">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    {editingMemoryId === memory.id ? (
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onBlur={async () => {
                          if (editingContent !== memory.content) {
                            await handleUpdateMemoryContent(memory.id, editingContent)
                          }
                          onStopEdit()
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            if (editingContent !== memory.content) {
                              await handleUpdateMemoryContent(memory.id, editingContent)
                            }
                            onStopEdit()
                          }
                          if (e.key === "Escape") {
                            setEditingContent(memory.content)
                            onStopEdit()
                          }
                        }}
                        className="w-full bg-[#455769] border-[#A0EFFF]/30 text-white resize-none"
                        autoFocus
                      />
                    ) : (
                      <p
                        className="text-sm text-white leading-relaxed cursor-pointer hover:bg-[#455769]/50 p-2 rounded transition-colors"
                        onClick={() => {
                          setEditingContent(memory.content)
                          onStartEdit(memory.id)
                        }}
                      >
                        {memory.content}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDeleteMemory(memory.id)}
                    size="sm"
                    variant="ghost"
                    className="text-[#A0EFFF]/70 hover:text-[#FF9500] hover:bg-[#FF9500]/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#A0EFFF]/70 flex-wrap">
                  <Clock className="w-3 h-3" />
                  <span>
                    {typeof memory.timestamp === 'string' 
                      ? new Date(memory.timestamp).toLocaleDateString()
                      : memory.timestamp.toLocaleDateString()
                    }
                  </span>
                  {/* Type Icon moved here */}
                  {memory.type === "ai" ? (
                    <span title="AI generated" className="text-[#A0EFFF] text-lg align-middle">🤖</span>
                  ) : (
                    <span title="User added" className="text-[#FF9500] text-lg align-middle">👤</span>
                  )}
                  {memory.categories?.filter(cat => cat !== "user-added").map((cat, idx) => (
                    <Badge
                      key={idx}
                      className={"text-xs font-medium bg-[#A0EFFF]/20 text-[#A0EFFF] border-[#A0EFFF]/30"}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-[#A0EFFF]/20 pt-4 mt-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={newMemoryContent}
              onChange={(e) => onNewMemoryContentChange(e.target.value)}
              placeholder="Add a new memory or insight..."
              className="flex-1 bg-[#172A3A] border-[#A0EFFF]/30 text-white placeholder:text-[#A0EFFF]/50"
            />
            <Button
              onClick={handleAddNewMemory}
              size="sm"
              className="bg-[#FF9500] text-[#172A3A] hover:bg-[#FF9500]/90 font-medium"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

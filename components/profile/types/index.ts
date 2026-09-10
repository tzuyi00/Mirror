// Profile related TypeScript interfaces and types

export interface Memory {
  id: string
  type: "user" | "ai"
  content: string
  source: string
  timestamp: Date | string  // Support both Date and string to avoid hydration issues
  categories: string[]  // Array of category tags (e.g., ["skills", "traits", "preferences", "goals", "achievements", "work-style", "learning-style"])
}

// Data item interfaces based on visual presentation type
export interface ProgressBarItem {
  id: string
  name: string
  level: number        // 0-100 value for progress bar
  desc: string
  order: number        // Sort order for display
}

export interface TagItem {
  id: string
  label: string
  strength: number     // Tag weight/importance
  desc: string
  order: number        // Sort order for display
}

export interface MetricItem {
  id: string
  name: string
  value: string
  score?: number       // Optional numeric score
  type: "metric" | "style"
  desc: string
  order: number        // Sort order for display
}

export interface TimelineItem {
  id: string
  date: string
  dateRange?: string
  event: string
  description: string
  category: string
  order: number        // Sort order for display
}

export interface SpectrumItem {
  id: string
  name: string
  position: number     // Position on spectrum (0-100)
  leftLabel: string
  rightLabel: string
  desc: string
  order: number        // Sort order for display
}

export interface InsightItem {
  id: string
  insight: string
  desc: string
  category: string
  icon: string
  order: number        // Sort order for display
}

// Section Types based on visual presentation
export type SectionType = "progressBar" | "tags" | "timeline" | "spectrum" | "insights" | "metrics"

// Profile Section - flexible container for different types of data
export interface ProfileSection {
  id: string                  
  type: SectionType            // Visual presentation type
  title: string                
  description: string          
  data: ProgressBarItem[] | TagItem[] | MetricItem[] | TimelineItem[] | SpectrumItem[] | InsightItem[]
  memoryIds: string[]          // Array of memory IDs associated with this section
  metadata?: {                 // Optional metadata for customization
    icon?: string
    color?: string
    order?: number
  }
}

export interface ProfileData {
  name: string
  title: string
  bio: string
  sections: ProfileSection[]   // Flexible array of sections
  memories: Memory[]           // All memories associated with the profile
}

// Props interfaces for components
export interface BaseCardProps {
  onSectionDetail: (sectionId: string) => void
  onOpenMemories: (sectionId: string) => void
}

// New generic card props based on section
export interface SectionCardProps extends BaseCardProps {
  section: ProfileSection
}

// Specific card props for different presentation types
export interface ProgressBarCardProps extends BaseCardProps {
  section: ProfileSection & { type: "progressBar"; data: ProgressBarItem[] }
}

export interface TagsCardProps extends BaseCardProps {
  section: ProfileSection & { type: "tags"; data: TagItem[] }
}

export interface TimelineCardProps extends BaseCardProps {
  section: ProfileSection & { type: "timeline"; data: TimelineItem[] }
}

export interface SpectrumCardProps extends BaseCardProps {
  section: ProfileSection & { type: "spectrum"; data: SpectrumItem[] }
}

export interface InsightsCardProps extends BaseCardProps {
  section: ProfileSection & { type: "insights"; data: InsightItem[] }
}

export interface MetricsCardProps extends BaseCardProps {
  section: ProfileSection & { type: "metrics"; data: MetricItem[] }
}


export interface DetailPageProps {
  section: string
  profileData: ProfileData
  onBack: () => void
  onOpenMemories: (section: string) => void
}

export interface MemoryModalProps {
  isOpen: boolean
  onClose: () => void
  selectedSection: string | null
  memories: Memory[]
  onUpdateMemories: (memories: Memory[]) => void
  newMemoryContent: string
  onNewMemoryContentChange: (content: string) => void
  onAddMemory: () => void
  editingMemoryId: string | null
  onStartEdit: (memoryId: string) => void
  onStopEdit: () => void
  userId: string
  onProfileUpdating?: (isUpdating: boolean) => void  // Callback to notify parent about profile update loading state
}

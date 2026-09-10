// Memory stubs - Separate storage for user memories at different evolution stages
// These correspond to the three profile evolution stages (early, mid, advanced)

export interface StubMemory {
  id: string
  type: "user" | "ai"
  content: string
  source: string
  timestamp: string
  categories: string[]  // e.g., ["skills", "traits", "preferences", "goals", "achievements", "work-style", "learning-style"]
}

// ==============================================
// Memory Stub 1 - Early Stage (4 memories)
// ==============================================
export const memoryStub1: StubMemory[] = [
  {
    id: "mem-1",
    type: "ai",
    content: "Shows interest in learning React fundamentals",
    source: "Chat conversation analysis",
    timestamp: "2024-01-15T10:00:00Z",
    categories: ["skills", "learning-style"]
  },
  {
    id: "mem-2",
    type: "ai",
    content: "Expressed desire to improve design skills",
    source: "Goal setting discussion",
    timestamp: "2024-01-20T14:30:00Z",
    categories: ["goals", "skills"]
  },
  {
    id: "mem-3",
    type: "ai",
    content: "Asks detailed questions about design patterns",
    source: "Learning behavior analysis",
    timestamp: "2024-02-05T09:15:00Z",
    categories: ["learning-style", "traits"]
  },
  {
    id: "mem-4",
    type: "user",
    content: "I want to focus on AI product design this year",
    source: "User Added",
    timestamp: "2024-02-10T16:00:00Z",
    categories: ["goals"]
  }
]

// ==============================================
// Memory Stub 2 - Mid Stage (10 memories)
// ==============================================
export const memoryStub2: StubMemory[] = [
  // Keep previous memories from stage 1
  {
    id: "mem-1",
    type: "ai",
    content: "Shows interest in learning React fundamentals",
    source: "Chat conversation analysis",
    timestamp: "2024-01-15T10:00:00Z",
    categories: ["skills", "learning-style"]
  },
  {
    id: "mem-2",
    type: "ai",
    content: "Expressed desire to improve design skills",
    source: "Goal setting discussion",
    timestamp: "2024-01-20T14:30:00Z",
    categories: ["goals", "skills"]
  },
  {
    id: "mem-3",
    type: "ai",
    content: "Asks detailed questions about design patterns",
    source: "Learning behavior analysis",
    timestamp: "2024-02-05T09:15:00Z",
    categories: ["learning-style", "traits"]
  },
  {
    id: "mem-4",
    type: "user",
    content: "I want to focus on AI product design this year",
    source: "User Added",
    timestamp: "2024-02-10T16:00:00Z",
    categories: ["goals"]
  },
  // New memories for stage 2
  {
    id: "mem-5",
    type: "ai",
    content: "Demonstrated advanced prototyping skills in recent projects",
    source: "Project review analysis",
    timestamp: "2024-04-15T11:20:00Z",
    categories: ["skills", "achievements"]
  },
  {
    id: "mem-6",
    type: "ai",
    content: "Showed expertise in conducting user interviews",
    source: "Research session feedback",
    timestamp: "2024-05-10T15:45:00Z",
    categories: ["skills", "work-style"]
  },
  {
    id: "mem-7",
    type: "ai",
    content: "Expressed interest in learning backend development",
    source: "Career discussion",
    timestamp: "2024-05-20T10:30:00Z",
    categories: ["goals", "skills"]
  },
  {
    id: "mem-8",
    type: "ai",
    content: "Uses data analytics to validate design decisions",
    source: "Work pattern analysis",
    timestamp: "2024-06-01T14:00:00Z",
    categories: ["work-style", "skills"]
  },
  {
    id: "mem-9",
    type: "user",
    content: "Completed the UX research certification course",
    source: "User Added",
    timestamp: "2024-06-15T09:00:00Z",
    categories: ["achievements", "skills"]
  },
  {
    id: "mem-10",
    type: "ai",
    content: "Frequently mentions importance of work-life balance",
    source: "Lifestyle preference analysis",
    timestamp: "2024-06-20T16:30:00Z",
    categories: ["preferences", "traits"]
  }
]

// ==============================================
// Memory Stub 3 - Advanced Stage (22 memories)
// ==============================================
export const memoryStub3: StubMemory[] = [
  // All memories from previous stages
  {
    id: "mem-1",
    type: "ai",
    content: "Shows interest in learning React fundamentals",
    source: "Chat conversation analysis",
    timestamp: "2024-01-15T10:00:00Z",
    categories: ["skills", "learning-style"]
  },
  {
    id: "mem-2",
    type: "ai",
    content: "Expressed desire to improve design skills",
    source: "Goal setting discussion",
    timestamp: "2024-01-20T14:30:00Z",
    categories: ["goals", "skills"]
  },
  {
    id: "mem-3",
    type: "ai",
    content: "Asks detailed questions about design patterns",
    source: "Learning behavior analysis",
    timestamp: "2024-02-05T09:15:00Z",
    categories: ["learning-style", "traits"]
  },
  {
    id: "mem-4",
    type: "user",
    content: "I want to focus on AI product design this year",
    source: "User Added",
    timestamp: "2024-02-10T16:00:00Z",
    categories: ["goals"]
  },
  {
    id: "mem-5",
    type: "ai",
    content: "Demonstrated advanced prototyping skills in recent projects",
    source: "Project review analysis",
    timestamp: "2024-04-15T11:20:00Z",
    categories: ["skills", "achievements"]
  },
  {
    id: "mem-6",
    type: "ai",
    content: "Showed expertise in conducting user interviews",
    source: "Research session feedback",
    timestamp: "2024-05-10T15:45:00Z",
    categories: ["skills", "work-style"]
  },
  {
    id: "mem-7",
    type: "ai",
    content: "Expressed interest in learning backend development",
    source: "Career discussion",
    timestamp: "2024-05-20T10:30:00Z",
    categories: ["goals", "skills"]
  },
  {
    id: "mem-8",
    type: "ai",
    content: "Uses data analytics to validate design decisions",
    source: "Work pattern analysis",
    timestamp: "2024-06-01T14:00:00Z",
    categories: ["work-style", "skills"]
  },
  {
    id: "mem-9",
    type: "user",
    content: "Completed the UX research certification course",
    source: "User Added",
    timestamp: "2024-06-15T09:00:00Z",
    categories: ["achievements", "skills"]
  },
  {
    id: "mem-10",
    type: "ai",
    content: "Frequently mentions importance of work-life balance",
    source: "Lifestyle preference analysis",
    timestamp: "2024-06-20T16:30:00Z",
    categories: ["preferences", "traits"]
  },
  // New memories for stage 3
  {
    id: "mem-11",
    type: "ai",
    content: "Demonstrated expert-level AI interface design skills",
    source: "Portfolio review",
    timestamp: "2024-08-10T10:15:00Z",
    categories: ["skills", "achievements"]
  },
  {
    id: "mem-12",
    type: "ai",
    content: "Created interactive prototypes that impressed stakeholders",
    source: "Presentation feedback",
    timestamp: "2024-08-25T14:30:00Z",
    categories: ["skills", "achievements", "work-style"]
  },
  {
    id: "mem-13",
    type: "ai",
    content: "Built full-stack features for design system documentation",
    source: "Code review analysis",
    timestamp: "2024-09-05T09:45:00Z",
    categories: ["skills", "achievements"]
  },
  {
    id: "mem-14",
    type: "ai",
    content: "Shows strategic thinking in long-term design planning",
    source: "Strategy meeting analysis",
    timestamp: "2024-09-20T15:00:00Z",
    categories: ["traits", "work-style"]
  },
  {
    id: "mem-15",
    type: "ai",
    content: "Consistently provides quick and thoughtful responses",
    source: "Communication pattern analysis",
    timestamp: "2024-10-01T11:30:00Z",
    categories: ["traits", "work-style"]
  },
  {
    id: "mem-16",
    type: "ai",
    content: "Highly receptive to feedback and implements suggestions quickly",
    source: "Collaboration analysis",
    timestamp: "2024-10-08T16:20:00Z",
    categories: ["traits", "work-style"]
  },
  {
    id: "mem-17",
    type: "user",
    content: "Published the company design system - proud of this achievement!",
    source: "User Added",
    timestamp: "2024-08-15T10:00:00Z",
    categories: ["achievements"]
  },
  {
    id: "mem-18",
    type: "user",
    content: "Now leading a team of 3 junior designers",
    source: "User Added",
    timestamp: "2024-11-01T09:00:00Z",
    categories: ["achievements", "work-style"]
  },
  {
    id: "mem-19",
    type: "ai",
    content: "Values team success over individual achievements",
    source: "Work behavior analysis",
    timestamp: "2024-10-15T14:45:00Z",
    categories: ["traits", "preferences"]
  },
  {
    id: "mem-20",
    type: "ai",
    content: "Most productive during late evening hours (9-11pm)",
    source: "Activity pattern analysis",
    timestamp: "2024-09-10T22:30:00Z",
    categories: ["preferences", "work-style"]
  },
  {
    id: "mem-21",
    type: "ai",
    content: "Visual learner - prefers diagrams over text explanations",
    source: "Learning style analysis",
    timestamp: "2024-09-25T10:15:00Z",
    categories: ["learning-style", "preferences"]
  },
  {
    id: "mem-22",
    type: "ai",
    content: "Shows emerging leadership qualities in team discussions",
    source: "Team interaction analysis",
    timestamp: "2024-10-12T15:30:00Z",
    categories: ["traits", "skills"]
  }
]

// Export all memory stubs
export const allMemoryStubs = [memoryStub1, memoryStub2, memoryStub3]

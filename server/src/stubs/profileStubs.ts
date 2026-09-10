// Profile stubs representing the same user at different time points
// Simulating how profile evolves after AI learns more about the user
export interface StubProfileSection {
  id: string
  type: "progressBar" | "tags" | "timeline" | "spectrum" | "insights" | "metrics"
  title: string
  description: string
  data: any[]
  memoryIds: string[]
  order: number
  metadata?: {
    icon?: string
    color?: string
    order?: number
  }
}

export interface StubProfile {
  userId: string
  name: string
  title: string
  bio: string
  sections: StubProfileSection[]
}

// ==============================================
// Stub 1
// ==============================================
export const profileStub1: StubProfile = {
  userId: "user-alex-chen",
  name: "Alex Chen",
  title: "Junior Product Designer",
  bio: "Learning to design better user experiences with a focus on AI products.",
  sections: [
    {
      id: "frontend-skills",
      type: "progressBar",
      title: "Frontend Development Skills",
      description: "Web development and UI/UX technical capabilities",
      memoryIds: ["mem-1", "mem-2"],
      data: [
        { id: "skill-1", name: "UI Design", level: 70, desc: "Basic understanding of design principles", order: 1 },
        { id: "skill-2", name: "Prototyping", level: 65, desc: "Learning Figma basics", order: 2 },
        { id: "skill-3", name: "User Research", level: 55, desc: "Limited experience with user interviews", order: 3 },
      ],
      order: 1
    },
    {
      id: "thinking-patterns",
      type: "tags",
      title: "Cognitive Patterns",
      description: "Thinking styles and decision-making approaches",
      memoryIds: ["mem-3"],
      data: [
        { id: "thinking-1", label: "Curious", strength: 85, desc: "Always asking questions", order: 1 },
        { id: "thinking-2", label: "Detail-Oriented", strength: 70, desc: "Pays attention to small details", order: 2 },
        { id: "thinking-3", label: "Collaborative", strength: 60, desc: "Likes working with others", order: 3 },
      ],
      order: 2
    },
    {
      id: "learning-journey",
      type: "timeline",
      title: "Learning & Growth Timeline",
      description: "Key milestones in skill development journey",
      memoryIds: ["mem-4"],
      data: [
        { id: "timeline-1", date: "2024-01", event: "Started UI/UX Learning", description: "Enrolled in design bootcamp", category: "education", order: 1 },
        { id: "timeline-2", date: "2024-03", event: "First Design Project", description: "Simple landing page design", category: "milestone", order: 2 },
      ],
      order: 3
    }
  ]
}

// ==============================================
// Stub 2
// ==============================================
export const profileStub2: StubProfile = {
  userId: "user-alex-chen",
  name: "Alex Chen",
  title: "Product Designer",
  bio: "Passionate about creating intuitive AI experiences. Currently focusing on user research and prototyping.",
  sections: [
    {
      id: "frontend-skills",
      type: "progressBar",
      title: "Frontend Development Skills",
      description: "Web development and UI/UX technical capabilities",
      memoryIds: ["mem-1", "mem-2", "mem-5", "mem-6"],
      data: [
        { id: "skill-1", name: "AI/UX Design", level: 85, desc: "Growing expertise in AI interface design", order: 1 },
        { id: "skill-2", name: "Prototyping", level: 80, desc: "Proficient in Figma and Framer", order: 2 },
        { id: "skill-3", name: "User Research", level: 75, desc: "Conducted several user interviews", order: 3 },
        { id: "skill-4", name: "Design Systems", level: 70, desc: "Building component libraries", order: 4 },
      ],
      order: 1
    },
    {
      id: "backend-skills",
      type: "progressBar",
      title: "Backend Development Skills",
      description: "Server-side and API technical capabilities",
      memoryIds: ["mem-7"],
      data: [
        { id: "backend-1", name: "Node.js", level: 60, desc: "Learning backend basics", order: 1 },
        { id: "backend-2", name: "REST APIs", level: 55, desc: "Understanding API design", order: 2 },
      ]
,
      order: 2
    },
    {
      id: "thinking-patterns",
      type: "tags",
      title: "Cognitive Patterns",
      description: "Thinking styles and decision-making approaches",
      memoryIds: ["mem-3", "mem-8"],
      data: [
        { id: "thinking-1", label: "Detail-Oriented", strength: 85, desc: "Meticulous attention to specifications", order: 1 },
        { id: "thinking-2", label: "Fast Iteration", strength: 80, desc: "Quick prototyping cycles", order: 2 },
        { id: "thinking-3", label: "Collaborative", strength: 75, desc: "Strong team player", order: 3 },
        { id: "thinking-4", label: "Data-Driven", strength: 70, desc: "Uses analytics to inform decisions", order: 4 },
      ],
      order: 3
    },
    {
      id: "learning-journey",
      type: "timeline",
      title: "Learning & Growth Timeline",
      description: "Key milestones in skill development journey",
      memoryIds: ["mem-4", "mem-9"],
      data: [
        { id: "timeline-1", date: "2024-01", event: "Started UI/UX Learning", description: "Enrolled in design bootcamp", category: "education", order: 1 },
        { id: "timeline-2", date: "2024-03", event: "First Design Project", description: "Simple landing page design", category: "milestone", order: 2 },
        { id: "timeline-3", date: "2024-05", event: "AI Design Workshop", description: "Attended 2-day intensive workshop", category: "skill expansion", order: 3 },
        { id: "timeline-4", date: "2024-06", event: "User Research Certification", description: "Completed UX research course", category: "achievement", order: 4 },
      ],
      order: 4
    },
    {
      id: "work-values",
      type: "spectrum",
      title: "Work Values & Motivations",
      description: "Core values and work-life priorities",
      memoryIds: ["mem-10"],
      data: [
        { id: "spectrum-1", name: "Work-Life Balance", position: 75, leftLabel: "Work-Life Balance", rightLabel: "Career Focus", desc: "Values balance", order: 1 },
        { id: "spectrum-2", name: "Technical Pursuit", position: 80, leftLabel: "Technical Pursuit", rightLabel: "People Focus", desc: "Strong technical interest", order: 2 },
      ],
      order: 5
    }
  ]
}

// ==============================================
// Stub 3
// ==============================================
export const profileStub3: StubProfile = {
  userId: "user-alex-chen",
  name: "Alex Chen",
  title: "Senior AI/ML Product Designer",
  bio: "Passionate about creating intuitive AI experiences that bridge human creativity with machine intelligence. Leading design initiatives for AI-powered products.",
  sections: [
    {
      id: "frontend-skills",
      type: "progressBar",
      title: "Frontend Development Skills",
      description: "Web development and UI/UX technical capabilities",
      memoryIds: ["mem-1", "mem-2", "mem-5", "mem-6", "mem-11", "mem-12"],
      data: [
        { id: "skill-1", name: "AI/UX Design", level: 95, desc: "Expert in designing intuitive AI interfaces", order: 1 },
        { id: "skill-2", name: "Prototyping", level: 90, desc: "Master of Figma, Framer, and interactive prototypes", order: 2 },
        { id: "skill-3", name: "User Research", level: 88, desc: "Leads research initiatives and usability testing", order: 3 },
        { id: "skill-4", name: "Design Systems", level: 85, desc: "Built comprehensive design systems", order: 4 },
        { id: "skill-5", name: "Frontend Dev", level: 75, desc: "Can implement designs in React", order: 5 },
      ],
      order: 1
    },
    {
      id: "backend-skills",
      type: "progressBar",
      title: "Backend Development Skills",
      description: "Server-side, API, and database technical capabilities",
      memoryIds: ["mem-7", "mem-13"],
      data: [
        { id: "backend-1", name: "Node.js", level: 80, desc: "Built RESTful APIs and real-time services", order: 1 },
        { id: "backend-2", name: "Prisma ORM", level: 75, desc: "Designed scalable database schemas", order: 2 },
        { id: "backend-3", name: "PostgreSQL", level: 72, desc: "Experience with queries and optimization", order: 3 },
        { id: "backend-4", name: "Authentication", level: 70, desc: "Implemented secure auth flows", order: 4 },
      ],
      order: 2
    },
    {
      id: "thinking-patterns",
      type: "tags",
      title: "Cognitive Patterns",
      description: "Thinking styles and decision-making approaches",
      memoryIds: ["mem-3", "mem-8", "mem-14"],
      data: [
        { id: "thinking-1", label: "Detail-Oriented", strength: 90, desc: "Meticulous attention to design specifications", order: 1 },
        { id: "thinking-2", label: "Fast Iteration", strength: 88, desc: "Rapid prototyping and testing cycles", order: 2 },
        { id: "thinking-3", label: "Collaborative", strength: 85, desc: "Values team input and consensus-building", order: 3 },
        { id: "thinking-4", label: "Data-Driven", strength: 82, desc: "Relies on analytics and metrics", order: 4 },
        { id: "thinking-5", label: "Innovative", strength: 80, desc: "Explores cutting-edge patterns", order: 5 },
        { id: "thinking-6", label: "Strategic", strength: 75, desc: "Long-term thinking in design decisions", order: 6 },
      ],
      order: 3
    },
    {
      id: "communication-metrics",
      type: "metrics",
      title: "Communication & Collaboration",
      description: "Interaction patterns and collaboration preferences",
      memoryIds: ["mem-15", "mem-16"],
      data: [
        { id: "metric-1", name: "Response Speed", value: "2-5 minutes", score: 90, type: "metric", desc: "Very quick response during active hours", order: 1 },
        { id: "metric-2", name: "Collaboration Style", value: "Structured & Flexible", type: "style", desc: "Adapts to team needs", order: 2 },
        { id: "metric-3", name: "Feedback Openness", value: "98%", score: 98, type: "metric", desc: "Highly receptive to feedback", order: 3 },
        { id: "metric-4", name: "Communication Tone", value: "Professional & Friendly", type: "style", desc: "Approachable yet focused", order: 4 },
      ],
      order: 4
    },
    {
      id: "learning-journey",
      type: "timeline",
      title: "Learning & Growth Timeline",
      description: "Key milestones in skill development journey",
      memoryIds: ["mem-4", "mem-9", "mem-17", "mem-18"],
      data: [
        { id: "timeline-1", date: "2024-11", dateRange: "2024-11 - Present", event: "Senior Designer Role", description: "Leading design team initiatives", category: "leadership", order: 1 },
        { id: "timeline-2", date: "2024-09", event: "AI Tools Integration", description: "Integrated AI into design workflow", category: "technology", order: 2 },
        { id: "timeline-3", date: "2024-08", event: "Design System Launch", description: "Published company-wide design system", category: "achievement", order: 3 },
        { id: "timeline-4", date: "2024-06", event: "User Research Certification", description: "Completed UX research course", category: "achievement", order: 4 },
        { id: "timeline-5", date: "2024-05", event: "AI Design Workshop", description: "Attended intensive workshop", category: "skill expansion", order: 5 },
        { id: "timeline-6", date: "2024-03", event: "First Design Project", description: "Landing page design", category: "milestone", order: 6 },
      ],
      order: 5
    },
    {
      id: "work-values",
      type: "spectrum",
      title: "Work Values & Motivations",
      description: "Core values and work-life priorities",
      memoryIds: ["mem-10", "mem-19"],
      data: [
        { id: "spectrum-1", name: "Work-Life Balance", position: 80, leftLabel: "Work-Life Balance", rightLabel: "Career Focus", desc: "Strong preference for balance", order: 1 },
        { id: "spectrum-2", name: "Technical Pursuit", position: 90, leftLabel: "Technical Pursuit", rightLabel: "People Focus", desc: "High technical curiosity", order: 2 },
        { id: "spectrum-3", name: "Team Achievement", position: 85, leftLabel: "Individual", rightLabel: "Team Achievement", desc: "Values team success", order: 3 },
        { id: "spectrum-4", name: "Innovation", position: 78, leftLabel: "Stability", rightLabel: "Innovation", desc: "Leans toward innovation", order: 4 },
      ],
      order: 6
    },
    {
      id: "behavioral-insights",
      type: "insights",
      title: "AI Behavioral Insights",
      description: "Unique patterns discovered through AI analysis",
      memoryIds: ["mem-20", "mem-21", "mem-22"],
      data: [
        { id: "insight-1", insight: "Most active Tuesday 9-11pm with deepest questions", desc: "Peak engagement during late evening", category: "productivity", icon: "TrendingUp", order: 1 },
        { id: "insight-2", insight: "Frontend learning 30% faster than backend", desc: "Natural aptitude for visual problem-solving", category: "learning", icon: "Target", order: 2 },
        { id: "insight-3", insight: "Strong visual vocabulary indicates design talent", desc: "Visual-spatial intelligence", category: "design", icon: "BookOpen", order: 3 },
        { id: "insight-4", insight: "Theory-first learning style preference", desc: "Seeks conceptual understanding first", category: "learning", icon: "MessageCircle", order: 4 },
        { id: "insight-5", insight: "Leads design discussions with confidence", desc: "Leadership qualities emerging", category: "leadership", icon: "Users", order: 5 },
      ],
      order: 7
    }
  ]
}

// Export all profile stubs
export const allProfileStubs = [profileStub1, profileStub2, profileStub3]

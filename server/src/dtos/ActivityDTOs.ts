export interface ActivityQuestionDTO {
  id: string
  questionText: string
}

export interface ActivityDTO {
  id: string
  name: string
  description: string | null
  category: string | null
  createdAt: string
  questions: ActivityQuestionDTO[]
}

export interface GetActivitiesResponse {
  status: number
  message: string
  data: {
    activities: ActivityDTO[]
  }
}

export interface ActivityStatusDTO {
  activityId: string
  activityName: string
  status: 'not_started' | 'in_progress' | 'completed'
  questionCount: number
  answeredCount: number
  extractedCount: number
}

export interface GetActivityStatusResponse {
  status: number
  message: string
  data: {
    statuses: ActivityStatusDTO[]
  }
}

export interface ApiResponse<T> {
  status: number
  message: string
  apiId?: string
  data?: T
  error?: {
    code: string
    details?: any
  }
}

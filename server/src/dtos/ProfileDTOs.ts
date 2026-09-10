export interface ProfileSection {
  id: string;
  userId: string;
  title: string;
  content: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileViewResponse {
  userId: string;
  name?: string;
  title?: string;
  bio?: string;
  sections: ProfileSection[];
  memories?: any[];
}

export interface GenerateProfileRequest {
  userId?: string;
}

export interface GenerateProfileResponse {
  status: number;
  message: string;
  apiId: string;
  data: {
    userId: string;
    generatedAt: string;
    model: string;
    sectionsCount: number;
    latency_ms?: number;
  };
}

export interface TriggerAutoUpdateRequest {
  userId: string;
  successCount: number;
}

export interface TriggerAutoUpdateResponse {
  status: number;
  message: string;
  apiId: string;
  data: {
    triggered: boolean;
    newCount?: number;
    message: string;
    error?: string;
    profileData?: any;
  };
}

export interface GEvalResponse {
  status: number;
  message: string;
  apiId: string;
  data: {
    score: number;
  };
}

export interface GEvalRequest {
  userId: string;
}

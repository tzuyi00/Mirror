export interface CreateMemoryRequest {
  userId: string;
  type: 'user' | 'ai';
  content: string;
  source?: string;
  categories?: string[];
  sectionIds?: string[];
}

export interface UpdateMemoryRequest {
  content?: string;
  source?: string;
  categories?: string[];
}

export interface Memory {
  id: string;
  userId: string;
  type: 'user' | 'ai';
  content: string;
  source: string;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryResponse {
  status: number;
  message: string;
  apiId: string;
  data: {
    memory?: Memory;
  };
}

export interface ThreadCreateRequest {
  // No required fields for thread creation
}

export interface ThreadCreateResponse {
  threadId: string;
  createdAt: string;
}

export interface ThreadMessagesResponse {
  threadId: string;
  messages: {
    id: string;
    createdAt: string;
    role: string;
    data: any;
  }[];
}

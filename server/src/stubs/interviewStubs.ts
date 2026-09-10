// Interview response stub data - Interview-specific responses for testing without actual AI service
// Similar structure to chatStubs.ts but tailored for interview scenarios

// ============================================
// Type Definitions for Interview
// ============================================

export interface InterviewReply {
  ok: boolean // true means success; false means error
  replyQuestion?: string // Interview question response
  interviewEnded?: boolean // true when AI signals the interview is complete (no more questions)
  error?: {
    code: string // e.g., "invalid_input" | "invalid_activity" | "internal_error"
    message: string // Human-readable message for frontend
    retryable?: boolean
    details?: unknown
  }

  meta: {
    userId: string
    threadId?: string // Thread identifier
    createdAt: string // ISO string
    model?: string // e.g., "interview-v1"
    latency_ms?: number
  }
}

// ============================================
// Interview Stub Data
// ============================================

const interviewQuestions = [
  "Tell me about your professional background and key achievements.",
  "What are your strengths and how have you leveraged them in your career?",
  "Describe a challenging situation you faced and how you resolved it.",
  "What motivates you professionally and why?",
  "How do you approach learning and self-improvement?",
  "Tell me about a project you're proud of and your role in it.",
  "How do you handle feedback and criticism?",
  "What are your career goals for the next 5 years?",
  "Describe your leadership style and give an example.",
  "How do you prioritize tasks when you have multiple deadlines?"
];

const interviewFeedbacks = [
  "Great response! You provided specific examples that demonstrate your competency.",
  "I appreciate the detailed explanation. Your experience is relevant to this role.",
  "That's a thoughtful answer. Can you tell me more about the impact you made?",
  "Interesting perspective. How did you approach this differently compared to others?",
  "I see you have strong skills in this area. How do you continue to develop them?",
  "Your answer shows good self-awareness. Tell me about a time you applied this.",
  "That's impressive work. What did you learn from this experience?",
  "I appreciate your honesty. How do you plan to address this area of growth?"
];

/**
 * Generate interview response stub
 * Simulates AI interviewer asking questions or providing feedback
 * 
 * @param userMessage - User's previous response (empty for start activity)
 * @param userId - User identifier
 * @param threadId - Thread identifier
 * @param activityId - Activity identifier
 * @param userMessageId - ID of user's message (NULL for start activity)
 * @param questionMessageId - ID of question message (NULL for start activity)
 * @returns InterviewReply with interview response
 */
export function getInterviewStub(
  userMessage: string,
  userId: string,
  threadId: string,
  activityId: string,
  userMessageId?: string,
  questionMessageId?: string
): InterviewReply {
  const now = new Date().toISOString();

  // Simulate interview flow
  // If it's the first message (empty or "start"), ask the first question
  // Otherwise, provide feedback on the previous answer, then ask next question
  
  let replyQuestion = "";

  if (userMessage.trim() === "" || userMessage.toLowerCase() === "start") {
    // Initial question
    replyQuestion = interviewQuestions[0];
  } else {
    // Provide feedback on previous answer, then ask next question
    const feedbackIndex = Math.floor(Math.random() * interviewFeedbacks.length);
    const feedback = interviewFeedbacks[feedbackIndex];
    
    // Get next question (randomly select)
    const questionIndex = Math.floor(Math.random() * interviewQuestions.length);
    const nextQuestion = interviewQuestions[questionIndex];
    
    replyQuestion = `${feedback}\n\nNext question: ${nextQuestion}`;
  }

  return {
    ok: true,
    replyQuestion,
    meta: {
      userId,
      threadId,
      createdAt: now,
      model: "interview-stub-v1",
      latency_ms: Math.floor(Math.random() * 1000) + 500, // 500-1500ms
    },
  };
}

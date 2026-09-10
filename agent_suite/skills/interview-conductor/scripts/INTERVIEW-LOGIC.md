# Interview Conductor Implementation Guide

## Interview State Machine

```
IDLE
├─ startInterview() → QUESTION_PENDING
│   └─ Load first question
│
QUESTION_PENDING
├─ submitAnswer() → PROCESSING
│   └─ Save user answer
│
PROCESSING
├─ generateNextQuestion() → QUESTION_PENDING (if questions remain)
├─ End condition met → COMPLETED
│
COMPLETED
└─ Interview finished, memories extracted
```

## Question Generation Strategy

### Adaptive Questioning
- Analyze previous answer quality
- Generate follow-up questions on interesting topics
- Avoid repeating topics
- Escalate to deeper questions based on responses

### Question Types
1. **Opening**: Broad, introduction question
2. **Depth**: Follow-up on previous answer
3. **Breadth**: Explore different topic
4. **Validation**: Confirm understanding
5. **Closing**: Summary or reflection question

### Interview Structure
- **Duration**: Typically 5-10 questions per session
- **Time per question**: 2-5 minutes expected
- **Timeout**: 15 minutes of inactivity → auto-complete
- **Recovery**: Can resume interrupted interview

## Answer Evaluation

### Quality Assessment
- Length: Minimum ~50 characters for meaningful response
- Depth: Multi-sentence responses preferred
- Relevance: Answer addresses the question
- Clarity: Clear communication without jargon

### Insight Extraction
From each answer, extract:
1. Direct facts stated
2. Implied preferences or values
3. Communication style indicators
4. Areas for follow-up questions

## Memory Creation from Interviews

For each interview answer:
1. Extract key facts
2. Infer implied information
3. Create memories with:
   - type: "ai"
   - source: "interview"
   - categories: ["experience", "skills", etc.]
   - sectionIds: Link to profile sections

## State Persistence

Store in database:
- Interview status per user per activity
- Last question asked (with timestamp)
- Answers provided (immutable)
- Progress tracking
- Completion timestamp

# Memory Categories and Classifications

## Standard Memory Categories

### Professional
- **skills**: Technical abilities, programming languages, frameworks
- **experience**: Past roles, companies, projects, achievements
- **certifications**: Professional credentials and training

### Personal Development
- **education**: Academic background, degrees, courses
- **goals**: Career aspirations, learning objectives
- **interests**: Hobbies, passions, personal projects

### Behavioral
- **personality**: Traits, values, communication style
- **preferences**: Work style preferences, communication preferences
- **strengths**: Known strengths and capabilities
- **weaknesses**: Areas for improvement

### Context
- **background**: Life circumstances, location, context
- **constraints**: Limitations, availability, constraints
- **achievements**: Notable accomplishments

## Memory Type Classification

### `type: "ai"` - AI-Extracted Memories
- Automatically extracted from chat responses
- Based on conversational context
- Lower confidence (may need human review)
- Source: `chat`, `interview`, `activity`

### `type: "user"` - User-Provided Memories
- Explicitly entered by user
- Higher confidence
- Can be manual or from forms
- Source: `manual`, `form`, `profile-edit`

## Extraction Guidelines

When processing AI responses for memory extraction:

1. **Identify factual statements**: Look for clear assertions
2. **Classify certainty**: High confidence vs. uncertain claims
3. **Extract key facts**: Single declarative statements
4. **Determine relevance**: Filter for profile-relevant information
5. **Assign categories**: Use consistent categorization
6. **Link to sections**: Map to profile section when possible

## Deduplication Strategy

Before creating memories:
1. Check existing memories for similar content
2. Use semantic similarity (not just string matching)
3. Merge duplicates with different sources
4. Preserve source chain for audit trail

# Profile Generation Strategy

## Profile Section Types

### Standard Profile Sections

1. **Professional Summary**
   - Synthesized from skills and experience
   - 2-3 sentence overview
   - Top skills highlighted

2. **Core Competencies**
   - Extracted from memory type: "skill"
   - Grouped by domain
   - Proficiency levels if available

3. **Professional Experience**
   - From memory type: "experience"
   - Chronological order
   - Key achievements highlighted

4. **Education & Certifications**
   - From memory type: "education"
   - Institutions, years, credentials

5. **Career Goals & Aspirations**
   - From memory type: "goals"
   - Direction and objectives
   - 3-5 year outlook

6. **Working Style & Communication**
   - From memory type: "personality", "preferences"
   - Communication style
   - Collaboration approach

7. **Personal Interests**
   - From memory type: "interests"
   - Hobbies and passions
   - Outside-work activities

## Generation Algorithm

```
1. Fetch all memories for user
2. Segment by category/type
3. For each profile section:
   a. Collect relevant memories
   b. Call AI to synthesize
   c. Generate section content
   d. Format for display
4. Create composite profile
5. Calculate G-Eval score
6. Save to database
```

## Profile Quality Metrics

### G-Eval Scoring Factors
- Completeness: Coverage of key sections
- Coherence: Internal consistency
- Specificity: Concrete details vs. generic statements
- Uniqueness: Distinguishes user from others
- Relevance: Memories aligned with profile goals

### Thresholds
- **Complete**: G-Eval score > 75
- **Adequate**: G-Eval score 50-75
- **Incomplete**: G-Eval score < 50

## Auto-Update Triggers

### Threshold Configuration
- Update after every 5 successful memory operations
- Update immediately if high-impact memories added
- Manual trigger available anytime

### Update Process
1. Receive trigger with successCount
2. Check if threshold met
3. Fetch updated memories
4. Regenerate affected sections
5. Recalculate G-Eval
6. Return updated profile

## Profile Output Format

```json
{
  "userId": "string",
  "sections": [
    {
      "id": "section-1",
      "title": "Professional Summary",
      "content": "string",
      "relatedMemoryIds": ["mem-1", "mem-2"]
    }
  ],
  "metadata": {
    "generatedAt": "ISO 8601",
    "gEvalScore": 82,
    "lastUpdatedAt": "ISO 8601",
    "memoryCount": 15,
    "versionNumber": 1
  }
}
```

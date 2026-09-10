import { Memory, ProfileSection } from "@/components/profile/types";

/**
 * Groups memories by section titles from profile sections
 * Returns a map of sectionTitle -> Memory[]
 * 
 * Example:
 * Input: [memory1, memory2], [section1{title:'Skills', memoryIds:['m1']}, section2{title:'Experience', memoryIds:['m2']}]
 * Output: { 'Skills': [memory1], 'Experience': [memory2] }
 */
export function groupMemoriesBySection(
  memories: Memory[],
  sections: ProfileSection[]
): Record<string, Memory[]> {
  console.log('[Profile Utils] Grouping memories by section...', memories, sections);
  const memoryMap = new Map<string, Memory>();
  memories.forEach(memory => memoryMap.set(memory.id, memory));

  const grouped: Record<string, Memory[]> = {};

  sections.forEach(section => {
    const sectionMemories: Memory[] = [];
    
    if (section.memoryIds && section.memoryIds.length > 0) {
      section.memoryIds.forEach(memoryId => {
        const memory = memoryMap.get(memoryId);
        if (memory) {
          sectionMemories.push(memory);
        }
      });
    }
    
    grouped[section.title] = sectionMemories;
  });

  return grouped;
}

/**
 * Gets all memories for a specific section by section ID
 * Returns empty array if section not found or has no memories
 * 
 * Example:
 * Input: 'section1', [memory1, memory2], [section1{memoryIds:['m1','m2']}]
 * Output: [memory1, memory2]
 */
export function getSectionMemories(
  sectionId: string,
  memories: Memory[],
  sections: ProfileSection[]
): Memory[] {
  const section = sections.find(s => s.id === sectionId);
  if (!section || !section.memoryIds || section.memoryIds.length === 0) {
    return [];
  }

  const memoryMap = new Map<string, Memory>();
  memories.forEach(memory => memoryMap.set(memory.id, memory));

  const sectionMemories: Memory[] = [];
  section.memoryIds.forEach(memoryId => {
    const memory = memoryMap.get(memoryId);
    if (memory) {
      sectionMemories.push(memory);
    }
  });

  return sectionMemories;
}

/**
 * Gets all memories (convenience function)
 * Simply returns the memories array
 * 
 * Example:
 * Input: [memory1, memory2, memory3]
 * Output: [memory1, memory2, memory3]
 */
export function getAllMemories(memories: Memory[]): Memory[] {
  return memories;
}

/**
 * Filters memories by type (user or ai)
 * 
 * Example:
 * Input: [memory1{type:'user'}, memory2{type:'ai'}], 'user'
 * Output: [memory1]
 */
export function filterMemoriesByType(
  memories: Memory[],
  type: 'user' | 'ai'
): Memory[] {
  return memories.filter(memory => memory.type === type);
}

/**
 * Sorts memories by timestamp (newest first by default)
 * 
 * Example:
 * Input: [memory1{timestamp:'2023-01-01'}, memory2{timestamp:'2023-01-02'}], 'desc'
 * Output: [memory2, memory1]
 */
export function sortMemoriesByTimestamp(
  memories: Memory[],
  order: 'asc' | 'desc' = 'desc'
): Memory[] {
  return [...memories].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return order === 'desc' ? timeB - timeA : timeA - timeB;
  });
}

/**
 * Formats timestamp to localized date string
 * 
 * Example:
 * Input: '2023-01-01T12:00:00Z'
 * Output: 'January 1, 2023'
 */
export function formatMemoryTimestamp(
  timestamp: Date | string,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };

  return date.toLocaleDateString(locale, defaultOptions);
}

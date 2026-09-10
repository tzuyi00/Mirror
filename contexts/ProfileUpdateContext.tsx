"use client";

import React, { createContext, useContext, useCallback, useState } from "react";
import { Memory, ProfileData } from "@/components/profile/types";
import { groupMemoriesBySection } from "@/lib/profileUtils";

interface ProfileUpdateContextType {
  triggerProfileUpdate: (profileData: any, showLoading?: boolean) => void;
  pendingProfileData: ProfileData | null;
  pendingAllMemories: Memory[];
  pendingMemoriesBySection: Record<string, Memory[]>;
  wsUpdating: boolean;
  clearPendingUpdate: () => void;
}

const ProfileUpdateContext = createContext<ProfileUpdateContextType | undefined>(undefined);

export interface ProfileUpdateProviderProps {
  children: React.ReactNode;
}

export function ProfileUpdateProvider({ children }: ProfileUpdateProviderProps) {
  const [wsUpdating, setWsUpdating] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState<ProfileData | null>(null);
  const [pendingAllMemories, setPendingAllMemories] = useState<Memory[]>([]);
  const [pendingMemoriesBySection, setPendingMemoriesBySection] = useState<Record<string, Memory[]>>({});

  const triggerProfileUpdate = useCallback((profileData: any, showLoading: boolean = true) => {
    if (!profileData) {
      console.warn('[ProfileUpdateContext] No profileData provided');
      return;
    }

    console.log('[ProfileUpdateContext] Triggering profile update', profileData);

    // Prepare data
    const newProfileData: ProfileData = {
      name: profileData.name,
      title: profileData.title,
      bio: profileData.bio,
      sections: profileData.sections,
      memories: profileData.memories
    };

    const newAllMemories: Memory[] = profileData.memories;

    // Group memories by section
    const newMemoriesBySection = groupMemoriesBySection(
      profileData.memories,
      profileData.sections
    );

    console.log('$ [ProfileUpdateContext] Grouped memories:', newMemoriesBySection);

    if (showLoading) {
      // Show loading state immediately
      setWsUpdating(true);
      
      // Store pending data and turn off loading after 500ms
      setTimeout(() => {
        setPendingProfileData(newProfileData);
        setPendingAllMemories(newAllMemories);
        setPendingMemoriesBySection(newMemoriesBySection);
        
        // Turn off loading after data is set
        setTimeout(() => {
          setWsUpdating(false);
        }, 0);
      }, 500);
    } else {
      setPendingProfileData(newProfileData);
      setPendingAllMemories(newAllMemories);
      setPendingMemoriesBySection(newMemoriesBySection);
    }
  }, []);

  const clearPendingUpdate = useCallback(() => {
    setPendingProfileData(null);
    setPendingAllMemories([]);
    setPendingMemoriesBySection({});
  }, []);

  return (
    <ProfileUpdateContext.Provider value={{ 
      triggerProfileUpdate,
      pendingProfileData,
      pendingAllMemories,
      pendingMemoriesBySection,
      wsUpdating,
      clearPendingUpdate
    }}>
      {children}
    </ProfileUpdateContext.Provider>
  );
}

export function useProfileUpdate() {
  const context = useContext(ProfileUpdateContext);
  if (!context) {
    throw new Error("useProfileUpdate must be used within ProfileUpdateProvider");
  }
  return context;
}

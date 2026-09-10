"use client"

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useChatMode } from '@/contexts/ChatModeContext';
import { useSharedWebSocket } from '@/contexts/WebSocketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getGEval, getActivities, getActivityStatus } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import ActivityCard from '@/components/activities/ActivityCard';

interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  questions?: Array<{
    id: string;
    questionText: string;
  }>;
}

export default function ActivitiesPage() {
  const { data: session } = useSession();
  const { mode, activityId, switchToImpersonation, switchToInterviewer } = useChatMode();
  
  const [gEvalScore, setGEvalScore] = useState<number | null>(null);
  const [gEvalLoading, setGEvalLoading] = useState(true);
  const [gEvalError, setGEvalError] = useState<string | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const [activityStatuses, setActivityStatuses] = useState<Map<string, 'not_started' | 'in_progress' | 'completed'>>(new Map());
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Fetch global G-Eval score on mount
  useEffect(() => {
    if (!session?.user?.id) {
      setGEvalLoading(false);
      return;
    }

    const fetchGEvalScore = async () => {
      setGEvalLoading(true);
      setGEvalError(null);

      try {
        const result = await getGEval(session.user.id);
        setGEvalScore(result.score);
        console.log('[ActivitiesPage] G-Eval score for user', session.user.id, ':', result.score);
      } catch (error) {
        console.error('[ActivitiesPage] Failed to fetch G-Eval score:', error);
        setGEvalError(error instanceof Error ? error.message : 'Failed to load assessment');
      } finally {
        setGEvalLoading(false);
      }
    };

    fetchGEvalScore();
  }, [session?.user?.id]);

  // Fetch activities from API on mount
  useEffect(() => {
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      setActivitiesError(null);

      try {
        const result = await getActivities();
        setActivities(result.activities);
        console.log('[ActivitiesPage] Loaded activities:', result.activities);
      } catch (error) {
        console.error('[ActivitiesPage] Failed to fetch activities:', error);
        setActivitiesError(error instanceof Error ? error.message : 'Failed to load activities');
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Fetch activity statuses for current user
  useEffect(() => {
    if (!session?.user?.id) {
      setStatusLoading(false);
      return;
    }

    const fetchActivityStatuses = async () => {
      setStatusLoading(true);
      setStatusError(null);

      try {
        const result = await getActivityStatus(session.user.id);
        
        // Create a map of activityId -> status for quick lookup
        const statusMap = new Map<string, 'not_started' | 'in_progress' | 'completed'>();
        result.statuses.forEach(status => {
          statusMap.set(status.activityId, status.status);
        });
        
        setActivityStatuses(statusMap);
        console.log('[ActivitiesPage] Loaded activity statuses:', result.statuses);
      } catch (error) {
        console.error('[ActivitiesPage] Failed to fetch activity statuses:', error);
        setStatusError(error instanceof Error ? error.message : 'Failed to load activity statuses');
      } finally {
        setStatusLoading(false);
      }
    };

    fetchActivityStatuses();
  }, [session?.user?.id]);

  // Listen for interview_ended event and refresh activity status
  const { interviewEnded } = useSharedWebSocket();
  
  useEffect(() => {
    if (!interviewEnded || !session?.user?.id) return;
    
    console.log('[ActivitiesPage] Interview ended, refreshing activity statuses...');
    
    const refreshActivityStatuses = async () => {
      try {
        const result = await getActivityStatus(session.user.id);
        
        // Create a new map of activityId -> status for quick lookup
        const statusMap = new Map<string, 'not_started' | 'in_progress' | 'completed'>();
        result.statuses.forEach(status => {
          statusMap.set(status.activityId, status.status);
        });
        
        setActivityStatuses(statusMap);
        console.log('[ActivitiesPage] Activity statuses updated:', result.statuses);
      } catch (error) {
        console.error('[ActivitiesPage] Failed to refresh activity statuses:', error);
      }
    };
    
    refreshActivityStatuses();
  }, [interviewEnded, session?.user?.id]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 p-6 overflow-auto leading-7 min-h-0">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Synchronization Activities</h1>
          <p className="text-lg text-[#A0EFFF]/70">
            Complete these structured interviews to help the AI understand your profile better.
          </p>
        </div>

        {/* G-Eval Progress Bar - No Card Wrapper */}
        <div className="mb-12 p-8 rounded-xl bg-[#455769]/40 border border-[#A0EFFF]/20">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Overall Assessment Score</h2>
              <p className="text-[#A0EFFF]/70">Based on all your responses across activities</p>
            </div>

            {gEvalLoading ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#E49D23]" />
                <span className="text-[#A0EFFF]">Loading assessment...</span>
              </div>
            ) : gEvalError ? (
              <div className="text-red-300 text-sm">{gEvalError}</div>
            ) : gEvalScore !== null ? (
              <div className="space-y-4">
                {/* Score Display */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-[#A0EFFF]">Score</span>
                  <span className="text-4xl font-bold text-[#E49D23]">{gEvalScore}/5</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-[#172A3A]/60 rounded-full h-3 overflow-hidden border border-[#A0EFFF]/20">
                    <div
                      className="h-full bg-gradient-to-r from-[#E49D23] to-[#FFD700] transition-all duration-700 ease-out"
                      style={{ width: `${(gEvalScore / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Percentage Text */}
                <div className="text-right">
                  <span className="text-sm font-medium text-[#A0EFFF]/80">
                    {Math.round((gEvalScore / 10) * 100)}% Complete
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Activities Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Activities</h2>
          
          {activitiesLoading ? (
            <div className="flex items-center justify-center gap-3 py-12">
              <Loader2 className="w-5 h-5 animate-spin text-[#E49D23]" />
              <span className="text-[#A0EFFF]">Loading activities...</span>
            </div>
          ) : activitiesError ? (
            <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">{activitiesError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => {
                const isCurrentActivity = mode === 'interviewer' && activityId === activity.id;
                const status = activityStatuses.get(activity.id) || 'not_started';

                return (
                  <ActivityCard
                    key={activity.id}
                    id={activity.id}
                    name={activity.name}
                    description={activity.description}
                    category={activity.category}
                    status={status}
                    isActive={isCurrentActivity}
                    onStartInterview={(activityId) => {
                      switchToInterviewer(activityId);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Return to Chat Button */}
        {mode === 'interviewer' && (
          <div className="mt-12 flex justify-center">
            <Button
              onClick={switchToImpersonation}
              variant="outline"
              size="lg"
              className="px-8 py-2 text-base"
            >
              Back to General Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

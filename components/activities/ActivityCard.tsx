import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface ActivityQuestion {
  id: string;
  questionText: string;
}

export interface ActivityCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'not_started' | 'in_progress' | 'completed';
  isActive?: boolean;
  onStartInterview: (activityId: string) => void;
}

type ActivityStatus = 'not_started' | 'in_progress' | 'completed';

const ActivityCard: React.FC<ActivityCardProps> = ({
  id,
  name,
  description,
  category,
  status,
  isActive = false,
  onStartInterview
}) => {
  const handleStartInterview = () => {
    console.log('[ActivityCard] Starting interview for activity:', id);
    onStartInterview(id);
  };

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-[#E49D23]" />;
      default:
        return <AlertCircle className="w-5 h-5 text-[#A0EFFF]/50" />;
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-[#E49D23]/20 text-[#E49D23] hover:bg-[#E49D23]/30 border border-[#E49D23]/50">In Progress</Badge>;
      default:
        return <Badge className="bg-[#A0EFFF]/10 text-[#A0EFFF] hover:bg-[#A0EFFF]/20 border border-[#A0EFFF]/30">Not Started</Badge>;
    }
  };

  return (
    <Card
      className={`transition-all duration-300 overflow-hidden bg-[#455769] border-[#A0EFFF]/20 hover:border-[#FF9500]/50 hover:scale-[1.02] ${
        isActive
          ? 'ring-2 ring-[#E49D23] shadow-lg'
          : 'hover:shadow-md'
      }`}
    >
      {/* Header with Category Badge */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <CardTitle className="text-xl text-white mb-1">{name}</CardTitle>
            <CardDescription className="text-[#A0EFFF]/70">{description}</CardDescription>
          </div>
          <div className="flex-shrink-0">
            {getStatusIcon(status)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#172A3A] text-[#A0EFFF] border-[#A0EFFF]/30">
            {category}
          </Badge>
          {getStatusBadge(status)}
        </div>
      </CardHeader>

      {/* Action Button */}
      <CardContent className="pt-0">
        <Button
          onClick={handleStartInterview}
          variant={isActive ? 'default' : 'outline'}
          className={`w-full transition-all ${
            isActive
              ? 'bg-[#E49D23] text-[#172A3A] hover:bg-[#E49D23]/90'
              : 'border-[#A0EFFF]/30 text-[#A0EFFF] hover:text-[#FF9500] hover:bg-[#FF9500]/10 hover:border-[#FF9500]/50'
          }`}
        >
          {isActive ? 'Interviewing...' : 'Start Interview'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;

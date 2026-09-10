import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ChevronRight, TrendingUp, Target, Sparkles, BookOpen, MessageCircle } from "lucide-react"
import { InsightsCardProps } from "@/components/profile/types"

export default function InsightsCard({ 
  section,
  onSectionDetail, 
  onOpenMemories 
}: InsightsCardProps) {
  const { id, title, description, data } = section
  const items = data as import("@/components/profile/types").InsightItem[]
  
  // Sort items by order field
  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  const getIcon = (iconName: string) => {
    const IconComponent = iconName ? require('lucide-react')[iconName] || Sparkles : Sparkles
    return <IconComponent className="w-4 h-4" />
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-[#455769] border-[#A0EFFF]/20 hover:border-[#FF9500]/50 hover:scale-[1.02]"
      onClick={() => onSectionDetail(id)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading text-white">{title}</CardTitle>
          <div className="flex gap-2 items-center flex-row">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onOpenMemories(id)
              }}
              size="sm"
              variant="ghost"
              className="text-[#A0EFFF] hover:text-[#FF9500] hover:bg-[#FF9500]/10"
            >
              <Brain className="w-4 h-4" />
              <span className="text-xs ml-1">Memories</span>
            </Button>
            <ChevronRight className="w-4 h-4 text-[#A0EFFF]/50" />
          </div>
        </div>
        <CardDescription className="text-[#A0EFFF]/70">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedItems.slice(0, 2).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 bg-[#172A3A] rounded-lg border border-[#A0EFFF]/10"
            >
              <div className="text-[#FF9500] mt-0.5">
                {getIcon(item.icon)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white leading-relaxed">{item.insight}</p>
              </div>
            </div>
          ))}
          {items.length > 2 && (
            <div className="text-xs text-[#A0EFFF]/70 text-center pt-2">
              +{items.length - 2} more insights • Click to explore
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

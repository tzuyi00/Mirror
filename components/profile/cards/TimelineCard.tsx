import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ChevronRight } from "lucide-react"
import { TimelineCardProps } from "@/components/profile/types"

export default function TimelineCard({ 
  section,
  onSectionDetail, 
  onOpenMemories 
}: TimelineCardProps) {
  const { id, title, description, data } = section
  const items = data as import("@/components/profile/types").TimelineItem[]
  
  // Sort items by order field
  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-[#455769] border-[#A0EFFF]/20 hover:border-[#FF9500]/50 hover:scale-[1.02]"
      onClick={() => onSectionDetail(id)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading text-white">{title}</CardTitle>
          <div className="flex gap-2 items-center">
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
        <div className="space-y-4">
          {sortedItems.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-[#FF9500] border-2 border-[#455769] mt-1"></div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{item.event}</span>
                  <span className="text-xs text-[#A0EFFF]">{item.date}</span>
                </div>
              </div>
            </div>
          ))}
          {items.length > 2 && (
            <div className="text-xs text-[#A0EFFF]/70 text-center pt-2">
              +{items.length - 2} more events • Click to view timeline
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

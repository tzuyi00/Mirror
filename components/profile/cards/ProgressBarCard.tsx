import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ChevronRight } from "lucide-react"
import { ProgressBarCardProps } from "@/components/profile/types"

export default function ProgressBarCard({ 
  section,
  onSectionDetail, 
  onOpenMemories 
}: ProgressBarCardProps) {
  const { id, title, description, data } = section
  // Type assertion since ProgressBarCardProps guarantees data is ProgressBarItem[]
  const items = data as import("@/components/profile/types").ProgressBarItem[]
  
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
              className="text-[#A0EFFF] hover:text-[#FF9500] hover:bg-[#FF9500]/10 items-center"
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
          {sortedItems.slice(0, 3).map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">{item.name}</span>
                <span className="text-xs text-[#A0EFFF]">{item.level}%</span>
              </div>
              <div className="w-full bg-[#172A3A] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#E59D23] to-[#85C2D2] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.level}%` }}
                ></div>
              </div>
            </div>
          ))}
          {sortedItems.length > 3 && (
            <div className="text-xs text-[#A0EFFF]/70 text-center pt-2">
              +{sortedItems.length - 3} more items • Click to view all
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

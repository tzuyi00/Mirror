import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, ChevronRight } from "lucide-react"
import { TagsCardProps } from "@/components/profile/types"

export default function TagsCard({ 
  section,
  onSectionDetail, 
  onOpenMemories 
}: TagsCardProps) {
  const { id, title, description, data } = section
  const items = data as import("@/components/profile/types").TagItem[]
  
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
        <div className="flex flex-wrap gap-2 mb-4">
          {sortedItems.slice(0, 4).map((item) => (
            <Badge
              key={item.id}
              className="bg-[#172A3A] text-[#A0EFFF] border-[#A0EFFF]/30 hover:bg-[#A0EFFF]/10"
            >
              {item.label}
            </Badge>
          ))}
          {sortedItems.length > 4 && (
            <Badge className="bg-[#172A3A] text-[#FF9500] border-[#FF9500]/30">
              +{sortedItems.length - 4}
            </Badge>
          )}
        </div>
        <div className="text-xs text-[#A0EFFF]/70">Click to view all tags and details</div>
      </CardContent>
    </Card>
  )
}

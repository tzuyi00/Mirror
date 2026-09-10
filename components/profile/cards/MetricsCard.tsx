import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, ChevronRight } from "lucide-react"
import { MetricsCardProps } from "@/components/profile/types"

export default function MetricsCard({ 
  section,
  onSectionDetail, 
  onOpenMemories 
}: MetricsCardProps) {
  const { id, title, description, data } = section
  const items = data as import("@/components/profile/types").MetricItem[]
  
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
          <div className="space-y-3">
            {sortedItems.slice(0, 2).map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">{item.name}</span>
                  {item.type === "metric" ? (
                    <span className="text-xs text-[#A0EFFF]">{item.value}</span>
                  ) : (
                    <Badge className="bg-[#172A3A] text-[#A0EFFF] border-[#A0EFFF]/30">
                      {item.value}
                    </Badge>
                  )}
                </div>
                {item.type === "metric" && item.score && (
                  <div className="w-full bg-[#172A3A] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#E59D23] to-[#85C2D2] h-2 rounded-full"
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {items.length > 2 && (
            <div className="text-xs text-[#A0EFFF]/70 text-center pt-2">
              +{items.length - 2} more metrics • Click to view details
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

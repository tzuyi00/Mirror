import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ChevronRight } from "lucide-react"
import { SpectrumCardProps } from "@/components/profile/types"

export default function SpectrumCard({ 
  section,
  onSectionDetail, 
  onOpenMemories 
}: SpectrumCardProps) {
  const { id, title, description, data } = section
  const items = data as import("@/components/profile/types").SpectrumItem[]
  
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
            <div key={item.id} className="space-y-3">
              <div className="flex justify-between text-xs text-[#A0EFFF]/70">
                <span>{item.leftLabel}</span>
                <span>{item.rightLabel}</span>
              </div>
              <div className="relative h-2 bg-[#172A3A] rounded-full">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#E59D23] to-[#85C2D2] rounded-full"></div>
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-[#FF9500] rounded-full border-2 border-[#455769]"
                  style={{ left: `${item.position}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-[#A0EFFF]/70 mt-3">
          {items.length > 2 && `${items.length - 2} more spectrums available • `}
          Click to view all details
        </div>
      </CardContent>
    </Card>
  )
}

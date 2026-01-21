"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Clock, MessageCircle, Thermometer, Heart, MoreVertical } from "lucide-react"
import type { HistoryItem } from "@/lib/history-types"
import { getRoundProgress, getTemperatureColor } from "./utils"

interface HistoryItemCardProps {
  item: HistoryItem
  onProfileClick: (item: HistoryItem) => void
  onChatClick: (item: HistoryItem) => void
  onBlock: (id: string) => void
  onUnblock: (id: string) => void
  isBlocked: boolean
}

export function HistoryItemCard({ item, onProfileClick, onChatClick, onBlock, onUnblock, isBlocked }: HistoryItemCardProps) {
  return (
    <div className="p-4 rounded-xl bg-card flex items-center gap-3 sm:gap-4">
      <div className="flex flex-col items-center justify-center flex-shrink-0">
        <div className="relative w-12 h-12">
          <Heart className="w-12 h-12 text-gray-300" />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(${100 - getRoundProgress(item.rounds)}% 0 0 0)` }}
          >
            <Heart className="w-12 h-12 text-red-500 fill-red-500" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onProfileClick(item)}
            className="font-semibold truncate hover:text-primary cursor-pointer"
          >
            {item.partnerNickname}
          </button>
          <span className={`text-xs flex items-center gap-0.5 ${getTemperatureColor(item.partnerTemp)}`}>
            <Thermometer className="w-3 h-3" />
            {item.partnerTemp.toFixed(1)}°
          </span>
          {isBlocked && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">차단됨</span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {item.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.duration}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChatClick(item)}
          className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">채팅</span>
        </Button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => (isBlocked ? onUnblock(item.id) : onBlock(item.id))}
            >
              {isBlocked ? "차단해제" : "차단하기"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

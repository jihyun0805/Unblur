"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Clock, MessageCircle, User, MoreVertical } from "lucide-react"
import type { HistoryItem } from "@/lib/history-types"
import { getRoundProgress } from "./utils"

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
          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          {item.isOnline && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
          )}
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

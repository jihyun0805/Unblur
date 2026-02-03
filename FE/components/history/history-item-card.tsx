"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Clock, Layers, MessageCircle, MoreVertical } from "lucide-react"
import type { HistoryItem } from "@/lib/history-types"
import { getLoveDnaImage } from "@/lib/profile-image"

interface HistoryItemCardProps {
  item: HistoryItem
  onProfileClick: (item: HistoryItem) => void
  onChatClick: (item: HistoryItem) => void
  onBlock: (item: HistoryItem) => void
  onUnblock: (item: HistoryItem) => void
  isBlocked: boolean
}

export function HistoryItemCard({ item, onProfileClick, onChatClick, onBlock, onUnblock, isBlocked }: HistoryItemCardProps) {
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false)
  const [isUnblockConfirmOpen, setIsUnblockConfirmOpen] = useState(false)

  const handleUnblock = () => {
    onUnblock(item)
  }

  const handleBlockConfirm = () => {
    setIsBlockConfirmOpen(true)
  }

  const handleUnblockConfirm = () => {
    setIsUnblockConfirmOpen(true)
  }

  return (
    <div
      className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
        isBlocked ? "bg-muted/40 opacity-70" : "bg-card"
      }`}
    >
      <div className="flex items-center justify-center flex-shrink-0">
        <div className="relative w-12 h-12">
          <img
            src={getLoveDnaImage(item.loveDna)}
            alt={`${item.partnerNickname} 프로필 이미지`}
            className="w-full h-full rounded-full object-cover bg-card flex items-center justify-center overflow-hidden border border-border"
          />
          {item.isOnline && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0 w-full">
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
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {item.rounds}라운드
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChatClick(item)}
          className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
        >
          <MessageCircle className="w-4 h-4" />
          <span>채팅</span>
        </Button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isBlocked ? (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleUnblockConfirm}
                onSelect={handleUnblockConfirm}
              >
                차단해제
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={handleBlockConfirm}
                onSelect={handleBlockConfirm}
              >
                차단하기
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={isBlockConfirmOpen} onOpenChange={setIsBlockConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 차단하시겠어요?</AlertDialogTitle>
              <AlertDialogDescription>
                차단하면 이 사용자의 메시지를 받을 수 없어요. 언제든 차단 해제할 수 있습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onBlock(item)
                  setIsBlockConfirmOpen(false)
                }}
              >
                차단하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isUnblockConfirmOpen} onOpenChange={setIsUnblockConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>차단을 해제하시겠어요?</AlertDialogTitle>
              <AlertDialogDescription>
                차단 해제 시 다시 메시지를 주고받을 수 있습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onUnblock(item)
                  setIsUnblockConfirmOpen(false)
                }}
              >
                차단해제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

"use client"

import React, { useCallback, useState } from "react"
import SegmentControl from "./SegmentControl"
import MatchingContent from "./MatchingContent"
import NearbyMatching from "./NearbyMatching"
import LikedProfiles from "./LikedProfiles"
import { MobileFAB } from "@/app/components/mobile-fab"
import Modal from "react-modal"
import type { SegmentType, Profile } from "../types"

interface MobileLayoutProps {
  activeSegment: SegmentType
  onSegmentChange: (segment: SegmentType) => void
  isDarkMode: boolean
  onOpenChat?: (profileId?: string) => void
  // Matching content props
  profile: Profile
  exitX: number
  dragX: number
  dragY: number
  rotation: number
  isAnimating: boolean
  isDragging: boolean
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onLike: () => void
  onDislike: () => void
}

const MobileLayout = React.memo(
  ({
    activeSegment,
    onSegmentChange,
    isDarkMode,
    onOpenChat,
    profile,
    exitX,
    dragX,
    dragY,
    rotation,
    isAnimating,
    isDragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onLike,
    onDislike,
  }: MobileLayoutProps) => {
    const [showLikedModal, setShowLikedModal] = useState(false)

    const renderContent = useCallback(() => {
      switch (activeSegment) {
        case "matching":
          return (
            <MatchingContent
              profile={profile}
              isDarkMode={isDarkMode}
              exitX={exitX}
              dragX={dragX}
              dragY={dragY}
              rotation={rotation}
              isAnimating={isAnimating}
              isDragging={isDragging}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onLike={onLike}
              onDislike={onDislike}
            />
          )
        case "nearby":
          return <NearbyMatching
          isDarkMode={isDarkMode} 
          onOpenChat={onOpenChat}
         />
        default:
          return null
      }
    }, [
      activeSegment,
      profile,
      isDarkMode,
      onOpenChat,
      exitX,
      dragX,
      dragY,
      rotation,
      isAnimating,
      isDragging,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onLike,
      onDislike,
    ])

    return (
      <div className="lg:hidden">
        {/* 세그먼트 컨트롤 */}
        <SegmentControl activeSegment={activeSegment} onSegmentChange={onSegmentChange} isDarkMode={isDarkMode} />

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6 pt-2">{renderContent()}</div>

        {/* 모바일 전용 플로팅 액션 버튼 */}
        <MobileFAB isLoading={false} onAddClick={() => setShowLikedModal(true)} />

        {/* 좋아요 프로필 모달 */}
        <Modal
          isOpen={showLikedModal}
          onRequestClose={() => setShowLikedModal(false)}
          contentLabel="좋아요한 프로필"
          className="backdrop-blur-xl bg-white/90 rounded-3xl max-w-md w-full mx-4 p-4 shadow-2xl border border-white/50"
          overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          ariaHideApp={false}
        >
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowLikedModal(false)}
              className="self-end mb-2 text-2xl text-gray-400 hover:text-gray-700"
              aria-label="닫기"
            >
              ×
            </button>
            <LikedProfiles isDarkMode={isDarkMode} onOpenChat={onOpenChat} />
          </div>
        </Modal>
      </div>
    )
  },
)

MobileLayout.displayName = "MobileLayout"

export default MobileLayout
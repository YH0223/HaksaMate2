import React from "react"
import { Trash2 } from "lucide-react"
import { Comment } from "../types"
import { useGlobalProfile } from '@/components/GlobalProfileProvider'

interface CommentItemProps {
  comment: Comment
  currentUser: any
  onDelete: () => void
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onDelete,
}) => {
  const { profile } = useGlobalProfile()
  return (
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
        {/* 현재 사용자의 댓글인 경우 전역 프로필 이미지 사용 */}
        {currentUser && currentUser.id === comment.author_id && profile.profileImage ? (
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
            <img 
              src={profile.profileImage} 
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-xs">
              {comment.author_username[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate">
              {currentUser && currentUser.id === comment.author_id ? (profile.name || comment.author_username) : comment.author_username}
            </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(comment.created_at).toLocaleString("ko-KR")}
            </span>
            {currentUser && currentUser.id === comment.author_id && (
              <button
                onClick={onDelete}
                className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                title="댓글 삭제"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <p className="text-slate-700 dark:text-slate-300 text-sm break-words">
          {comment.content}
        </p>
      </div>
    </div>
  )
} 
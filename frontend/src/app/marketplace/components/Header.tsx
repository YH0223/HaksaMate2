"use client"

import React from "react"
import { Plus, Sun, Moon,MessageCircle } from "lucide-react"
import EmojiCarousel from "./EmojiCarousel"

interface HeaderProps {
  isDarkMode: boolean
  onToggleTheme: () => void
  onAddProduct: () => void
  onOpenChat: () => void // ✅ 추가
}

const Header = React.memo(({ isDarkMode, onToggleTheme, onAddProduct,onOpenChat}: HeaderProps) => {
  return (
    <header className="relative z-10 flex justify-between items-center p-6 md:p-8 pt-8">
      <div className="flex items-center gap-4">
        <EmojiCarousel />
        <div>
          <h1
            className={`text-3xl md:text-4xl lg:text-5xl font-bold transition-colors duration-500 ${
              isDarkMode ? "text-white" : "text-gray-800"
            } tracking-tight`}
          >
            중고마켓
          </h1>
          <p
            className={`text-sm md:text-base transition-colors duration-500 ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            우리 학교 학생들과 안전한 거래
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onAddProduct}
          className={`px-4 md:px-6 py-3 md:py-4 rounded-2xl font-semibold transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center gap-2 ${
            isDarkMode
              ? "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30"
              : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
          } hover:scale-105 active:scale-95`}
        >
          <Plus size={20} />
          <span className="hidden sm:inline">판매하기</span>
        </button>
        {/* ✅ ChatModal 트리거 버튼 */}
        <button
          onClick={onOpenChat}
          className={`p-3 md:p-4 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            isDarkMode
              ? "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20"
              : "bg-white/80 hover:bg-white/90 backdrop-blur-md border border-white/50"
          } shadow-lg`}
        >
           <MessageCircle size={20} className={isDarkMode ? "text-blue-300" : "text-blue-600"} />
          </button>
        <button
          onClick={onToggleTheme}
          className={`p-3 md:p-4 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            isDarkMode
              ? "bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20"
              : "bg-white/80 hover:bg-white/90 backdrop-blur-md border border-white/50"
          } shadow-lg`}
        >
          {isDarkMode ? <Sun size={20} className="text-yellow-300" /> : <Moon size={20} className="text-indigo-600" />}
        </button>
      </div>
    </header>
  )
})

Header.displayName = "Header"

export default Header

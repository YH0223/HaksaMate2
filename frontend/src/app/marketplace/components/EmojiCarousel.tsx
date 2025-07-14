"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const emojis = ["🍓", "🥕", "🍉", "🍇", "🍈"]

const EmojiCarousel = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % emojis.length)
    }, 1000) // 1.5초 간격

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-20 h-20 overflow-hidden flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute text-5xl"
        >
          {emojis[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default EmojiCarousel

import { Heart, MapPin, Star } from "lucide-react"
import type { SegmentItem } from "../types"

export const DRAG_THRESHOLD = 100
export const SWIPE_VELOCITY = 400
export const ANIMATION_DURATION = 600

export const SEGMENTS: SegmentItem[] = [
  { id: "matching", label: "친구", icon: Heart },
  { id: "nearby", label: "좋아요", icon: Star },
]

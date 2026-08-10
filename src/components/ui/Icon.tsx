import {
  Aperture, ArrowLeft, ArrowRight, ArrowUpDown, AudioLines, Award, Backpack,
  BatteryCharging, Bird, Box, Camera, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, CircleHelp, Copy, Cpu, Download, Dumbbell, Feather, Footprints,
  Gamepad2, HardDrive, Headphones, HeartPulse, Info, Laptop, LayoutGrid, Lightbulb,
  Link2, Loader, type LucideProps, Mic, Minus, Monitor, Moon, Mountain, PenTool,
  PiggyBank, Plane, Plus, Printer, RotateCcw, Rows3, Scale, Search, Share2,
  SlidersHorizontal, Smartphone, Sparkles, Star, Sun, Tablet, Tag, Target,
  TrendingUp, Trophy, Video, Watch, Wifi, X, Zap,
} from 'lucide-react'

/**
 * Explicit registry rather than a dynamic import — keeps the icon set
 * tree-shakeable and makes an unknown name a visible no-op instead of a crash.
 */
const REGISTRY = {
  Aperture, ArrowLeft, ArrowRight, ArrowUpDown, AudioLines, Award, Backpack,
  BatteryCharging, Bird, Box, Camera, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, CircleHelp, Copy, Cpu, Download, Dumbbell, Feather, Footprints,
  Gamepad2, HardDrive, Headphones, HeartPulse, Info, Laptop, LayoutGrid, Lightbulb,
  Link2, Loader, Mic, Minus, Monitor, Moon, Mountain, PenTool, PiggyBank, Plane,
  Plus, Printer, RotateCcw, Rows3, Scale, Search, Share2, SlidersHorizontal,
  Smartphone, Sparkles, Star, Sun, Tablet, Tag, Target, TrendingUp, Trophy, Video,
  Watch, Wifi, X, Zap,
} satisfies Record<string, React.ComponentType<LucideProps>>

export type IconName = keyof typeof REGISTRY

interface IconProps extends LucideProps {
  name: string
}

export function Icon({ name, ...props }: IconProps) {
  const Component = REGISTRY[name as IconName]
  if (!Component) return null
  return <Component aria-hidden {...props} />
}

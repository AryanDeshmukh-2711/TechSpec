import {
  Aperture, ArrowLeft, ArrowRight, ArrowUpDown, ArrowUpRight, AudioLines, Award, Backpack,
  BatteryCharging, Bird, Bookmark, Box, Camera, Check, ChevronDown, ChevronLeft, ChevronRight,
  ChevronUp, CircleAlert, CircleCheck, CircleHelp, Clock, Command, Compass, Copy, Cpu, Database,
  Download, Dumbbell, Ellipsis, Eye, EyeOff, Feather, FileJson, Flame, Footprints, Gamepad2,
  HardDrive, Headphones, HeartPulse, History, House, Info, Layers, Laptop, LayoutGrid, Lightbulb,
  Link2, Loader, type LucideProps, Mic, Minus, Monitor, Moon, Mountain, Pencil, PenTool, PiggyBank,
  Plane, Plus, Printer, RotateCcw, Rows3, Save, Scale, Search, Settings, Share2, ShieldCheck,
  SlidersHorizontal, Smartphone, Sparkles, Star, Sun, Tablet, Tag, Target, TrendingUp,
  TriangleAlert, Trash2, Trophy, Undo2, Upload, User, Video, Wand, Watch, Wifi, X, Zap,
} from 'lucide-react'

/**
 * Explicit registry rather than a dynamic import — keeps the icon set
 * tree-shakeable and makes an unknown name a visible no-op instead of a crash.
 */
const REGISTRY = {
  Aperture, ArrowLeft, ArrowRight, ArrowUpDown, ArrowUpRight, AudioLines, Award, Backpack,
  BatteryCharging, Bird, Bookmark, Box, Camera, Check, ChevronDown, ChevronLeft, ChevronRight,
  ChevronUp, CircleAlert, CircleCheck, CircleHelp, Clock, Command, Compass, Copy, Cpu, Database,
  Download, Dumbbell, Ellipsis, Eye, EyeOff, Feather, FileJson, Flame, Footprints, Gamepad2,
  HardDrive, Headphones, HeartPulse, History, House, Info, Layers, Laptop, LayoutGrid, Lightbulb,
  Link2, Loader, Mic, Minus, Monitor, Moon, Mountain, Pencil, PenTool, PiggyBank, Plane, Plus,
  Printer, RotateCcw, Rows3, Save, Scale, Search, Settings, Share2, ShieldCheck,
  SlidersHorizontal, Smartphone, Sparkles, Star, Sun, Tablet, Tag, Target, TrendingUp,
  TriangleAlert, Trash2, Trophy, Undo2, Upload, User, Video, Wand, Watch, Wifi, X, Zap,
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

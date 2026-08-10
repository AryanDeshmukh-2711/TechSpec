import { useId } from 'react'
import type { CategoryId } from '@/types'
import { cn } from '@/lib/cn'

/**
 * Product artwork is drawn, not photographed.
 *
 * Real product photos come with licensing baggage, inconsistent framing and
 * broken-image states. A generated silhouette per category, tinted with the
 * brand accent, keeps every card visually consistent and works offline.
 */

interface DeviceGlyphProps {
  category: CategoryId
  accent: string
  className?: string
  /** Adds a soft accent glow behind the device. */
  glow?: boolean
}

export function DeviceGlyph({ category, accent, className, glow = true }: DeviceGlyphProps) {
  const uid = useId().replace(/:/g, '')
  const screenId = `screen-${uid}`
  const glowId = `glow-${uid}`

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className={cn('h-full w-full', className)}
    >
      <defs>
        <linearGradient id={screenId} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.06" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.45" r="0.5">
          <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {glow && <rect width="120" height="120" fill={`url(#${glowId})`} />}

      <g
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-line-strong"
      >
        {category === 'mobiles' && <Phone screenId={screenId} accent={accent} />}
        {category === 'laptops' && <LaptopArt screenId={screenId} accent={accent} />}
        {category === 'tablets' && <TabletArt screenId={screenId} accent={accent} />}
        {category === 'smartwatches' && <WatchArt screenId={screenId} accent={accent} />}
        {category === 'headphones' && <HeadphoneArt screenId={screenId} accent={accent} />}
        {category === 'cameras' && <CameraArt screenId={screenId} accent={accent} />}
      </g>
    </svg>
  )
}

interface ArtProps {
  screenId: string
  accent: string
}

function Phone({ screenId, accent }: ArtProps) {
  return (
    <>
      <rect x="38" y="14" width="44" height="92" rx="10" fill={`url(#${screenId})`} />
      <rect x="41.5" y="17.5" width="37" height="85" rx="7" stroke="none" fill={accent} fillOpacity="0.07" />
      {/* Dynamic-island style cutout */}
      <rect x="53" y="21" width="14" height="4.5" rx="2.25" fill={accent} fillOpacity="0.5" stroke="none" />
      {/* Rear camera cluster, peeking past the edge */}
      <g strokeWidth="1.1" strokeOpacity="0.7">
        <circle cx="46" cy="26" r="2.8" fill={accent} fillOpacity="0.22" />
        <circle cx="46" cy="34" r="2.8" fill={accent} fillOpacity="0.22" />
      </g>
    </>
  )
}

function LaptopArt({ screenId, accent }: ArtProps) {
  return (
    <>
      <path d="M28 30h64a3 3 0 0 1 3 3v40H25V33a3 3 0 0 1 3-3Z" fill={`url(#${screenId})`} />
      <rect x="30" y="35" width="60" height="33" rx="2" stroke="none" fill={accent} fillOpacity="0.08" />
      <path d="M16 73h88l-5 11a4 4 0 0 1-3.6 2.3H24.6A4 4 0 0 1 21 84l-5-11Z" fill={accent} fillOpacity="0.1" />
      <path d="M52 78h16" strokeWidth="1.3" />
    </>
  )
}

function TabletArt({ screenId, accent }: ArtProps) {
  return (
    <>
      <rect x="28" y="16" width="64" height="88" rx="7" fill={`url(#${screenId})`} />
      <rect x="32" y="20" width="56" height="80" rx="4" stroke="none" fill={accent} fillOpacity="0.07" />
      <circle cx="60" cy="18.5" r="0.9" fill={accent} fillOpacity="0.6" stroke="none" />
      <path d="M48 101h24" strokeWidth="1.3" />
    </>
  )
}

function WatchArt({ screenId, accent }: ArtProps) {
  return (
    <>
      <path d="M46 22h28l-3 16H49l-3-16Z" fill={accent} fillOpacity="0.12" />
      <path d="M49 82h22l3 16H46l3-16Z" fill={accent} fillOpacity="0.12" />
      <rect x="38" y="34" width="44" height="52" rx="13" fill={`url(#${screenId})`} />
      <rect x="42" y="38" width="36" height="44" rx="10" stroke="none" fill={accent} fillOpacity="0.09" />
      <path d="M83 51v10" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="60" cy="60" r="9" strokeWidth="1.2" strokeOpacity="0.6" />
    </>
  )
}

function HeadphoneArt({ screenId, accent }: ArtProps) {
  return (
    <>
      <path d="M26 66V56a34 34 0 0 1 68 0v10" />
      <rect x="18" y="62" width="20" height="32" rx="8" fill={`url(#${screenId})`} />
      <rect x="82" y="62" width="20" height="32" rx="8" fill={`url(#${screenId})`} />
      <rect x="22" y="66" width="12" height="24" rx="6" stroke="none" fill={accent} fillOpacity="0.14" />
      <rect x="86" y="66" width="12" height="24" rx="6" stroke="none" fill={accent} fillOpacity="0.14" />
    </>
  )
}

function CameraArt({ screenId, accent }: ArtProps) {
  return (
    <>
      <path d="M52 30h16l3 8h17a5 5 0 0 1 5 5v38a5 5 0 0 1-5 5H32a5 5 0 0 1-5-5V43a5 5 0 0 1 5-5h17l3-8Z" fill={`url(#${screenId})`} />
      <circle cx="60" cy="63" r="17" fill={accent} fillOpacity="0.12" />
      <circle cx="60" cy="63" r="10" strokeWidth="1.3" />
      <circle cx="60" cy="63" r="4" fill={accent} fillOpacity="0.4" stroke="none" />
      <rect x="76" y="44" width="8" height="5" rx="1.5" strokeWidth="1.2" />
    </>
  )
}

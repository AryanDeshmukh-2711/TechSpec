import { useCallback, useEffect, useRef, useState } from 'react'
import type { Category, Product } from '@/types'
import { copyToClipboard } from '@/lib/clipboard'
import { shareUrl } from '@/lib/urlState'
import { Button } from '@/components/ui/primitives'

/**
 * The one thing a comparison needs to leave the page with: a link that carries
 * the products *and* the priority weights, so whoever opens it sees the same
 * verdict rather than the neutral default.
 */
export function ShareButton({
  category,
  products,
  priorities,
  onToast,
}: {
  category: Category
  products: Product[]
  priorities: Record<string, number>
  onToast: (message: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const alive = useRef(true)
  const resetTimer = useRef<number | undefined>(undefined)

  // Both the clipboard write and the confirmation tick outlive a click, so
  // neither may touch state after the user has navigated away.
  useEffect(
    () => () => {
      alive.current = false
      window.clearTimeout(resetTimer.current)
    },
    [],
  )

  const flashCopied = useCallback(() => {
    if (!alive.current) return
    setCopied(true)
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleShare = async () => {
    const link = shareUrl({
      screen: 'compare',
      category: category.id,
      selection: products.map((p) => p.id),
      priorities,
    })

    // Prefer the native share sheet on mobile; fall back to the clipboard.
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TechSpec — ${products.map((p) => p.name).join(' vs ')}`,
          url: link,
        })
        return
      } catch (error) {
        // Dismissing the sheet is a decision, not a failure. Copying anyway
        // would overwrite the clipboard after the user said no.
        if (error instanceof DOMException && error.name === 'AbortError') return
        // Anything else means the browser refused — copy instead.
      }
    }

    const ok = await copyToClipboard(link)
    if (ok) flashCopied()
    onToast(ok ? 'Link copied — your priorities are included' : 'Could not copy the link')
  }

  return (
    <Button size="sm" variant="secondary" icon={copied ? 'Check' : 'Link2'} onClick={handleShare}>
      Share
    </Button>
  )
}

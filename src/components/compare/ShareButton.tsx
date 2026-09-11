import { useState } from 'react'
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
      } catch {
        // User dismissed the sheet, or the browser refused — copy instead.
      }
    }

    const ok = await copyToClipboard(link)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
    onToast(ok ? 'Link copied — your priorities are included' : 'Could not copy the link')
  }

  return (
    <Button size="sm" variant="secondary" icon={copied ? 'Check' : 'Link2'} onClick={handleShare}>
      Share
    </Button>
  )
}

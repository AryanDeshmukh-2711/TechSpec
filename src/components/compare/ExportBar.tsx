import { useState } from 'react'
import type { Category, PersonaVerdict, ScoredProduct } from '@/types'
import { buildCsv, buildTextSummary, copyToClipboard, downloadFile } from '@/lib/export'
import { shareUrl } from '@/lib/urlState'
import { Button } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'

export function ExportBar({
  category,
  scored,
  verdicts,
  priorities,
  onToast,
}: {
  category: Category
  scored: ScoredProduct[]
  verdicts: PersonaVerdict[]
  priorities: Record<string, number>
  onToast: (message: string) => void
}) {
  const [copied, setCopied] = useState<'link' | 'text' | null>(null)

  const flash = (kind: 'link' | 'text', message: string) => {
    setCopied(kind)
    onToast(message)
    window.setTimeout(() => setCopied(null), 2000)
  }

  const url = () =>
    shareUrl({
      screen: 'compare',
      category: category.id,
      selection: scored.map((s) => s.product.id),
      priorities,
    })

  const handleShare = async () => {
    const link = url()
    // Prefer the native share sheet on mobile; fall back to the clipboard.
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TechSpec — ${scored.map((s) => s.product.name).join(' vs ')}`,
          url: link,
        })
        return
      } catch {
        // User dismissed the sheet, or the browser refused — copy instead.
      }
    }
    const ok = await copyToClipboard(link)
    flash('link', ok ? 'Share link copied — priorities included' : 'Could not copy the link')
  }

  const handleCopyText = async () => {
    const ok = await copyToClipboard(buildTextSummary(category, scored, verdicts, url()))
    flash('text', ok ? 'Summary copied to clipboard' : 'Could not copy the summary')
  }

  const handleCsv = () => {
    const slug = scored
      .map((s) => s.product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
      .join('-vs-')
      .slice(0, 80)
    downloadFile(`techspec-${slug}.csv`, buildCsv(category, scored, verdicts), 'text/csv')
    onToast('CSV downloaded')
  }

  return (
    <div className="ts-no-print flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="primary"
        icon={copied === 'link' ? 'Check' : 'Link2'}
        onClick={handleShare}
      >
        Share
      </Button>
      <Button size="sm" icon={copied === 'text' ? 'Check' : 'Copy'} onClick={handleCopyText}>
        Copy summary
      </Button>
      <Button size="sm" icon="Download" onClick={handleCsv}>
        CSV
      </Button>
      <Button size="sm" icon="Printer" onClick={() => window.print()}>
        <span className="hidden sm:inline">Print / PDF</span>
        <span className="sm:hidden">PDF</span>
      </Button>
      <span className="ml-1 hidden items-center gap-1 text-[11.5px] text-faint md:inline-flex">
        <Icon name="Info" size={12} />
        Links carry your slider weights
      </span>
    </div>
  )
}

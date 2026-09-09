import { useRef, useState } from 'react'
import { CATEGORIES } from '@/data'
import { useCatalogue } from '@/data/store/CatalogueProvider'
import { useProfile } from '@/personalisation/ProfileProvider'
import type { ImportReport } from '@/data/store/transfer'
import { isRemoteConfigured } from '@/data/store/remoteSource'
import { downloadFile } from '@/lib/export'
import { Button, Badge, Modal } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

/**
 * Where the user's ownership of the catalogue is made concrete: what they've
 * changed, where it lives, how to take it with them, and how to undo all of it.
 */
export function CatalogueSettings({
  open,
  onClose,
  onToast,
}: {
  open: boolean
  onClose: () => void
  onToast: (message: string) => void
}) {
  const catalogue = useCatalogue()
  const { profile, forgetEverything, hasHistory } = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<ImportReport | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleExport = () => {
    if (catalogue.totalCustomisations === 0) {
      onToast('Nothing to export yet — edit or add a device first')
      return
    }
    downloadFile(
      `techspec-catalogue-${new Date().toISOString().slice(0, 10)}.json`,
      catalogue.exportJson(),
      'application/json',
    )
    onToast('Catalogue exported')
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 5_000_000) {
      onToast('That file is too large (5 MB limit)')
      return
    }
    try {
      setPending(catalogue.importJson(await file.text()))
    } catch {
      onToast('Could not read that file')
    }
  }

  const applyPending = () => {
    if (!pending) return
    catalogue.applyImport(pending)
    onToast(`Imported ${pending.added + pending.edited + pending.removed} changes`)
    setPending(null)
  }

  const storageNote: Record<string, string> = {
    ok: 'Saved in this browser',
    unavailable: 'Storage is blocked — changes last for this session only',
    quota: 'Storage is full — recent changes may not have saved',
    corrupt: 'Stored data was unreadable and has been ignored',
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your catalogue"
      description="Devices, edits and history are stored on this device only."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      {/* ------------------------------------------------------ storage */}
      <div
        className={cn(
          'flex items-start gap-3 rounded-2xl border p-4',
          catalogue.storage === 'ok'
            ? 'border-line bg-surface-2'
            : 'border-warn/30 bg-best-soft',
        )}
      >
        <Icon
          name={catalogue.storage === 'ok' ? 'ShieldCheck' : 'TriangleAlert'}
          size={18}
          className={cn('mt-0.5 shrink-0', catalogue.storage === 'ok' ? 'text-brand-text' : 'text-warn')}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium text-ink">
            {storageNote[catalogue.storage] ?? storageNote.ok}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
            Nothing is uploaded and there is no account. Clearing your browser data clears this
            too, so export if you want a copy.
          </p>
          <p className="tnum mt-1.5 text-[11.5px] text-faint">
            {catalogue.totalCustomisations} customisation
            {catalogue.totalCustomisations === 1 ? '' : 's'} ·{' '}
            {(catalogue.footprintBytes / 1024).toFixed(1)} KB used
            {isRemoteConfigured() && ' · remote source configured'}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------ per category */}
      <h3 className="mt-6 mb-2 text-[12px] font-semibold tracking-wide text-faint uppercase">
        By category
      </h3>
      <ul className="overflow-hidden rounded-2xl border border-line">
        {CATEGORIES.map((category, index) => {
          const stats = catalogue.statsFor(category.id)
          const count = catalogue.catalogueFor(category.id).length
          return (
            <li
              key={category.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                index > 0 && 'border-t border-line',
              )}
            >
              <Icon name={category.icon} size={16} className="shrink-0 text-faint" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-ink">{category.label}</span>
                <span className="tnum block text-[11.5px] text-faint">
                  {count} device{count === 1 ? '' : 's'}
                  {stats.total > 0 &&
                    ` · ${[
                      stats.added && `${stats.added} added`,
                      stats.edited && `${stats.edited} edited`,
                      stats.removed && `${stats.removed} hidden`,
                    ]
                      .filter(Boolean)
                      .join(', ')}`}
                </span>
              </span>
              {stats.total > 0 ? (
                <Button
                  size="xs"
                  variant="ghost"
                  icon="Undo2"
                  onClick={() => {
                    catalogue.resetCategory(category.id)
                    onToast(`${category.label} reset to the built-in catalogue`)
                  }}
                >
                  Reset
                </Button>
              ) : (
                <Badge tone="neutral">UNCHANGED</Badge>
              )}
            </li>
          )
        })}
      </ul>

      {/* ---------------------------------------------------- transfer */}
      <h3 className="mt-6 mb-2 text-[12px] font-semibold tracking-wide text-faint uppercase">
        Take it with you
      </h3>
      <div className="flex flex-wrap gap-2">
        <Button icon="Download" onClick={handleExport}>
          Export JSON
        </Button>
        <Button icon="Upload" onClick={() => fileRef.current?.click()}>
          Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            void handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {pending && (
        <div className="ts-pop mt-3 rounded-2xl border border-line bg-surface-2 p-4">
          <p className="text-[13.5px] font-medium text-ink">
            {pending.ok ? 'Ready to import' : 'Nothing to import'}
          </p>
          {pending.ok && (
            <p className="tnum mt-1 text-[12.5px] text-muted">
              {pending.added} added · {pending.edited} edited · {pending.removed} hidden
            </p>
          )}
          {pending.issues.length > 0 && (
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
              {pending.issues.slice(0, 8).map((issue, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-warn">
                  <Icon name="TriangleAlert" size={12} className="mt-0.5 shrink-0" />
                  <span>
                    {issue.device ? `${issue.device}: ` : ''}
                    {issue.message}
                  </span>
                </li>
              ))}
              {pending.issues.length > 8 && (
                <li className="text-[12px] text-faint">
                  …and {pending.issues.length - 8} more
                </li>
              )}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            {pending.ok && (
              <Button size="sm" variant="primary" icon="Check" onClick={applyPending}>
                Apply import
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- reset */}
      <h3 className="mt-6 mb-2 text-[12px] font-semibold tracking-wide text-faint uppercase">
        Start over
      </h3>
      <div className="flex flex-wrap gap-2">
        {confirmReset ? (
          <>
            <Button
              size="sm"
              variant="danger"
              icon="Trash2"
              onClick={() => {
                catalogue.resetEverything()
                setConfirmReset(false)
                onToast('Catalogue restored to the built-in devices')
              }}
            >
              Yes, discard all my devices
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
              Keep them
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="danger"
            icon="Undo2"
            disabled={catalogue.totalCustomisations === 0}
            onClick={() => setConfirmReset(true)}
          >
            Reset every category
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          icon="History"
          disabled={!hasHistory}
          onClick={() => {
            forgetEverything()
            onToast('History and remembered priorities cleared')
          }}
        >
          Clear history ({profile.viewed.length + profile.comparisons.length})
        </Button>
      </div>
    </Modal>
  )
}

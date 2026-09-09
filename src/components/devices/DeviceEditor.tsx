import { useMemo, useState } from 'react'
import type { Category, Product, SpecDef, SpecValue } from '@/types'
import { SPEC_GROUPS } from '@/data'
import { useCatalogue } from '@/data/store/CatalogueProvider'
import { completeness, slugify, type ValidationIssue } from '@/data/store/validate'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Badge, Button, Field, InfoHint, Modal, inputClass } from '@/components/ui/primitives'
import { DeviceGlyph } from '@/components/DeviceGlyph'

const ACCENTS = [
  '#0d7c6b', '#a4560a', '#5b21b6', '#b3123a', '#0369a1',
  '#2f6fed', '#e05555', '#2fa66b', '#9aa3ad', '#e8823f',
]

/**
 * Suggest an id from brand and name without stuttering: "Fairphone" +
 * "Fairphone 6" should be `fairphone-6`, not `fairphone-fairphone-6`.
 */
function suggestId(brand: string, name: string): string {
  const trimmedName = name.trim()
  const trimmedBrand = brand.trim()
  const alreadyPrefixed =
    trimmedBrand.length > 0 &&
    trimmedName.toLowerCase().startsWith(trimmedBrand.toLowerCase())

  return slugify(alreadyPrefixed ? trimmedName : `${trimmedBrand} ${trimmedName}`)
}

/**
 * Add or edit a device.
 *
 * The form is generated from the category's own spec schema, so it always
 * matches what the scoring engine reads — there is no second definition of a
 * device to drift out of sync. Everything is validated on save with the same
 * rules the importer uses.
 */
export function DeviceEditor({
  category,
  target,
  onClose,
  onSaved,
  onToast,
}: {
  category: Category
  /** null = create a new device. */
  target: Product | null
  onClose: () => void
  onSaved: (product: Product) => void
  onToast: (message: string) => void
}) {
  const store = useCatalogue()
  const isNew = target === null
  const isSeedDevice = !isNew && store.seedFor(category.id).some((p) => p.id === target.id)

  const [draft, setDraft] = useState<Product>(
    () =>
      target ?? {
        id: '',
        name: '',
        brand: '',
        category: category.id,
        price: 0,
        releaseYear: new Date().getFullYear(),
        rating: 4,
        tagline: '',
        accent: ACCENTS[0],
        specs: {},
      },
  )
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [idTouched, setIdTouched] = useState(!isNew)

  const errorFor = (field: string) => issues.find((i) => i.field === field)?.message

  const patch = (changes: Partial<Product>) => setDraft((current) => ({ ...current, ...changes }))

  const setSpec = (key: string, value: SpecValue) =>
    setDraft((current) => ({ ...current, specs: { ...current.specs, [key]: value } }))

  const progress = useMemo(
    () => completeness(category, draft.specs),
    [category, draft.specs],
  )

  const grouped = useMemo(() => {
    return category.groupOrder
      .map((groupId) => ({
        groupId,
        specs: category.specs.filter(
          (s) => s.group === groupId && !s.internal && s.key !== 'price' && s.key !== 'releaseYear',
        ),
      }))
      .filter((g) => g.specs.length > 0)
  }, [category])

  const save = () => {
    const candidate: Product = {
      ...draft,
      id: draft.id || suggestId(draft.brand, draft.name),
      name: draft.name.trim(),
      brand: draft.brand.trim(),
      category: category.id,
    }

    const result = isNew
      ? store.addDevice(category.id, candidate)
      : store.updateDevice(category.id, candidate)

    if (!result.ok) {
      setIssues(result.issues)
      return
    }

    setIssues([])
    onSaved(candidate)
    onToast(isNew ? `${candidate.name} added to your catalogue` : `${candidate.name} updated`)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isNew ? `Add a ${category.singular}` : `Edit ${target.name}`}
      description={
        isNew
          ? 'It joins your catalogue and is scored exactly like the built-in devices.'
          : isSeedDevice
            ? 'Only what you change is stored — everything else still tracks the built-in entry.'
            : 'A device you added.'
      }
      footer={
        <>
          {!isNew && (
            <>
              {confirmDelete ? (
                <div className="mr-auto flex items-center gap-2">
                  <span className="text-[12.5px] text-muted">
                    {isSeedDevice ? 'Hide this device?' : 'Delete for good?'}
                  </span>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      store.removeDevice(category.id, target.id)
                      onToast(
                        isSeedDevice
                          ? `${target.name} hidden from your catalogue`
                          : `${target.name} deleted`,
                      )
                      onClose()
                    }}
                  >
                    Yes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  icon={isSeedDevice ? 'EyeOff' : 'Trash2'}
                  className="mr-auto"
                  onClick={() => setConfirmDelete(true)}
                >
                  {isSeedDevice ? 'Hide' : 'Delete'}
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="Save" onClick={save}>
            {isNew ? 'Add device' : 'Save changes'}
          </Button>
        </>
      }
    >
      {issues.length > 0 && (
        <div className="ts-pop mb-4 rounded-2xl border border-danger/30 bg-danger-soft p-3.5">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-danger">
            <Icon name="CircleAlert" size={14} />
            {issues.length} thing{issues.length === 1 ? '' : 's'} to fix
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {issues.slice(0, 6).map((issue, i) => (
              <li key={i} className="text-[12.5px] text-danger">
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------------------------------------------- identity */}
      <div className="flex gap-4">
        <div className="h-[92px] w-[76px] shrink-0">
          <DeviceGlyph category={category.id} accent={draft.accent} />
        </div>
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <Field label="Brand" required error={errorFor('brand')}>
            <input
              className={inputClass(Boolean(errorFor('brand')))}
              value={draft.brand}
              placeholder="Apple"
              onChange={(e) => patch({ brand: e.target.value })}
            />
          </Field>
          <Field label="Name" required error={errorFor('name')}>
            <input
              className={inputClass(Boolean(errorFor('name')))}
              value={draft.name}
              placeholder="Galaxy S25 Ultra"
              onChange={(e) => {
                const name = e.target.value
                if (isNew && !idTouched) patch({ name, id: suggestId(draft.brand, name) })
                else patch({ name })
              }}
            />
          </Field>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Price (USD)" required error={errorFor('price')}>
          <input
            type="number"
            min={1}
            className={inputClass(Boolean(errorFor('price')))}
            value={draft.price || ''}
            placeholder="999"
            onChange={(e) => patch({ price: Number(e.target.value) })}
          />
        </Field>
        <Field label="Release year" required error={errorFor('releaseYear')}>
          <input
            type="number"
            className={inputClass(Boolean(errorFor('releaseYear')))}
            value={draft.releaseYear}
            onChange={(e) => patch({ releaseYear: Number(e.target.value) })}
          />
        </Field>
        <Field
          label="Your rating"
          hint="Shown on the card. Never used to rank specs — the engine only reads specs."
          error={errorFor('rating')}
        >
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            className={inputClass(Boolean(errorFor('rating')))}
            value={draft.rating}
            onChange={(e) => patch({ rating: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="One-line summary" error={errorFor('tagline')}>
          <input
            className={inputClass(Boolean(errorFor('tagline')))}
            value={draft.tagline}
            placeholder="What makes this one worth considering?"
            onChange={(e) => patch({ tagline: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Id" hint="Used in share links. Must be unique." error={errorFor('id')}>
          <input
            className={cn(inputClass(Boolean(errorFor('id'))), 'font-mono text-[13px]')}
            value={draft.id}
            disabled={!isNew}
            placeholder="galaxy-s25-ultra"
            onChange={(e) => {
              setIdTouched(true)
              patch({ id: slugify(e.target.value) })
            }}
          />
        </Field>
        <Field label="Accent colour" error={errorFor('accent')}>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {ACCENTS.map((colour) => (
              <button
                key={colour}
                type="button"
                aria-label={`Use ${colour}`}
                onClick={() => patch({ accent: colour })}
                className={cn(
                  'h-7 w-7 rounded-lg border-2 transition-transform active:scale-90',
                  draft.accent === colour ? 'border-ink' : 'border-transparent',
                )}
                style={{ background: colour }}
              />
            ))}
          </div>
        </Field>
      </div>

      {/* ---------------------------------------------------- completeness */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3.5">
        <div className="relative h-9 w-9 shrink-0">
          <svg viewBox="0 0 36 36" className="-rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--ts-surface-3)" strokeWidth="4" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="var(--ts-brand)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 15}
              strokeDashoffset={2 * Math.PI * 15 * (1 - progress.filled / Math.max(progress.total, 1))}
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="tnum text-[13px] font-medium text-ink">
            {progress.filled} of {progress.total} scoreable specs filled
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
            {progress.missingWeighted.length === 0
              ? 'Every spec the scoring engine weights is present.'
              : `Blank specs are skipped, not scored as zero. Still missing: ${progress.missingWeighted
                  .slice(0, 4)
                  .join(', ')}${progress.missingWeighted.length > 4 ? '…' : ''}`}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------- specs */}
      {grouped.map(({ groupId, specs }) => (
        <section key={groupId} className="mt-6">
          <h3 className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold tracking-wide text-faint uppercase">
            <Icon name={SPEC_GROUPS[groupId].icon} size={13} />
            {SPEC_GROUPS[groupId].label}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {specs.map((def) => (
              <SpecInput
                key={def.key}
                def={def}
                value={draft.specs[def.key] ?? null}
                error={errorFor(`specs.${def.key}`)}
                onChange={(value) => setSpec(def.key, value)}
              />
            ))}
          </div>
        </section>
      ))}
    </Modal>
  )
}

function SpecInput({
  def,
  value,
  error,
  onChange,
}: {
  def: SpecDef
  value: SpecValue
  error?: string
  onChange: (value: SpecValue) => void
}) {
  const label = def.unit ? `${def.label} (${def.unit})` : def.label

  if (def.kind === 'bool') {
    return (
      <div>
        <span className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
          {label}
          {def.hint && <InfoHint text={def.hint} />}
        </span>
        <div className="flex gap-1.5">
          {[
            { label: 'Yes', v: true as SpecValue },
            { label: 'No', v: false as SpecValue },
            { label: 'Unknown', v: null as SpecValue },
          ].map((option) => (
            <button
              key={String(option.label)}
              type="button"
              onClick={() => onChange(option.v)}
              className={cn(
                'h-9 flex-1 rounded-xl border text-[12.5px] font-medium transition-colors',
                value === option.v
                  ? 'border-brand bg-brand-soft text-brand-text'
                  : 'border-line bg-surface text-muted hover:border-line-strong',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (def.kind === 'enum' && def.enumOrder) {
    return (
      <Field label={label} hint={def.hint} error={error}>
        <div className="relative">
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={cn(inputClass(Boolean(error)), 'appearance-none pr-9')}
          >
            <option value="">Unknown</option>
            {def.enumOrder.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDown"
            size={15}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-faint"
          />
        </div>
      </Field>
    )
  }

  if (def.kind === 'number') {
    return (
      <Field label={label} hint={def.hint} error={error}>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            value={typeof value === 'number' ? value : ''}
            placeholder="Unknown"
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            className={inputClass(Boolean(error))}
          />
          {def.higherIsBetter !== null && (
            <span
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-faint"
              title={def.higherIsBetter ? 'Higher is better' : 'Lower is better'}
            >
              <Icon name={def.higherIsBetter ? 'ChevronUp' : 'ChevronDown'} size={13} />
            </span>
          )}
        </div>
      </Field>
    )
  }

  return (
    <Field label={label} hint={def.hint} error={error}>
      <input
        value={typeof value === 'string' ? value : ''}
        placeholder="Unknown"
        onChange={(e) => onChange(e.target.value || null)}
        className={inputClass(Boolean(error))}
      />
    </Field>
  )
}

/** Small marker shown on cards for devices the user owns or has changed. */
export function OwnershipBadge({
  added,
  edited,
}: {
  added: boolean
  edited: boolean
}) {
  if (added) return <Badge tone="brand" icon="Sparkles">YOURS</Badge>
  if (edited) return <Badge tone="neutral" icon="Pencil">EDITED</Badge>
  return null
}

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

/* -------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white shadow-soft hover:bg-brand-hover active:brightness-95 disabled:bg-surface-3 disabled:text-faint disabled:shadow-none',
  secondary:
    'bg-surface text-ink border border-line-strong/60 shadow-soft hover:border-line-strong hover:bg-surface-2 disabled:text-faint',
  ghost:
    'text-muted hover:text-ink hover:bg-surface-2 disabled:text-faint',
  quiet:
    'bg-surface-2 text-ink hover:bg-surface-3 disabled:text-faint',
  danger:
    'bg-transparent text-danger border border-danger/30 hover:bg-danger-soft hover:border-danger/50',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-[11.5px] gap-1 rounded-md',
  sm: 'h-8 px-2.5 text-[12.5px] gap-1.5 rounded-md',
  md: 'h-9 px-3 text-[13px] gap-1.5 rounded-md',
  lg: 'h-10 px-4 text-[13.5px] gap-2 rounded-md',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconRight?: string
  loading?: boolean
  block?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading,
  block,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const iconSize = size === 'xs' ? 13 : size === 'sm' ? 15 : 16
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap',
        'transition-colors duration-100',
        'disabled:cursor-not-allowed',
        BUTTON_SIZES[size],
        BUTTON_VARIANTS[variant],
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Icon name="Loader" size={iconSize} className="animate-spin" />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  )
}

/* ------------------------------------------------------------ IconButton */

function IconButton({
  icon,
  label,
  size = 'md',
  className,
  ...props
}: {
  icon: string
  label: string
  size?: 'sm' | 'md'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-muted',
        'transition-colors hover:bg-surface-2 hover:text-ink',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={size === 'sm' ? 15 : 17} />
    </button>
  )
}

/* ---------------------------------------------------------------- Chip */

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: string
  tone?: 'default' | 'solid'
}

export function Chip({ active, icon, tone = 'default', className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] font-medium',
        'transition-colors duration-100',
        active
          ? tone === 'solid'
            ? 'border-brand bg-brand text-white shadow-soft'
            : 'border-brand/45 bg-brand-soft text-brand-text'
          : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  )
}

/* --------------------------------------------------------------- Badge */

export function Badge({
  children,
  tone = 'neutral',
  icon,
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'best' | 'brand' | 'warn' | 'danger'
  icon?: string
  className?: string
}) {
  const tones = {
    neutral: 'bg-surface-2 text-muted border-line',
    best: 'bg-best-soft text-best border-best/25',
    brand: 'bg-brand-soft text-brand-text border-brand/25',
    warn: 'bg-best-soft text-warn border-warn/25',
    danger: 'bg-danger-soft text-danger border-danger/25',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-px',
        'text-[10.5px] font-semibold tracking-wide',
        tones[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}

/* -------------------------------------------------------------- Switch */

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
}) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 select-none" title={hint}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150',
          checked ? 'border-brand bg-brand' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white transition-transform duration-150',
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]',
          )}
        />
      </button>
      <span className="text-[13px] font-medium text-muted">{label}</span>
    </label>
  )
}

/* ------------------------------------------------------------- Tooltip */

export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [flipLeft, setFlipLeft] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setFlipLeft(rect.left + 270 > window.innerWidth)
  }, [open])

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'ts-pop pointer-events-none absolute bottom-full z-50 mb-2 w-max max-w-[250px]',
            'rounded-md border border-line-strong bg-surface px-2.5 py-1.5',
            'text-[12px] leading-snug font-normal text-ink shadow-float',
            flipLeft ? 'right-0' : 'left-0',
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}

export function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip content={text}>
      <button
        type="button"
        aria-label={`What is this? ${text}`}
        className="text-faint transition-colors hover:text-brand-text"
      >
        <Icon name="CircleHelp" size={14} />
      </button>
    </Tooltip>
  )
}

/* ------------------------------------------------------------ Skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('ts-shimmer rounded-xl', className)} />
}

/* ---------------------------------------------------------- EmptyState */

export function EmptyState({
  icon = 'Search',
  title,
  description,
  action,
  className,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-surface-2">
        <Icon name={icon} size={18} className="text-faint" />
      </div>
      <h3 className="text-[14.5px] font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/* --------------------------------------------------------------- Stars */

export function StarRating({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <span key={i} className="relative inline-flex">
            <Icon name="Star" size={size} className="text-line-strong" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Icon name="Star" size={size} className="fill-best text-best" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/* --------------------------------------------------------------- Modal */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Stop the page behind scrolling while a dialog owns the screen.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="ts-fade absolute inset-0 bg-ink/35 backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'ts-pop relative flex max-h-[90dvh] w-full flex-col overflow-hidden bg-surface shadow-float',
          'rounded-t-xl sm:rounded-xl',
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          <IconButton icon="X" label="Close" size="sm" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-line bg-surface-2 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- Disclosure */

/**
 * A collapsible section.
 *
 * The comparison page has a lot to say, but not all at once. Heavy sections
 * start closed with a one-line summary so the page opens calm.
 */
export function Disclosure({
  title,
  icon,
  summary,
  defaultOpen = false,
  children,
  id,
}: {
  title: string
  icon?: string
  /** One-line gist shown while collapsed. */
  summary?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  id?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <section id={id} className="ts-card scroll-mt-16 overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        {icon && <Icon name={icon} size={15} className="shrink-0 text-faint" />}
        <span className="text-[13.5px] font-semibold text-ink">{title}</span>
        {!open && summary && (
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">{summary}</span>
        )}
        <span className="ml-auto shrink-0 pl-2">
          <Icon
            name="ChevronDown"
            size={15}
            className={cn('text-faint transition-transform duration-150', open && 'rotate-180')}
          />
        </span>
      </button>

      {/* Printed output always shows the full section. */}
      <div
        id={panelId}
        className={cn('border-t border-line px-4 py-4', !open && 'hidden')}
      >
        {children}
      </div>
    </section>
  )
}

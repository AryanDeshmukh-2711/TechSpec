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
  xs: 'h-7 px-2.5 text-[12px] gap-1 rounded-lg',
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-4.5 text-[14px] gap-2 rounded-xl',
  lg: 'h-13 px-6 text-[15px] gap-2 rounded-2xl',
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
        'transition-all duration-150 ease-out',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
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

export function IconButton({
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
        'inline-flex items-center justify-center rounded-xl text-muted',
        'transition-colors hover:bg-surface-2 hover:text-ink active:scale-95',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
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
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium',
        'transition-all duration-150 active:scale-[0.97]',
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
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'text-[11px] font-semibold tracking-wide',
        tones[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}

/* --------------------------------------------------- SegmentedControl */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  label,
}: {
  options: { value: T; label: string; icon?: string }[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
  label?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-2xl border border-line bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl font-medium transition-all duration-150',
              size === 'sm' ? 'h-7 px-3 text-[12.5px]' : 'h-9 px-3.5 text-[13px]',
              active
                ? 'bg-surface text-ink shadow-soft'
                : 'text-muted hover:text-ink',
            )}
          >
            {option.icon && <Icon name={option.icon} size={14} />}
            {option.label}
          </button>
        )
      })}
    </div>
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
          'relative h-6 w-10 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-brand bg-brand' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-soft transition-transform duration-200',
            checked ? 'translate-x-[19px]' : 'translate-x-[3px]',
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
            'rounded-xl border border-line-strong bg-surface px-3 py-2',
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
    <div className={cn('flex flex-col items-center justify-center px-6 py-20 text-center', className)}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface-2">
        <Icon name={icon} size={24} className="text-faint" />
      </div>
      <h3 className="ts-display text-[20px] text-ink">{title}</h3>
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

/* --------------------------------------------------------------- Field */

export function Field({
  label,
  hint,
  error,
  children,
  required,
  className,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
        {label}
        {required && <span className="text-danger">*</span>}
        {hint && <InfoHint text={hint} />}
      </span>
      {children}
      {error && (
        <span className="mt-1 flex items-center gap-1 text-[12px] text-danger">
          <Icon name="CircleAlert" size={12} />
          {error}
        </span>
      )}
    </label>
  )
}

export const inputClass = (invalid?: boolean) =>
  cn(
    'h-11 w-full rounded-xl border bg-surface px-3.5 text-[14px] text-ink',
    'transition-colors placeholder:text-faint focus:outline-none',
    invalid
      ? 'border-danger focus:border-danger'
      : 'border-line hover:border-line-strong focus:border-brand',
  )

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
    <div className="ts-no-print fixed inset-0 z-100 flex items-end justify-center sm:items-center">
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
          'rounded-t-3xl sm:rounded-3xl',
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="ts-display text-[19px] text-ink">
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

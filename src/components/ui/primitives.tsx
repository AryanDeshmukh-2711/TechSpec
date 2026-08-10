import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

/* -------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white hover:brightness-110 active:brightness-95 shadow-[0_4px_16px_-6px_var(--ts-brand)] disabled:bg-surface-3 disabled:text-faint disabled:shadow-none',
  secondary:
    'bg-surface-2 text-ink border border-line hover:border-line-strong hover:bg-surface-3 disabled:text-faint',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2 disabled:text-faint',
  danger: 'bg-transparent text-danger border border-line hover:bg-danger/10 hover:border-danger/40',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconRight?: string
  loading?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const iconSize = size === 'sm' ? 14 : 16
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap',
        'transition-[background-color,border-color,color,filter,transform] duration-150',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        BUTTON_SIZES[size],
        BUTTON_VARIANTS[variant],
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

/* ---------------------------------------------------------------- Chip */

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: string
  removable?: boolean
}

export function Chip({ active, icon, removable, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium',
        'transition-colors duration-150 active:scale-[0.97]',
        active
          ? 'border-brand/60 bg-brand-soft text-brand-text'
          : 'border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink',
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
      {removable && <Icon name="X" size={13} className="-mr-0.5 opacity-70" />}
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
  tone?: 'neutral' | 'best' | 'brand' | 'warn'
  icon?: string
  className?: string
}) {
  const tones = {
    neutral: 'bg-surface-3 text-muted border-line',
    best: 'bg-best-soft text-best border-best/30',
    brand: 'bg-brand-soft text-brand-text border-brand/30',
    warn: 'bg-warn/10 text-warn border-warn/30',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tracking-wide',
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
        'inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface-2 p-1',
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
              'inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active
                ? 'bg-surface text-ink shadow-[0_1px_3px_rgb(0_0_0/0.15)]'
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
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2.5 select-none"
      title={hint}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-brand bg-brand' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
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
    // Flip to the right edge when the bubble would overflow the viewport.
    const rect = ref.current.getBoundingClientRect()
    setFlipLeft(rect.left + 260 > window.innerWidth)
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
            'ts-fade pointer-events-none absolute bottom-full z-50 mb-2 w-max max-w-[240px]',
            'rounded-lg border border-line-strong bg-surface px-2.5 py-1.5',
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
        className="text-faint transition-colors hover:text-muted"
      >
        <Icon name="CircleHelp" size={13} />
      </button>
    </Tooltip>
  )
}

/* ------------------------------------------------------------ Skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('ts-shimmer rounded-lg', className)} />
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
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-2">
        <Icon name={icon} size={22} className="text-faint" />
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* --------------------------------------------------------------- Stars */

export function StarRating({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${value} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <span key={i} className="relative inline-flex">
            <Icon name="Star" size={size} className="text-line-strong" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Icon name="Star" size={size} className="fill-warn text-warn" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

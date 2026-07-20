import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={clsx('card', className)}>{children}</div>;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

export function Button({ variant = 'primary', loading, className, children, disabled, ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-ghost';
  return (
    <button className={clsx(variantClass, className)} disabled={disabled || loading} {...rest}>
      {loading && (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  );
}

const difficultyClasses: Record<string, string> = {
  Easy: 'text-difficulty-easy border-difficulty-easy/30 bg-difficulty-easy/10',
  Medium: 'text-difficulty-medium border-difficulty-medium/30 bg-difficulty-medium/10',
  Hard: 'text-difficulty-hard border-difficulty-hard/30 bg-difficulty-hard/10',
};

export function DifficultyBadge({ difficulty }: { difficulty: 'Easy' | 'Medium' | 'Hard' }) {
  return (
    <span className={clsx('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', difficultyClasses[difficulty])}>
      {difficulty}
    </span>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-md bg-surface-raised', className)} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-border rounded-xl2">
      <h3 className="font-display text-lg text-ink mb-1.5">{title}</h3>
      <p className="text-sm text-ink-muted max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

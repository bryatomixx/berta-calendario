import { type ReactNode, type ElementType } from 'react';

interface CardProps {
  variant?: 'default' | 'flat' | 'highlighted';
  padding?: 'md' | 'sm' | 'none';
  as?: ElementType;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const VARIANT_CLASSES: Record<NonNullable<CardProps['variant']>, string> = {
  default:     'bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-card',
  flat:        'bg-white rounded-[var(--radius-xl)] border border-[var(--color-border-soft)]',
  highlighted: 'bg-[var(--color-teal-50)]/60 rounded-[var(--radius-xl)] border border-[var(--color-teal-200)]/70',
};

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  md:   'p-[var(--card-p)]',
  sm:   'p-[var(--card-p-sm)]',
  none: '',
};

export function Card({
  variant = 'default',
  padding = 'md',
  as: Tag = 'div',
  children,
  className = '',
  onClick,
}: CardProps) {
  const isClickable = !!onClick || Tag === 'button';

  return (
    <Tag
      onClick={onClick}
      className={[
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        isClickable
          ? 'hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 cursor-pointer'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}

/**
 * ConnectEam-inspired UI Components
 * Reusable component styles and utilities
 */

import { designSystem } from '@/lib/design-system';

/**
 * Primary CTA Button - Connecteam style
 */
export function PrimaryButton({
  children,
  onClick,
  className = '',
  disabled = false,
  size = 'md',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg font-semibold transition-all duration-200
        bg-gradient-to-r from-blue-500 to-blue-600 
        hover:from-blue-600 hover:to-blue-700
        text-white
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-md hover:shadow-lg
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * Secondary Button - Connecteam style
 */
export function SecondaryButton({
  children,
  onClick,
  className = '',
  disabled = false,
  size = 'md',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg font-semibold transition-all duration-200
        bg-gray-100 dark:bg-gray-800
        text-gray-900 dark:text-white
        hover:bg-gray-200 dark:hover:bg-gray-700
        border border-gray-300 dark:border-gray-600
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * Feature Card - for displaying features/metrics
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  onClick,
  className = '',
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`
        feature-card
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="feature-card-icon">
        <Icon size={28} />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

/**
 * Stat Card - for displaying metrics
 */
export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  className = '',
}: {
  label: string;
  value: string | number;
  change?: { value: number; isPositive: boolean };
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}) {
  return (
    <div className={`card-elevated ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={`text-xs mt-2 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {change.isPositive ? '+' : ''}{change.value}% from last period
            </p>
          )}
        </div>
        {Icon && (
          <div className="bg-primary/10 p-3 rounded-lg">
            <Icon size={24} className="text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Section Header - for page sections
 */
export function SectionHeader({
  title,
  description,
  action,
  className = '',
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

/**
 * Badge - for tags and labels
 */
export function Badge({
  children,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}) {
  const variantClasses = {
    primary: 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100',
    secondary: 'bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-100',
    success: 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100',
    warning: 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100',
    error: 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

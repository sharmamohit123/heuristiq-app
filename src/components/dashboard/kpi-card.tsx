import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
  iconColor?: string
  iconBgColor?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
}: KPICardProps) {
  return (
    <div className="flex flex-col p-5 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <div className={cn('p-1.5 rounded-lg', iconBgColor, iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-auto">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-xs font-bold',
                trend.positive
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-red-600 bg-red-50'
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

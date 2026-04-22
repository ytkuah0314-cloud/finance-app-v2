import { CATEGORY_CONFIG } from '../utils/constants'
import { formatRM } from '../utils/format'

export default function BudgetBar({ category, spent, limit }) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['其他']
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : cfg.bar
  const textColor = pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-orange-500' : 'text-gray-600'

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <span>{cfg.emoji}</span>
          {category}
        </span>
        <span className={`text-sm font-semibold ${textColor}`}>
          {formatRM(spent)} / {formatRM(limit)}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-xs text-gray-400">{pct.toFixed(0)}% 已用</span>
        <span className="text-xs text-gray-400">剩余 {formatRM(Math.max(limit - spent, 0))}</span>
      </div>
    </div>
  )
}

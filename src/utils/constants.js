export const EXPENSE_CATEGORIES = ['餐饮', '生活品质', '必要支出', '其他']
export const INCOME_CATEGORIES = ['薪水', '其他']
export const ALL_CATEGORIES = ['餐饮', '生活品质', '必要支出', '薪水', '其他']
export const BUDGET_CATEGORIES = ['餐饮', '生活品质', '必要支出']

export const CATEGORY_CONFIG = {
  '餐饮':   { emoji: '🍜', bg: 'bg-orange-100', text: 'text-orange-600', bar: 'bg-orange-500', defaultLimit: 1000 },
  '生活品质': { emoji: '✨', bg: 'bg-purple-100', text: 'text-purple-600', bar: 'bg-purple-500', defaultLimit: 800 },
  '必要支出': { emoji: '🏠', bg: 'bg-blue-100',   text: 'text-blue-600',   bar: 'bg-blue-500',   defaultLimit: 2000 },
  '薪水':   { emoji: '💰', bg: 'bg-green-100',  text: 'text-green-600',  bar: 'bg-green-500',  defaultLimit: 0 },
  '其他':   { emoji: '📦', bg: 'bg-gray-100',   text: 'text-gray-600',   bar: 'bg-gray-400',   defaultLimit: 0 },
}

export const SALARY_ALLOCATION = {
  savings:   { label: '储蓄',   pct: 30, color: '#22C55E', tw: 'bg-green-500' },
  essential: { label: '必要支出', pct: 50, color: '#3B82F6', tw: 'bg-blue-500' },
  lifestyle: { label: '生活品质', pct: 20, color: '#A855F7', tw: 'bg-purple-500' },
}

export const SAVINGS_TARGET = 100000

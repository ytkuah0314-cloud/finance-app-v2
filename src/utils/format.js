export const formatRM = (amount) => {
  const num = Math.abs(Number(amount) || 0)
  return `RM ${num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const formatMonthDisplay = (month) => {
  if (!month) return ''
  const [year, m] = month.split('-')
  return `${year}年${parseInt(m)}月`
}

export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

export const prevMonth = (month) => {
  const [y, m] = month.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

export const nextMonth = (month) => {
  const [y, m] = month.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

export const groupByDate = (transactions) => {
  const groups = {}
  transactions.forEach((t) => {
    const key = t.date
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Settings2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { BUDGET_CATEGORIES, CATEGORY_CONFIG } from '../utils/constants'
import { formatRM, getCurrentMonth, formatMonthDisplay, prevMonth, nextMonth } from '../utils/format'
import BudgetBar from '../components/BudgetBar'

const CURRENT = getCurrentMonth()

function BudgetEditor({ budgets, month, onSaved, onClose }) {
  const [limits, setLimits] = useState(() => {
    const init = {}
    BUDGET_CATEGORIES.forEach((cat) => {
      const b = budgets.find((b) => b.category === cat)
      init[cat] = b ? String(b.monthly_limit) : String(CATEGORY_CONFIG[cat]?.defaultLimit || 0)
    })
    return init
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    for (const cat of BUDGET_CATEGORIES) {
      const val = parseFloat(limits[cat]) || 0
      await supabase.from('budgets').upsert(
        { category: cat, monthly_limit: val, month },
        { onConflict: 'category,month' }
      )
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-2xl pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">设置预算上限</h2>
          <p className="text-xs text-gray-400 mt-0.5">{formatMonthDisplay(month)}</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {BUDGET_CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat]
            return (
              <div key={cat}>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <span>{cfg.emoji}</span> {cat}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">RM</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={limits[cat]}
                    onChange={(e) => setLimits((l) => ({ ...l, [cat]: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            )
          })}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl mt-2 disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存预算'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatRM(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Monthly() {
  const [month, setMonth] = useState(CURRENT)
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [y, m] = month.split('-')
    const lastDay = new Date(Number(y), Number(m), 0).getDate()
    const [{ data: txns }, { data: bdgs }] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .gte('date', `${month}-01`)
        .lte('date', `${month}-${lastDay}`)
        .order('date'),
      supabase.from('budgets').select('*').eq('month', month),
    ])
    setTransactions(txns || [])
    setBudgets(bdgs || [])
    setLoading(false)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const net = income - expense

  const getBudgetSpent = (cat) =>
    transactions.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + Number(t.amount), 0)
  const getBudgetLimit = (cat) => {
    const b = budgets.find((b) => b.category === cat)
    return b ? Number(b.monthly_limit) : CATEGORY_CONFIG[cat]?.defaultLimit || 0
  }

  // Category breakdown for bar chart
  const chartData = BUDGET_CATEGORIES.map((cat) => ({
    name: cat,
    支出: getBudgetSpent(cat),
    预算: getBudgetLimit(cat),
  }))

  // All categories breakdown list
  const categoryTotals = [...new Set(transactions.filter((t) => t.type === 'expense').map((t) => t.category))]
    .map((cat) => ({
      cat,
      amount: transactions.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + Number(t.amount), 0),
    }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with month nav */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(prevMonth(month))} className="p-2 hover:bg-gray-100 rounded-xl">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-base font-semibold text-gray-800">{formatMonthDisplay(month)}</h1>
          <button
            onClick={() => setMonth(nextMonth(month))}
            disabled={month >= CURRENT}
            className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-30"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <TrendingUp size={16} className="text-green-500 mx-auto mb-1" />
              <p className="text-xs text-gray-400">收入</p>
              <p className="text-sm font-bold text-green-600 mt-0.5">{formatRM(income)}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <TrendingDown size={16} className="text-red-500 mx-auto mb-1" />
              <p className="text-xs text-gray-400">支出</p>
              <p className="text-sm font-bold text-red-500 mt-0.5">{formatRM(expense)}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <Minus size={16} className={`mx-auto mb-1 ${net >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
              <p className="text-xs text-gray-400">净额</p>
              <p className={`text-sm font-bold mt-0.5 ${net >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                {net >= 0 ? '+' : ''}{formatRM(net)}
              </p>
            </div>
          </div>

          {/* Bar Chart: Budget vs Spent */}
          {expense > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">支出 vs 预算</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="预算" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="支出" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => {
                      const pct = entry.预算 > 0 ? entry.支出 / entry.预算 : 0
                      const color = pct >= 1 ? '#EF4444' : pct >= 0.8 ? '#F97316' : '#3B82F6'
                      return <Cell key={i} fill={color} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Budget Detail */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">预算详情</h2>
              <button
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Settings2 size={13} /> 设置预算
              </button>
            </div>
            <div className="space-y-4">
              {BUDGET_CATEGORIES.map((cat) => (
                <BudgetBar
                  key={cat}
                  category={cat}
                  spent={getBudgetSpent(cat)}
                  limit={getBudgetLimit(cat)}
                />
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryTotals.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">分类支出</h2>
              <div className="space-y-2">
                {categoryTotals.map(({ cat, amount }) => {
                  const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['其他']
                  const pct = expense > 0 ? (amount / expense) * 100 : 0
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 ${cfg.bg}`}>
                        {cfg.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700 font-medium">{cat}</span>
                          <span className="text-gray-500">{formatRM(amount)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-9 text-right shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {transactions.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-gray-400 text-sm">本月暂无交易记录</p>
            </div>
          )}
        </div>
      )}

      {showEditor && (
        <BudgetEditor
          budgets={budgets}
          month={month}
          onSaved={fetchData}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}

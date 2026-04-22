import { useState, useEffect, useCallback } from 'react'
import { Plus, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BUDGET_CATEGORIES, CATEGORY_CONFIG, SAVINGS_TARGET } from '../utils/constants'
import { formatRM, getCurrentMonth, formatDateDisplay } from '../utils/format'
import BudgetBar from '../components/BudgetBar'
import TransactionModal from '../components/TransactionModal'

export default function Dashboard() {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const month = getCurrentMonth()

  const fetchAll = useCallback(async () => {
    const [{ data: accs }, { data: txns }, { data: bdgs }] = await Promise.all([
      supabase.from('bank_accounts').select('*').order('name'),
      supabase.from('transactions').select('*').gte('date', `${month}-01`).lte('date', `${month}-31`).order('date', { ascending: false }),
      supabase.from('budgets').select('*').eq('month', month),
    ])
    setAccounts(accs || [])
    setTransactions(txns || [])
    setBudgets(bdgs || [])
    setLoading(false)
  }, [month])

  useEffect(() => {
    fetchAll()
    const channel = supabase.channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_accounts' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchAll])

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0)
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const savingsPct = Math.min((totalBalance / SAVINGS_TARGET) * 100, 100)

  const getBudgetSpent = (cat) =>
    transactions.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + Number(t.amount), 0)

  const getBudgetLimit = (cat) => {
    const b = budgets.find((b) => b.category === cat)
    return b ? Number(b.monthly_limit) : CATEGORY_CONFIG[cat]?.defaultLimit || 0
  }

  const handleSaveTransaction = async (form) => {
    await supabase.from('transactions').insert([form])
    setShowModal(false)
    fetchAll()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 px-5 pt-12 pb-8 text-white">
        <p className="text-blue-200 text-sm mb-1">财务管理</p>
        <h1 className="text-3xl font-bold tracking-tight">{formatRM(totalBalance)}</h1>
        <p className="text-blue-200 text-sm mt-1">总资产</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-4">
        {/* Savings Goal */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">RM100k 存款目标</span>
            </div>
            <span className="text-sm font-bold text-blue-600">{savingsPct.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
              style={{ width: `${savingsPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400">{formatRM(totalBalance)}</span>
            <span className="text-xs text-gray-400">目标 {formatRM(SAVINGS_TARGET)}</span>
          </div>
        </div>

        {/* Month Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-green-500" />
              <span className="text-xs text-gray-500">本月收入</span>
            </div>
            <p className="text-lg font-bold text-green-600">{formatRM(income)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={14} className="text-red-500" />
              <span className="text-xs text-gray-500">本月支出</span>
            </div>
            <p className="text-lg font-bold text-red-500">{formatRM(expense)}</p>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">预算追踪</h2>
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

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">近期交易</h2>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">暂无交易记录</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((t) => {
                const cfg = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG['其他']
                return (
                  <div key={t.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${cfg.bg}`}>
                        {cfg.emoji}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {t.description || t.category}
                        </p>
                        <p className="text-xs text-gray-400">{formatDateDisplay(t.date)} · {t.category}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatRM(t.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 z-40"
      >
        <Plus size={26} />
      </button>

      {showModal && (
        <TransactionModal
          bankAccounts={accounts}
          onSave={handleSaveTransaction}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

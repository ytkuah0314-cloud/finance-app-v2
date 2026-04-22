import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ALL_CATEGORIES, CATEGORY_CONFIG } from '../utils/constants'
import { formatRM, formatDateDisplay, groupByDate } from '../utils/format'
import TransactionModal from '../components/TransactionModal'

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-800 mb-1">删除交易</h3>
        <p className="text-sm text-gray-400 mb-4">此操作无法撤销，确定要删除吗？</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm">取消</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-semibold">删除</button>
        </div>
      </div>
    </div>
  )
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('全部')
  const [filterType, setFilterType] = useState('全部')

  const fetchAll = useCallback(async () => {
    const [{ data: txns }, { data: accs }] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('bank_accounts').select('*').order('name'),
    ])
    setTransactions(txns || [])
    setAccounts(accs || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const ch = supabase.channel('txn_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchAll])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.category.includes(search)
      const matchCat = filterCat === '全部' || t.category === filterCat
      const matchType = filterType === '全部' || t.type === filterType
      return matchSearch && matchCat && matchType
    })
  }, [transactions, search, filterCat, filterType])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const handleSave = async (form) => {
    if (editing) {
      await supabase.from('transactions').update(form).eq('id', editing.id)
    } else {
      await supabase.from('transactions').insert([form])
    }
    setShowModal(false)
    setEditing(null)
    fetchAll()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await supabase.from('transactions').delete().eq('id', deleting)
    setDeleting(null)
    fetchAll()
  }

  const handleEdit = (t) => {
    setEditing(t)
    setShowModal(true)
  }

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const accountName = (id) => accounts.find((a) => a.id === id)?.name || ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800">交易记录</h1>
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-medium"
          >
            <Plus size={15} /> 新增
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索交易..."
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="w-full appearance-none bg-gray-100 rounded-xl py-1.5 pl-3 pr-7 text-xs text-gray-600 focus:outline-none"
            >
              <option>全部</option>
              {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full appearance-none bg-gray-100 rounded-xl py-1.5 pl-3 pr-7 text-xs text-gray-600 focus:outline-none"
            >
              <option>全部</option>
              <option value="income">收入</option>
              <option value="expense">支出</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex bg-white border-b border-gray-100 px-4 py-2 gap-4">
        <span className="text-xs text-gray-400">{filtered.length} 笔交易</span>
        <span className="text-xs text-green-600 font-medium">+{formatRM(totalIncome)}</span>
        <span className="text-xs text-red-500 font-medium">-{formatRM(totalExpense)}</span>
      </div>

      {/* List */}
      <div className="pb-4">
        {grouped.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400 text-sm">暂无交易记录</p>
          </div>
        ) : (
          grouped.map(([date, items]) => (
            <div key={date}>
              {/* Date group header */}
              <div className="px-4 py-2 bg-gray-50 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500">{formatDateDisplay(date)}</span>
                <span className="text-xs text-gray-400">
                  {items.length} 笔 · 净 {
                    (() => {
                      const net = items.reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0)
                      return (net >= 0 ? '+' : '') + formatRM(Math.abs(net))
                    })()
                  }
                </span>
              </div>

              {/* Transactions */}
              <div className="bg-white">
                {items.map((t, i) => {
                  const cfg = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG['其他']
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center gap-3 px-4 py-3 ${i < items.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${cfg.bg}`}>
                        {cfg.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {t.description || t.category}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.category}{accountName(t.bank_account_id) ? ` · ${accountName(t.bank_account_id)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatRM(t.amount)}
                        </span>
                        <button onClick={() => handleEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleting(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditing(null); setShowModal(true) }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <Plus size={26} />
      </button>

      {showModal && (
        <TransactionModal
          transaction={editing}
          bankAccounts={accounts}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <DeleteConfirm
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

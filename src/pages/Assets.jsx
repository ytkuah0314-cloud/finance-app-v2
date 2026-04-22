import { useState, useEffect, useCallback } from 'react'
import { Pencil, Check, X, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatRM } from '../utils/format'

function BankCard({ account, onEdit }) {
  const isPB = account.name.toLowerCase().includes('public')
  const gradient = isPB
    ? 'from-blue-900 to-blue-700'
    : 'from-red-800 to-red-600'

  return (
    <div className={`relative rounded-2xl p-5 text-white bg-gradient-to-br ${gradient} shadow-lg overflow-hidden`}>
      {/* decorative circles */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -right-2 w-24 h-24 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest">{account.name}</p>
            <p className="text-white/60 text-xs mt-0.5">Savings Account</p>
          </div>
          <button
            onClick={() => onEdit(account)}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Pencil size={14} />
          </button>
        </div>
        <p className="text-2xl font-bold mt-4 tracking-tight">{formatRM(account.balance)}</p>
        <div className="flex items-center gap-1 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-white/60 text-xs">已同步</span>
        </div>
      </div>
    </div>
  )
}

function EditModal({ account, onSave, onClose }) {
  const [balance, setBalance] = useState(String(account.balance))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const val = parseFloat(balance)
    if (isNaN(val) || val < 0) return
    setSaving(true)
    await onSave(account.id, val)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-800 mb-1">更新余额</h3>
        <p className="text-sm text-gray-400 mb-4">{account.name}</p>

        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">RM</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-800 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? '保存中...' : '确认更新'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Assets() {
  const [accounts, setAccounts] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase.from('bank_accounts').select('*').order('name')
    setAccounts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAccounts()
    const ch = supabase.channel('assets_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_accounts' }, fetchAccounts)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchAccounts])

  const handleSaveBalance = async (id, balance) => {
    await supabase
      .from('bank_accounts')
      .update({ balance, updated_at: new Date().toISOString() })
      .eq('id', id)
    fetchAccounts()
  }

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0)

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
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-5 pt-12 pb-8 text-white">
        <p className="text-slate-400 text-sm mb-1">我的资产</p>
        <h1 className="text-3xl font-bold tracking-tight">{formatRM(total)}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {accounts.length} 个银行账户
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-4">
        {/* Bank Cards */}
        {accounts.map((acc) => (
          <BankCard key={acc.id} account={acc} onEdit={setEditing} />
        ))}

        {accounts.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-400 text-sm">
              请先在 Supabase 中执行 SQL Schema 建立账户数据
            </p>
          </div>
        )}

        {/* Total Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">资产摘要</h2>
          {accounts.map((acc) => (
            <div key={acc.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{acc.name}</span>
              <span className="text-sm font-semibold text-gray-800">{formatRM(acc.balance)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 mt-1">
            <span className="text-sm font-bold text-gray-700">总资产</span>
            <span className="text-base font-bold text-blue-700">{formatRM(total)}</span>
          </div>
        </div>

        <button
          onClick={fetchAccounts}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-2xl text-gray-500 text-sm hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw size={15} />
          刷新数据
        </button>
      </div>

      {editing && (
        <EditModal
          account={editing}
          onSave={handleSaveBalance}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

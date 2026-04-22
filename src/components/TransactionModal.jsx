import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_CONFIG } from '../utils/constants'
import { getCurrentMonth } from '../utils/format'

const EMPTY_FORM = {
  type: 'expense',
  amount: '',
  category: '餐饮',
  description: '',
  date: new Date().toISOString().split('T')[0],
  bank_account_id: '',
}

export default function TransactionModal({ transaction, bankAccounts, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: String(transaction.amount),
        category: transaction.category,
        description: transaction.description || '',
        date: transaction.date,
        bank_account_id: transaction.bank_account_id || '',
      })
    } else {
      setForm({ ...EMPTY_FORM, bank_account_id: bankAccounts[0]?.id || '' })
    }
  }, [transaction, bankAccounts])

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleTypeChange = (type) => {
    const defaultCat = type === 'income' ? '薪水' : '餐饮'
    setForm((f) => ({ ...f, type, category: defaultCat }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) return
    setSaving(true)
    await onSave({
      ...form,
      amount: parseFloat(form.amount),
      bank_account_id: form.bank_account_id || null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {transaction ? '编辑交易' : '新增交易'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Type Toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
            {['expense', 'income'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-red-500 text-white shadow'
                      : 'bg-green-500 text-white shadow'
                    : 'text-gray-500'
                }`}
              >
                {t === 'expense' ? '💸 支出' : '💰 收入'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">金额 (RM)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">RM</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">分类</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: cat }))}
                    className={`flex flex-col items-center py-2 rounded-xl border-2 text-sm transition-all ${
                      form.category === cat
                        ? `border-blue-500 ${cfg.bg} ${cfg.text}`
                        : 'border-gray-100 bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="text-xl">{cfg.emoji}</span>
                    <span className="text-xs mt-0.5">{cat}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bank Account */}
          {bankAccounts.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">银行账户</label>
              <select
                value={form.bank_account_id}
                onChange={(e) => setForm((f) => ({ ...f, bank_account_id: e.target.value }))}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">不指定账户</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">备注（选填）</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="输入备注..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">日期</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {saving ? '保存中...' : transaction ? '保存修改' : '添加交易'}
          </button>
        </form>
      </div>
    </div>
  )
}

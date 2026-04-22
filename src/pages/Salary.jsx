import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../lib/supabase'
import { SALARY_ALLOCATION } from '../utils/constants'
import { formatRM, getCurrentMonth, formatMonthDisplay, prevMonth, nextMonth } from '../utils/format'

const CURRENT = getCurrentMonth()

const ALLOC_LIST = [
  { key: 'savings',   label: '储蓄',   pct: 30, color: '#22C55E', bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  { key: 'essential', label: '必要支出', pct: 50, color: '#3B82F6', bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  { key: 'lifestyle', label: '生活品质', pct: 20, color: '#A855F7', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
]

function SalaryForm({ record, month, onSaved, onClose }) {
  const [amount, setAmount] = useState(record ? String(record.amount) : '')
  const [notes, setNotes] = useState(record?.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const val = parseFloat(amount)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    if (record) {
      await supabase.from('salary_records').update({ amount: val, notes }).eq('id', record.id)
    } else {
      await supabase.from('salary_records').insert([{ amount: val, month, notes }])
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  const preview = parseFloat(amount) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-2xl pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{record ? '编辑薪水' : '录入薪水'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{formatMonthDisplay(month)}</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">薪水金额 (RM)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">RM</span>
              <input
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-800 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Live preview */}
          {preview > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 mb-2">分配预览</p>
              {ALLOC_LIST.map((a) => (
                <div key={a.key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{a.label} ({a.pct}%)</span>
                  <span className="font-semibold text-gray-800">{formatRM(preview * a.pct / 100)}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">备注（选填）</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="如：3月薪资 + 奖金"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-60"
          >
            {saving ? '保存中...' : record ? '保存修改' : '确认录入'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p style={{ color: d.payload.color }} className="font-semibold">{d.name}</p>
      <p className="text-gray-600">{formatRM(d.value)}</p>
    </div>
  )
}

export default function Salary() {
  const [month, setMonth] = useState(CURRENT)
  const [record, setRecord] = useState(null)
  const [history, setHistory] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: rec }, { data: hist }] = await Promise.all([
      supabase.from('salary_records').select('*').eq('month', month).maybeSingle(),
      supabase.from('salary_records').select('*').order('month', { ascending: false }).limit(12),
    ])
    setRecord(rec || null)
    setHistory(hist || [])
    setLoading(false)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  const salary = record ? Number(record.amount) : 0

  const pieData = ALLOC_LIST.map((a) => ({
    name: a.label,
    value: salary * a.pct / 100,
    color: a.color,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
          {/* Salary Card */}
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-200 text-sm mb-1">本月薪水</p>
                <p className="text-3xl font-bold tracking-tight">{salary > 0 ? formatRM(salary) : '未录入'}</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              >
                {record ? <Pencil size={16} /> : <Plus size={16} />}
              </button>
            </div>
            {record?.notes && (
              <p className="text-green-200 text-sm mt-3">{record.notes}</p>
            )}
          </div>

          {/* Allocation Breakdown */}
          {salary > 0 ? (
            <>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">薪水分配方案</h2>
                <div className="space-y-3">
                  {ALLOC_LIST.map((a) => {
                    const allocAmount = salary * a.pct / 100
                    return (
                      <div key={a.key} className={`flex items-center justify-between p-3 rounded-xl ${a.bg}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${a.dot}`} />
                          <span className={`text-sm font-medium ${a.text}`}>{a.label}</span>
                          <span className={`text-xs ${a.text} opacity-70`}>{a.pct}%</span>
                        </div>
                        <span className={`text-base font-bold ${a.text}`}>{formatRM(allocAmount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">分配可视化</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-3xl mb-2">💰</p>
              <p className="text-gray-500 text-sm mb-3">本月薪水未录入</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2 bg-blue-600 text-white text-sm rounded-xl font-medium hover:bg-blue-700"
              >
                录入薪水
              </button>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">薪水历史</h2>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{formatMonthDisplay(h.month)}</p>
                      {h.notes && <p className="text-xs text-gray-400 mt-0.5">{h.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{formatRM(h.amount)}</p>
                      <p className="text-xs text-gray-400">储蓄 {formatRM(h.amount * 0.3)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <SalaryForm
          record={record}
          month={month}
          onSaved={fetchData}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

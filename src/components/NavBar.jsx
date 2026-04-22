import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wallet, Calendar, ArrowLeftRight, Banknote } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/dashboard',    Icon: LayoutDashboard, label: '仪表板' },
  { path: '/assets',       Icon: Wallet,           label: '资产' },
  { path: '/monthly',      Icon: Calendar,         label: '月度' },
  { path: '/transactions', Icon: ArrowLeftRight,   label: '流水' },
  { path: '/salary',       Icon: Banknote,         label: '薪水' },
]

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {NAV_ITEMS.map(({ path, Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[11px]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

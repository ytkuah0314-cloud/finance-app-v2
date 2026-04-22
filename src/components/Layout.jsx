import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative shadow-lg">
        <main className="pb-20 min-h-screen">
          <Outlet />
        </main>
        <NavBar />
      </div>
    </div>
  )
}

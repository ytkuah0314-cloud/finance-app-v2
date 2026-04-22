import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Monthly from './pages/Monthly'
import Transactions from './pages/Transactions'
import Salary from './pages/Salary'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="monthly" element={<Monthly />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="salary" element={<Salary />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

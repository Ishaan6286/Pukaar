import { createBrowserRouter, Outlet } from 'react-router-dom'

import App from '@/App'
import Home from '@/routes/citizen/Home'
import ReportFlow from '@/routes/citizen/ReportFlow'
import MyReports from '@/routes/citizen/MyReports'
import ReportStatus from '@/routes/citizen/ReportStatus'
import HelpMap from '@/routes/citizen/HelpMap'
import Feed from '@/routes/citizen/Feed'
import Dashboard from '@/routes/ngo/Dashboard'
import ReportDetail from '@/routes/ngo/ReportDetail'
import NewPost from '@/routes/ngo/NewPost'
import Login from '@/routes/Login'

import ProtectedRoute from '@/components/ProtectedRoute'
import RoleGate from '@/components/RoleGate'

function NotFound() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">404 — Not found</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        // Citizen routes
        element: (
          <ProtectedRoute>
            <RoleGate allow={['citizen', 'admin']}>
              <Outlet />
            </RoleGate>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Home /> },
          { path: 'report', element: <ReportFlow /> },
          { path: 'reports', element: <MyReports /> },
          { path: 'reports/:reportId', element: <ReportStatus /> },
          { path: 'map', element: <HelpMap /> },
          { path: 'feed', element: <Feed /> },
        ]
      },
      {
        // NGO Routes
        path: 'ngo',
        element: (
          <ProtectedRoute>
            <RoleGate allow={['ngo', 'admin']}>
              <Outlet />
            </RoleGate>
          </ProtectedRoute>
        ),
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'reports/:reportId', element: <ReportDetail /> },
          { path: 'posts/new', element: <NewPost /> },
        ]
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

import { createBrowserRouter, Navigate } from 'react-router-dom'

import App from '@/App'
import CitizenLayout from '@/routes/citizen/CitizenLayout'
import ReportFlow from '@/routes/citizen/ReportFlow'
import MyReports from '@/routes/citizen/MyReports'
import ReportStatus from '@/routes/citizen/ReportStatus'
import HelpMap from '@/routes/citizen/HelpMap'
import Feed from '@/routes/citizen/Feed'
import NgoProfile from '@/routes/citizen/NgoProfile'
import Dashboard from '@/routes/ngo/Dashboard'
import ReportDetail from '@/routes/ngo/ReportDetail'
import NewPost from '@/routes/ngo/NewPost'
import Login from '@/routes/Login'
import Profile from '@/routes/Profile'
import RoleGate from '@/components/RoleGate'

const notFoundElement = (
  <div className="p-6">
    <h1 className="text-2xl font-semibold">404 — Not found</h1>
    <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: 'login', element: <Login /> },

      {
        element: (
          <RoleGate allow={['citizen', 'ngo_admin']}>
            <CitizenLayout />
          </RoleGate>
        ),
        children: [
          { index: true, element: <Feed /> },
          { path: 'feed', element: <Navigate to="/" replace /> },
          { path: 'report', element: <ReportFlow /> },
          { path: 'reports', element: <MyReports /> },
          { path: 'reports/:reportId', element: <ReportStatus /> },
          { path: 'map', element: <HelpMap /> },
          { path: 'profile', element: <Profile /> },
          { path: 'ngos/:ngoId', element: <NgoProfile /> },
        ],
      },

      {
        path: 'ngo/dashboard',
        element: (
          <RoleGate allow={['ngo_admin']}>
            <Dashboard />
          </RoleGate>
        ),
      },
      {
        path: 'ngo/reports/:reportId',
        element: (
          <RoleGate allow={['ngo_admin']}>
            <ReportDetail />
          </RoleGate>
        ),
      },
      {
        path: 'ngo/posts/new',
        element: (
          <RoleGate allow={['ngo_admin']}>
            <NewPost />
          </RoleGate>
        ),
      },

      { path: '*', element: notFoundElement },
    ],
  },
])

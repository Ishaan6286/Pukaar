import { createBrowserRouter } from 'react-router-dom'

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
        index: true,
        element: (
          <RoleGate allow={['citizen', 'ngo_admin']}>
            <Home />
          </RoleGate>
        ),
      },
      {
        path: 'report',
        element: (
          <RoleGate allow={['citizen', 'ngo_admin']}>
            <ReportFlow />
          </RoleGate>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGate allow={['citizen', 'ngo_admin']}>
            <MyReports />
          </RoleGate>
        ),
      },
      {
        path: 'reports/:reportId',
        element: (
          <RoleGate allow={['citizen', 'ngo_admin']}>
            <ReportStatus />
          </RoleGate>
        ),
      },
      {
        path: 'map',
        element: (
          <RoleGate allow={['citizen', 'ngo_admin']}>
            <HelpMap />
          </RoleGate>
        ),
      },
      {
        path: 'feed',
        element: (
          <RoleGate allow={['citizen', 'ngo_admin']}>
            <Feed />
          </RoleGate>
        ),
      },
      {
        path: 'profile',
        element: (
          <RoleGate allow={['citizen', 'ngo_admin']}>
            <Profile />
          </RoleGate>
        ),
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

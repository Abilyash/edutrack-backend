import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { UserProvider } from './context/UserContext'
import { ToastProvider } from './context/ToastContext'
import LoginPage from './pages/LoginPage'
import CoursesPage from './pages/CoursesPage'
import CoursePage from './pages/CoursePage'
import ProfilePage from './pages/ProfilePage'
import MySubmissionsPage from './pages/MySubmissionsPage'
import GradesJournalPage from './pages/GradesJournalPage'
import DashboardPage from './pages/DashboardPage'
import MyCoursesPage from './pages/MyCoursesPage'
import NotFoundPage from './pages/NotFoundPage'
import RoleRoute from './components/RoleRoute'
import Layout from './components/Layout'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/" element={session ? <UserProvider><Layout /></UserProvider> : <Navigate to="/login" />}>
            <Route index element={<CoursesPage />} />
            <Route path="dashboard" element={
              <RoleRoute allow={['TEACHER', 'ADMIN']}><DashboardPage /></RoleRoute>
            } />
            <Route path="courses/:id" element={<CoursePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="my-courses" element={
              <RoleRoute allow={['STUDENT']}><MyCoursesPage /></RoleRoute>
            } />
            <Route path="my-submissions" element={
              <RoleRoute allow={['STUDENT']}><MySubmissionsPage /></RoleRoute>
            } />
            <Route path="courses/:id/journal" element={
              <RoleRoute allow={['TEACHER', 'ADMIN']}><GradesJournalPage /></RoleRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

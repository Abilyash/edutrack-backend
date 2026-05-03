import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { UserProvider } from './context/UserContext'
import LoginPage from './pages/LoginPage'
import CoursesPage from './pages/CoursesPage'
import CoursePage from './pages/CoursePage'
import ProfilePage from './pages/ProfilePage'
import MySubmissionsPage from './pages/MySubmissionsPage'
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
      <div className="text-gray-500">Загрузка...</div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <UserProvider><Layout /></UserProvider> : <Navigate to="/login" />}>
          <Route index element={<CoursesPage />} />
          <Route path="courses/:id" element={<CoursePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="my-submissions" element={<MySubmissionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

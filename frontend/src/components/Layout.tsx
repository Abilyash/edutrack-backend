import { Outlet, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'

interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: string
}

export default function Layout() {
  const { user } = useUser()
  const isStudent = user?.role === 'STUDENT'
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN'
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const loadUnread = () => {
    api.get('/notifications/unread-count')
      .then(r => setUnread(r.data.count))
      .catch(() => {})
  }

  const openDropdown = async () => {
    if (!open) {
      const r = await api.get('/notifications')
      setNotifications(r.data)
      if (unread > 0) {
        await api.patch('/notifications/read-all')
        setUnread(0)
      }
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    loadUnread()
    const interval = setInterval(loadUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
      isActive
        ? 'text-indigo-600 bg-indigo-50'
        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-0 flex justify-between items-center sticky top-0 z-40 h-14 shadow-sm">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">EduTrack</span>
        </NavLink>

        <div className="flex items-center gap-1">
          {isTeacher && (
            <NavLink to="/dashboard" className={linkClass}>
              Дашборд
            </NavLink>
          )}
          {isStudent && (
            <NavLink to="/my-submissions" className={linkClass}>
              Мои сдачи
            </NavLink>
          )}
          <NavLink to="/profile" className={linkClass}>
            Профиль
          </NavLink>

          <div className="w-px h-5 bg-gray-200 mx-2" />

          {/* Bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={openDropdown}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                  <span className="text-sm font-semibold text-gray-900">Уведомления</span>
                  {notifications.length > 0 && (
                    <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-400">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    Уведомлений нет
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-xs font-semibold flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

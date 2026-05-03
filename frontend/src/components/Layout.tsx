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
    `text-sm transition-colors ${isActive
      ? 'text-indigo-600 font-medium'
      : 'text-gray-500 hover:text-gray-800'}`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-40">
        <NavLink to="/" className="text-xl font-bold text-indigo-600 tracking-tight">
          EduTrack
        </NavLink>

        <div className="flex items-center gap-5">
          {isStudent && (
            <NavLink to="/my-submissions" className={linkClass}>
              Мои сдачи
            </NavLink>
          )}
          <NavLink to="/profile" className={linkClass}>
            Профиль
          </NavLink>

          {/* Колокольчик уведомлений */}
          <div className="relative" ref={bellRef}>
            <button onClick={openDropdown} className="relative text-gray-500 hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Уведомления</span>
                  {notifications.length > 0 && (
                    <span className="text-xs text-gray-400">{notifications.length} шт.</span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    <div className="text-3xl mb-2">🔔</div>
                    Уведомлений нет
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <p className="text-sm text-gray-800">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(n.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center">
              {initials}
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
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

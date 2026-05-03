import { Outlet, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'

export default function Layout() {
  const { user } = useUser()
  const isStudent = user?.role === 'STUDENT'
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

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

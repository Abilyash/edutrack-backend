import { Outlet, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold text-indigo-600">EduTrack</Link>
        <div className="flex items-center gap-4">
          <Link to="/profile" className="text-sm text-gray-500 hover:text-gray-700">Профиль</Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Выйти
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

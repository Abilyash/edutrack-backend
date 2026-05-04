import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'
import Spinner from '../components/Spinner'

interface UserRow {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

const ROLES = ['STUDENT', 'TEACHER', 'ADMIN'] as const
type Role = typeof ROLES[number]

const roleStyle: Record<Role, string> = {
  ADMIN:   'bg-violet-100 text-violet-700 border-violet-200',
  TEACHER: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  STUDENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const roleLabel: Record<Role, string> = {
  ADMIN: 'Админ', TEACHER: 'Преподаватель', STUDENT: 'Студент',
}

export default function AdminPage() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [changing, setChanging] = useState<string | null>(null)

  const load = () => {
    api.get('/users')
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRoleChange = async (userId: string, role: string) => {
    setChanging(userId)
    try {
      await api.patch(`/users/${userId}/role`, { role })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      showToast('Роль обновлена')
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Ошибка при смене роли', 'error')
    } finally {
      setChanging(null)
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const byRole = (r: Role) => users.filter(u => u.role === r).length

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
          <p className="text-sm text-gray-400 mt-0.5">Просмотр и назначение ролей</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">всего</div>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">{byRole('STUDENT')}</div>
          <div className="text-xs text-gray-400 mt-0.5">студентов</div>
        </div>
        <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-indigo-600">{byRole('TEACHER')}</div>
          <div className="text-xs text-gray-400 mt-0.5">преподавателей</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-violet-600">{byRole('ADMIN')}</div>
          <div className="text-xs text-gray-400 mt-0.5">администраторов</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени или email..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Пользователи не найдены</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Пользователь</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Роль</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Зарегистрирован</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {u.name?.[0]?.toUpperCase() ?? u.email[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    {changing === u.id ? (
                      <span className="text-xs text-gray-400">Сохранение...</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${roleStyle[u.role as Role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{roleLabel[r]}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

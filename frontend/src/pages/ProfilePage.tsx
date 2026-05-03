import { useEffect, useState } from 'react'
import api from '../lib/api'
import Spinner from '../components/Spinner'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Студент',
  TEACHER: 'Преподаватель',
  ADMIN: 'Администратор',
}

const ROLE_STYLES: Record<string, string> = {
  STUDENT: 'bg-blue-50 text-blue-600 border-blue-200',
  TEACHER: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  ADMIN: 'bg-red-50 text-red-600 border-red-200',
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/users/me')
      .then(r => setUser(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) return
    setSaving(true)
    try {
      const r = await api.patch('/users/me', { name: nameInput.trim() })
      setUser(r.data)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (!user) return <p className="text-red-500">Ошибка загрузки профиля</p>

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <div className="max-w-lg">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
        <p className="text-sm text-gray-400 mt-0.5">Ваши личные данные</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Hero */}
        <div className="h-24 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + name */}
          <div className="flex items-end gap-4 -mt-8 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 border-4 border-white flex items-center justify-center text-2xl font-bold text-white shadow-md shrink-0">
              {initials}
            </div>
            <div className="pb-1">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${ROLE_STYLES[user.role] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>

          {/* Name editing */}
          {editing ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-2 mb-5">
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="border border-indigo-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-1"
                required
              />
              <button type="submit" disabled={saving}
                className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-medium">
                {saving ? '...' : 'Сохранить'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="text-sm text-gray-400 hover:text-gray-600 px-1">
                Отмена
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 mb-5 group">
              <h2 className="text-xl font-bold text-gray-900">{user.name || <span className="text-gray-300">Имя не указано</span>}</h2>
              <button
                onClick={() => { setNameInput(user.name || ''); setEditing(true) }}
                className="text-gray-300 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Изменить имя"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          {/* Details */}
          <div className="flex flex-col gap-0 border border-gray-100 rounded-xl overflow-hidden">
            <InfoRow
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />}
              label="Email"
              value={user.email}
            />
            <InfoRow
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
              label="Роль"
              value={ROLE_LABELS[user.role] ?? user.role}
            />
            <InfoRow
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
              label="Зарегистрирован"
              value={new Date(user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            />
            <InfoRow
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />}
              label="ID"
              value={user.id}
              mono
              last
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon, label, value, mono, last
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
  last?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors ${!last ? 'border-b border-gray-100' : ''}`}>
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <span className="text-sm text-gray-400 w-32 shrink-0">{label}</span>
      <span className={`text-sm text-gray-900 font-medium truncate ${mono ? 'font-mono text-xs text-gray-500' : ''}`}>
        {value}
      </span>
    </div>
  )
}

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

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-700',
  TEACHER: 'bg-green-100 text-green-700',
  ADMIN: 'bg-red-100 text-red-700',
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

  const initials = user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold mb-6">Профиль</h2>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-indigo-600 h-20" />
        <div className="px-6 pb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 border-4 border-white flex items-center justify-center -mt-8 text-2xl font-bold text-indigo-600">
            {initials}
          </div>
          <div className="mt-3">
            {editing ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-1"
                  required
                />
                <button type="submit" disabled={saving}
                  className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? '...' : 'Сохранить'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-500">Отмена</button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{user.name || '—'}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                <button onClick={() => { setNameInput(user.name || ''); setEditing(true) }}
                  className="text-gray-400 hover:text-indigo-500 text-sm" title="Изменить имя">✏</button>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 flex flex-col gap-3">
            <Row label="ID" value={user.id} mono />
            <Row label="Роль" value={ROLE_LABELS[user.role] ?? user.role} />
            <Row label="Дата регистрации" value={new Date(user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

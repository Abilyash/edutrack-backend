import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

interface CompletedCourse {
  id: string
  title: string
  avgScore: number
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
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([])

  useEffect(() => {
    api.get('/users/me')
      .then(r => setUser(r.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') return
    Promise.all([
      api.get('/enrollments/my'),
      api.get('/submissions/my'),
    ]).then(async ([enrollRes, subRes]) => {
      const courseIds: string[] = enrollRes.data
      const submissions: any[] = subRes.data
      const subsByTopic: Record<string, any[]> = {}
      for (const s of submissions) subsByTopic[s.topicId] = [...(subsByTopic[s.topicId] ?? []), s]
      const courseRes = await Promise.all(courseIds.map(cid => api.get(`/courses/${cid}`)))
      const completed: CompletedCourse[] = []
      for (const r of courseRes) {
        const course = r.data
        const topics = course.modules.flatMap((m: any) => m.topics)
        if (topics.length === 0) continue
        const scores: Record<string, number> = {}
        topics.forEach((t: any) => {
          const graded = (subsByTopic[t.id] ?? []).filter((s: any) => s.grade).map((s: any) => s.grade.score)
          if (graded.length > 0) scores[t.id] = Math.max(...graded)
        })
        if (Object.keys(scores).length === topics.length) {
          const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / topics.length)
          completed.push({ id: course.id, title: course.title, avgScore: avg })
        }
      }
      setCompletedCourses(completed)
    }).catch(() => {})
  }, [user])

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
    <div className="max-w-2xl">
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

      {/* Пройденные курсы — только для студентов */}
      {user.role === 'STUDENT' && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h2 className="text-base font-bold text-gray-900">Пройденные курсы</h2>
            {completedCourses.length > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">{completedCourses.length}</span>
            )}
          </div>

          {completedCourses.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">Курсы ещё не пройдены</p>
              <p className="text-xs text-gray-400 mt-1">Сдайте все темы курса, чтобы получить сертификат</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedCourses.map(c => {
                const color = c.avgScore >= 90 ? 'from-emerald-500 to-teal-500'
                  : c.avgScore >= 75 ? 'from-indigo-500 to-violet-500'
                  : c.avgScore >= 60 ? 'from-amber-500 to-orange-500'
                  : 'from-gray-400 to-gray-500'
                return (
                  <div key={c.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:border-indigo-100 transition-colors">
                    <div className={`h-1.5 bg-gradient-to-r ${color}`} />
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Средний балл: <span className="font-bold text-gray-700">{c.avgScore}/100</span></p>
                      </div>
                      <Link
                        to={`/courses/${c.id}/certificate`}
                        className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        Сертификат
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
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

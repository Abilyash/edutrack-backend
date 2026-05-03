import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useUser } from '../context/UserContext'
import Spinner from '../components/Spinner'

interface Course {
  id: string
  title: string
  description: string
  published: boolean
  modules: { id: string }[]
}

const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-pink-500',
  'from-pink-500 to-rose-500',
  'from-violet-500 to-purple-600',
]

export default function DashboardPage() {
  const { user } = useUser()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({})
  const [pending, setPending] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/submissions/pending-count').catch(() => ({ data: { count: 0 } })),
    ]).then(([coursesRes, pendingRes]) => {
      const list: Course[] = coursesRes.data
      setCourses(list)
      setPending(pendingRes.data.count)

      Promise.all(
        list.map(c =>
          api.get(`/enrollments/courses/${c.id}/count`)
            .then(r => ({ id: c.id, count: r.data.count }))
            .catch(() => ({ id: c.id, count: 0 }))
        )
      ).then(results => {
        const map: Record<string, number> = {}
        results.forEach(r => { map[r.id] = r.count })
        setEnrollCounts(map)
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const totalStudents = Object.values(enrollCounts).reduce((a, b) => a + b, 0)
  const firstName = user?.name?.split(' ')[0] || 'Преподаватель'

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Добро пожаловать, {firstName}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Обзор вашей учебной деятельности</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          }
          value={courses.length}
          label="Курсов"
          color="indigo"
        />
        <StatCard
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          }
          value={totalStudents}
          label="Студентов"
          color="emerald"
        />
        <StatCard
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          }
          value={pending ?? '—'}
          label="Ожидают проверки"
          color={pending && pending > 0 ? 'amber' : 'gray'}
        />
      </div>

      {/* Courses section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-gray-900">Мои курсы</h2>
        <Link to="/" className="text-sm text-indigo-600 hover:underline font-medium">
          Все курсы →
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">Нет курсов</p>
          <Link to="/" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
            Создать первый курс
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((c, i) => {
            const grad = GRADIENTS[i % GRADIENTS.length]
            const enrolled = enrollCounts[c.id] ?? '...'
            return (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-1 bg-gradient-to-r ${grad}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {c.title[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                        {!c.published && (
                          <span className="shrink-0 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            Черновик
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{enrolled} студентов</span>
                        {c.modules.length > 0 && <span>{c.modules.length} модулей</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/courses/${c.id}`}
                      className="flex-1 text-center text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
                    >
                      Открыть
                    </Link>
                    <Link
                      to={`/courses/${c.id}/journal`}
                      className="flex-1 text-center text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors"
                    >
                      Журнал
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon, value, label, color,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
  color: 'indigo' | 'emerald' | 'amber' | 'gray'
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-100 text-gray-400',
  }
  const textColors = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    gray: 'text-gray-400',
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div className={`text-3xl font-bold ${textColors[color]}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5 font-medium">{label}</div>
    </div>
  )
}

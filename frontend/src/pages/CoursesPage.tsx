import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import CreateCourseModal from '../components/CreateCourseModal'
import Spinner from '../components/Spinner'
import { useUser } from '../context/UserContext'

interface Course {
  id: string
  title: string
  description: string
  teacherId: string
  published: boolean
  createdAt: string
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

type Tab = 'all' | 'my'

function pluralModules(n: number) {
  if (n === 1) return '1 модуль'
  if (n >= 2 && n <= 4) return `${n} модуля`
  return `${n} модулей`
}

export default function CoursesPage() {
  const { isTeacher, user } = useUser()
  const isStudent = user?.role === 'STUDENT'

  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [loadingEnroll, setLoadingEnroll] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  const loadCourses = () => {
    setLoading(true)
    api.get('/courses')
      .then(r => setCourses(r.data))
      .finally(() => setLoading(false))
  }

  const loadEnrollments = () => {
    if (!isStudent) return
    api.get('/enrollments/my').then(r => setEnrolledIds(new Set(r.data)))
  }

  useEffect(() => { loadCourses() }, [])
  useEffect(() => { loadEnrollments() }, [isStudent])

  const handleEnroll = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault()
    setLoadingEnroll(courseId)
    try {
      if (enrolledIds.has(courseId)) {
        await api.delete(`/enrollments/courses/${courseId}`)
        setEnrolledIds(prev => { const s = new Set(prev); s.delete(courseId); return s })
      } else {
        await api.post(`/enrollments/courses/${courseId}`)
        setEnrolledIds(prev => new Set(prev).add(courseId))
      }
    } finally {
      setLoadingEnroll(null)
    }
  }

  const q = search.trim().toLowerCase()
  const displayed = (tab === 'my' ? courses.filter(c => enrolledIds.has(c.id)) : courses)
    .filter(c => !q || c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))

  if (loading) return <Spinner />

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isTeacher ? 'Мои курсы' : 'Курсы'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isTeacher ? 'Управляйте учебными материалами' : 'Все доступные курсы платформы'}
          </p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Создать курс
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию или описанию..."
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-gray-500 text-xl"
          >×</button>
        )}
      </div>

      {/* Tabs (student only) */}
      {isStudent && (
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
          {(['all', 'my'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm px-4 py-1.5 rounded-lg transition-all font-medium ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'all' ? 'Все курсы' : 'Мои курсы'}
              {t === 'my' && enrolledIds.size > 0 && (
                <span className="ml-1.5 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {enrolledIds.size}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {displayed.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {q
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              }
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">
            {q ? `Ничего не найдено` : tab === 'my' ? 'Вы не записались ни на один курс' : 'Курсов пока нет'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {q ? `По запросу «${search}»` : tab === 'my' ? 'Запишитесь на курс из списка' : 'Создайте первый курс'}
          </p>
          {q && (
            <button onClick={() => setSearch('')} className="mt-4 text-sm text-indigo-600 hover:underline font-medium">
              Сбросить поиск
            </button>
          )}
          {!q && tab === 'my' && (
            <button onClick={() => setTab('all')} className="mt-4 text-sm text-indigo-600 hover:underline font-medium">
              Посмотреть все курсы →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayed.map((c, i) => {
            const enrolled = enrolledIds.has(c.id)
            const grad = GRADIENTS[i % GRADIENTS.length]
            return (
              <Link key={c.id} to={`/courses/${c.id}`} className="group block">
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 h-full flex flex-col">
                  {/* Colored top strip */}
                  <div className={`h-1.5 bg-gradient-to-r ${grad}`} />

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm`}>
                        {c.title[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                            {c.title}
                          </h3>
                          {!c.published && isTeacher && (
                            <span className="shrink-0 bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                              Черновик
                            </span>
                          )}
                          {enrolled && (
                            <span className="shrink-0 bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full border border-indigo-200 font-medium">
                              Записан
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {c.description || 'Нет описания'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {c.modules?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            {pluralModules(c.modules.length)}
                          </span>
                        )}
                        <span>{new Date(c.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                      </div>

                      {isStudent ? (
                        <button
                          onClick={e => handleEnroll(e, c.id)}
                          disabled={loadingEnroll === c.id}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all disabled:opacity-50 ${
                            enrolled
                              ? 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                              : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 bg-indigo-50/50'
                          }`}
                        >
                          {loadingEnroll === c.id ? '...' : enrolled ? 'Отписаться' : 'Записаться'}
                        </button>
                      ) : (
                        <span className="text-xs text-indigo-400 font-medium group-hover:text-indigo-600 flex items-center gap-1 transition-colors">
                          Открыть
                          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <CreateCourseModal
          onClose={() => setShowModal(false)}
          onCreated={loadCourses}
        />
      )}
    </div>
  )
}

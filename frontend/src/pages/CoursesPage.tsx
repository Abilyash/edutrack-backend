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
}

const PALETTE = [
  'bg-indigo-500', 'bg-violet-500', 'bg-blue-500',
  'bg-emerald-500', 'bg-orange-500', 'bg-pink-500',
]

type Tab = 'all' | 'my'

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Курсы</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isTeacher ? 'Управляйте своими курсами' : 'Ваши учебные материалы'}
          </p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Создать курс
          </button>
        )}
      </div>

      <div className="relative mb-5">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию или описанию..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 text-lg"
          >
            ×
          </button>
        )}
      </div>

      {isStudent && (
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setTab('all')}
            className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
              tab === 'all' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Все курсы
          </button>
          <button
            onClick={() => setTab('my')}
            className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
              tab === 'my' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Мои курсы
            {enrolledIds.size > 0 && (
              <span className="ml-1.5 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {enrolledIds.size}
              </span>
            )}
          </button>
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">{q ? '🔎' : tab === 'my' ? '🎓' : '📚'}</div>
          <p className="text-gray-500 font-medium">
            {q
              ? `Ничего не найдено по запросу «${search}»`
              : tab === 'my' ? 'Вы ещё не записались ни на один курс' : 'Курсов пока нет'}
          </p>
          {q && (
            <button onClick={() => setSearch('')} className="mt-3 text-sm text-indigo-600 hover:underline">
              Сбросить поиск
            </button>
          )}
          {!q && tab === 'my' && (
            <button onClick={() => setTab('all')} className="mt-3 text-sm text-indigo-600 hover:underline">
              Посмотреть все курсы →
            </button>
          )}
          {!q && tab === 'all' && isTeacher && (
            <p className="text-gray-400 text-sm mt-1">Создайте первый курс, нажав кнопку выше</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayed.map((c, i) => {
            const enrolled = enrolledIds.has(c.id)
            return (
              <Link key={c.id} to={`/courses/${c.id}`} className="group">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all h-full">
                  <div className={`${PALETTE[i % PALETTE.length]} h-2`} />
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`${PALETTE[i % PALETTE.length]} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                        {c.title[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                            {c.title}
                          </h3>
                          {!c.published && isTeacher && (
                            <span className="shrink-0 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded font-medium">
                              Черновик
                            </span>
                          )}
                          {enrolled && (
                            <span className="shrink-0 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded font-medium">
                              Записан
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {c.description || 'Нет описания'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {isStudent ? (
                        <button
                          onClick={e => handleEnroll(e, c.id)}
                          disabled={loadingEnroll === c.id}
                          className={`text-xs px-3 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
                            enrolled
                              ? 'border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500'
                              : 'border-indigo-500 text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          {loadingEnroll === c.id ? '...' : enrolled ? 'Отписаться' : 'Записаться'}
                        </button>
                      ) : (
                        <span className="text-xs text-indigo-500 font-medium group-hover:translate-x-0.5 transition-transform">
                          Открыть →
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

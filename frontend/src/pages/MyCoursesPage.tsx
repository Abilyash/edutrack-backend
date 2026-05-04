import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'

interface Topic {
  id: string
}

interface Module {
  id: string
  topics: Topic[]
}

interface Course {
  id: string
  title: string
  description: string
  modules: Module[]
}

interface SubmissionDto {
  id: string
  topicId: string
}

const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-pink-500',
  'from-pink-500 to-rose-500',
  'from-violet-500 to-purple-600',
]

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/enrollments/my'),
      api.get('/submissions/my').catch(() => ({ data: [] })),
    ]).then(async ([enrollRes, subsRes]) => {
      const courseIds: string[] = enrollRes.data
      setSubmissions(subsRes.data)

      const courseList = await Promise.all(
        courseIds.map((id: string) =>
          api.get(`/courses/${id}`).then(r => r.data as Course).catch(() => null)
        )
      )
      setCourses(courseList.filter(Boolean) as Course[])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const submittedTopicIds = new Set(submissions.map(s => s.topicId))

  const totalTopics = courses.reduce(
    (sum, c) => sum + c.modules.reduce((s, m) => s + m.topics.length, 0), 0
  )
  const totalSubmitted = courses.reduce(
    (sum, c) => sum + c.modules.reduce(
      (s, m) => s + m.topics.filter(t => submittedTopicIds.has(t.id)).length, 0
    ), 0
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Мои курсы</h1>
        <p className="text-sm text-gray-400 mt-0.5">Курсы, на которые вы записаны</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-indigo-600">{courses.length}</div>
          <div className="text-xs text-gray-400 mt-0.5 font-medium">записан на курсов</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{totalSubmitted}</div>
          <div className="text-xs text-gray-400 mt-0.5 font-medium">тем сдано</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-amber-500">{totalTopics - totalSubmitted}</div>
          <div className="text-xs text-gray-400 mt-0.5 font-medium">тем осталось</div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">Вы пока не записаны ни на один курс</p>
          <Link to="/" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
            Перейти к каталогу курсов →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((c, i) => {
            const grad = GRADIENTS[i % GRADIENTS.length]
            const topicIds = c.modules.flatMap(m => m.topics.map(t => t.id))
            const submitted = topicIds.filter(tid => submittedTopicIds.has(tid)).length
            const total = topicIds.length
            const pct = total > 0 ? Math.round((submitted / total) * 100) : 0

            return (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-1 bg-gradient-to-r ${grad}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {c.title[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{c.description}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-400">Прогресс</span>
                      <span className="text-xs font-semibold text-gray-600">{submitted} / {total} тем</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${grad} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                  </div>

                  <Link
                    to={`/courses/${c.id}`}
                    className={`block text-center text-xs font-medium text-white bg-gradient-to-r ${grad} hover:opacity-90 px-3 py-2 rounded-lg transition-opacity`}
                  >
                    Перейти к курсу
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

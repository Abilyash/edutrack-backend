import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'

interface Topic {
  id: string
  title: string
  content: string
  orderIndex: number
}

interface Module {
  id: string
  title: string
  orderIndex: number
  topics: Topic[]
}

interface Course {
  id: string
  title: string
  description: string
  teacherId: string
  published: boolean
  createdAt: string
  modules: Module[]
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.get(`/courses/${id}`)
      .then(r => setCourse(r.data))
      .finally(() => setLoading(false))
  }, [id])

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev)
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId)
      return next
    })
  }

  if (loading) return <p className="text-gray-500">Загрузка...</p>
  if (!course) return <p className="text-red-500">Курс не найден</p>

  return (
    <div>
      <Link to="/" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
        ← Все курсы
      </Link>

      <h2 className="text-2xl font-semibold text-gray-900 mt-2">{course.title}</h2>
      <p className="text-gray-500 mt-1 mb-6">{course.description}</p>

      {course.modules.length === 0 ? (
        <p className="text-gray-400">Модулей пока нет.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {course.modules.map(m => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleModule(m.id)}
                className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{m.title}</span>
                <span className="text-gray-400 text-sm">
                  {openModules.has(m.id) ? '▲' : '▼'}
                </span>
              </button>

              {openModules.has(m.id) && (
                <div className="border-t border-gray-100">
                  {m.topics.length === 0 ? (
                    <p className="text-gray-400 text-sm px-5 py-3">Тем нет</p>
                  ) : (
                    m.topics.map(t => (
                      <div key={t.id} className="px-5 py-3 border-b border-gray-50 last:border-0">
                        <p className="text-sm font-medium text-gray-800">{t.title}</p>
                        {t.content && (
                          <p className="text-sm text-gray-500 mt-1">{t.content}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

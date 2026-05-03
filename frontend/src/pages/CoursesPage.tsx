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

export default function CoursesPage() {
  const { isTeacher, user } = useUser()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const loadCourses = () => {
    setLoading(true)
    api.get('/courses')
      .then(r => setCourses(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCourses() }, [])

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Курсы</h2>
          {user && (
            <p className="text-sm text-gray-400 mt-0.5">
              {isTeacher ? 'Управляйте своими курсами' : 'Ваши учебные материалы'}
            </p>
          )}
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

      {courses.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-gray-500 font-medium">Курсов пока нет</p>
          {isTeacher && (
            <p className="text-gray-400 text-sm mt-1">
              Создайте первый курс, нажав кнопку выше
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((c, i) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="group">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all h-full">
                <div className={`${PALETTE[i % PALETTE.length]} h-2`} />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`${PALETTE[i % PALETTE.length]} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                      {c.title[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                        {c.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {c.description || 'Нет описания'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-indigo-500 font-medium group-hover:translate-x-0.5 transition-transform">
                      Открыть →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
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

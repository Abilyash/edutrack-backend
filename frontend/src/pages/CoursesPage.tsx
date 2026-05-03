import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import CreateCourseModal from '../components/CreateCourseModal'
import { useUser } from '../context/UserContext'

interface Course {
  id: string
  title: string
  description: string
  teacherId: string
  published: boolean
  createdAt: string
}

export default function CoursesPage() {
  const { isTeacher } = useUser()
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

  if (loading) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Курсы</h2>
        {isTeacher && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + Создать курс
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <p className="text-gray-400">Курсов пока нет.</p>
      ) : (
        <div className="grid gap-4">
          {courses.map(c => (
            <Link key={c.id} to={`/courses/${c.id}`}>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                <h3 className="font-medium text-gray-900">{c.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{c.description}</p>
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

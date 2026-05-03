import { useEffect, useState } from 'react'
import api from '../lib/api'

interface Course {
  id: string
  title: string
  description: string
  teacherId: string
  published: boolean
  createdAt: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/courses')
      .then(r => setCourses(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Курсы</h2>
      {courses.length === 0 ? (
        <p className="text-gray-400">Курсов пока нет.</p>
      ) : (
        <div className="grid gap-4">
          {courses.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-medium text-gray-900">{c.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{c.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

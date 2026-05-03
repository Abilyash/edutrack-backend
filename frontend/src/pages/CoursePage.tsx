import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { useUser } from '../context/UserContext'
import UploadMaterialModal from '../components/UploadMaterialModal'

interface Material {
  id: string
  fileName: string
  publicUrl: string
  type: string
  sizeBytes: number
}

interface Topic {
  id: string
  title: string
  content: string
  orderIndex: number
  materials: Material[]
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
  const { isTeacher } = useUser()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())

  // Форма нового модуля
  const [addingModule, setAddingModule] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleLoading, setModuleLoading] = useState(false)

  // Загрузка материала
  const [uploadingFor, setUploadingFor] = useState<Topic | null>(null)

  // Форма новой темы
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null)
  const [topicTitle, setTopicTitle] = useState('')
  const [topicContent, setTopicContent] = useState('')
  const [topicLoading, setTopicLoading] = useState(false)

  const loadCourse = () => {
    api.get(`/courses/${id}`)
      .then(r => setCourse(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCourse() }, [id])

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev)
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId)
      return next
    })
  }

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setModuleLoading(true)
    try {
      await api.post(`/courses/${id}/modules`, { title: moduleTitle })
      setModuleTitle('')
      setAddingModule(false)
      loadCourse()
    } finally {
      setModuleLoading(false)
    }
  }

  const handleAddTopic = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault()
    setTopicLoading(true)
    try {
      await api.post(`/courses/modules/${moduleId}/topics`, {
        title: topicTitle,
        content: topicContent,
      })
      setTopicTitle('')
      setTopicContent('')
      setAddingTopicFor(null)
      loadCourse()
    } finally {
      setTopicLoading(false)
    }
  }

  if (loading) return <p className="text-gray-500">Загрузка...</p>
  if (!course) return <p className="text-red-500">Курс не найден</p>

  return (
    <div>
      <Link to="/" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
        ← Все курсы
      </Link>

      <div className="flex justify-between items-start mt-2 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{course.title}</h2>
          <p className="text-gray-500 mt-1">{course.description}</p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setAddingModule(true)}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 shrink-0 ml-4"
          >
            + Модуль
          </button>
        )}
      </div>

      {/* Форма добавления модуля */}
      {addingModule && (
        <form onSubmit={handleAddModule} className="bg-white border border-indigo-200 rounded-xl p-4 mb-4 flex gap-3">
          <input
            autoFocus
            type="text"
            value={moduleTitle}
            onChange={e => setModuleTitle(e.target.value)}
            placeholder="Название модуля"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={moduleLoading}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {moduleLoading ? '...' : 'Добавить'}
          </button>
          <button
            type="button"
            onClick={() => setAddingModule(false)}
            className="text-sm text-gray-500 px-3"
          >
            Отмена
          </button>
        </form>
      )}

      {course.modules.length === 0 ? (
        <p className="text-gray-400">Модулей пока нет.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {course.modules.map(m => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Заголовок модуля */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleModule(m.id)}
                  className="flex-1 flex justify-between items-center px-5 py-4 text-left hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{m.title}</span>
                  <span className="text-gray-400 text-sm">{openModules.has(m.id) ? '▲' : '▼'}</span>
                </button>
                {isTeacher && (
                  <button
                    onClick={() => {
                      setAddingTopicFor(m.id)
                      setOpenModules(prev => new Set(prev).add(m.id))
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 px-4 py-4"
                  >
                    + Тема
                  </button>
                )}
              </div>

              {/* Темы модуля */}
              {openModules.has(m.id) && (
                <div className="border-t border-gray-100">
                  {m.topics.map(t => (
                    <div key={t.id} className="px-5 py-3 border-b border-gray-50 last:border-0 flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{t.title}</p>
                        {t.content && <p className="text-sm text-gray-500 mt-1">{t.content}</p>}
                        {t.materials?.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1">
                            {t.materials.map(mat => (
                              <a
                                key={mat.id}
                                href={mat.publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
                              >
                                📎 {mat.fileName}
                                <span className="text-gray-400">({(mat.sizeBytes / 1024).toFixed(1)} KB)</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {isTeacher && (
                        <button
                          onClick={() => setUploadingFor(t)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 ml-4 shrink-0"
                        >
                          ↑ Файл
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Форма добавления темы */}
                  {addingTopicFor === m.id ? (
                    <form
                      onSubmit={e => handleAddTopic(e, m.id)}
                      className="px-5 py-4 bg-gray-50 flex flex-col gap-2"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={topicTitle}
                        onChange={e => setTopicTitle(e.target.value)}
                        placeholder="Название темы"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <textarea
                        value={topicContent}
                        onChange={e => setTopicContent(e.target.value)}
                        placeholder="Описание (необязательно)"
                        rows={2}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={topicLoading}
                          className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {topicLoading ? '...' : 'Добавить'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingTopicFor(null)}
                          className="text-sm text-gray-500"
                        >
                          Отмена
                        </button>
                      </div>
                    </form>
                  ) : (
                    m.topics.length === 0 && (
                      <p className="text-gray-400 text-sm px-5 py-3">Тем нет</p>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {uploadingFor && (
        <UploadMaterialModal
          topicId={uploadingFor.id}
          topicTitle={uploadingFor.title}
          onClose={() => setUploadingFor(null)}
          onUploaded={loadCourse}
        />
      )}
    </div>
  )
}

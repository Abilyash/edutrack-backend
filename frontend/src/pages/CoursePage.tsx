import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useUser } from '../context/UserContext'
import UploadMaterialModal from '../components/UploadMaterialModal'
import SubmitWorkModal from '../components/SubmitWorkModal'
import SubmissionsModal from '../components/SubmissionsModal'
import Spinner from '../components/Spinner'

interface Material {
  id: string
  fileName: string
  publicUrl: string
  type: string
  sizeBytes: number
}

interface GradeDto {
  score: number
  comment: string | null
}

interface SubmissionDto {
  id: string
  topicId: string
  fileName: string
  publicUrl: string
  status: string
  grade: GradeDto | null
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
  const navigate = useNavigate()
  const { isTeacher, user } = useUser()
  const isStudent = user?.role === 'STUDENT'
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishLoading, setPublishLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null)
  const isOwner = isTeacher && course?.teacherId === user?.id
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())

  // Форма нового модуля
  const [addingModule, setAddingModule] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleLoading, setModuleLoading] = useState(false)

  // Загрузка материала
  const [uploadingFor, setUploadingFor] = useState<Topic | null>(null)

  // Сдача работы (студент) / просмотр сдач (учитель)
  const [submittingFor, setSubmittingFor] = useState<Topic | null>(null)
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState<Topic | null>(null)
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, SubmissionDto>>({})

  // Форма новой темы
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null)
  const [topicTitle, setTopicTitle] = useState('')
  const [topicContent, setTopicContent] = useState('')
  const [topicLoading, setTopicLoading] = useState(false)

  // Инлайн-редактирование
  const [editingCourse, setEditingCourse] = useState(false)
  const [editCourseTitle, setEditCourseTitle] = useState('')
  const [editCourseDesc, setEditCourseDesc] = useState('')
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editModuleTitle, setEditModuleTitle] = useState('')
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editTopicTitle, setEditTopicTitle] = useState('')
  const [editTopicContent, setEditTopicContent] = useState('')

  const loadCourse = () => {
    api.get(`/courses/${id}`)
      .then(r => setCourse(r.data))
      .finally(() => setLoading(false))
  }

  const handleTogglePublish = async () => {
    if (!course) return
    setPublishLoading(true)
    try {
      const endpoint = course.published ? `/courses/${id}/unpublish` : `/courses/${id}/publish`
      const r = await api.patch(endpoint)
      setCourse(prev => prev ? { ...prev, published: r.data.published } : prev)
    } finally {
      setPublishLoading(false)
    }
  }

  const handleDeleteCourse = async () => {
    if (!window.confirm(`Удалить курс «${course?.title}»? Это действие необратимо.`)) return
    setDeleteLoading(true)
    try {
      await api.delete(`/courses/${id}`)
      navigate('/')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteMaterial = async (topicId: string, materialId: string, fileName: string) => {
    if (!window.confirm(`Удалить файл «${fileName}»?`)) return
    try {
      await api.delete(`/courses/topics/${topicId}/materials/${materialId}`)
      setCourse(prev => {
        if (!prev) return prev
        return {
          ...prev,
          modules: prev.modules.map(m => ({
            ...m,
            topics: m.topics.map(t =>
              t.id === topicId
                ? { ...t, materials: t.materials.filter(mat => mat.id !== materialId) }
                : t
            )
          }))
        }
      })
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Неизвестная ошибка'
      alert(`Ошибка при удалении: ${detail}`)
    }
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.patch(`/courses/${id}`, { title: editCourseTitle, description: editCourseDesc })
    setEditingCourse(false)
    loadCourse()
  }

  const handleSaveModule = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault()
    await api.patch(`/courses/modules/${moduleId}`, { title: editModuleTitle })
    setEditingModuleId(null)
    loadCourse()
  }

  const handleSaveTopic = async (e: React.FormEvent, topicId: string) => {
    e.preventDefault()
    await api.patch(`/courses/topics/${topicId}`, { title: editTopicTitle, content: editTopicContent })
    setEditingTopicId(null)
    loadCourse()
  }

  const loadSubmissions = () => {
    if (!isStudent) return
    api.get('/submissions/my').then(r => {
      const map: Record<string, SubmissionDto> = {}
      for (const s of r.data as SubmissionDto[]) map[s.topicId] = s
      setSubmissionsMap(map)
    })
  }

  useEffect(() => { loadCourse() }, [id])
  useEffect(() => { loadSubmissions() }, [isStudent])
  useEffect(() => {
    if (isTeacher && id) {
      api.get(`/enrollments/courses/${id}/count`)
        .then(r => setEnrolledCount(r.data.count))
        .catch(() => {})
    }
  }, [isTeacher, id])

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

  if (loading) return <Spinner />
  if (!course) return <p className="text-red-500">Курс не найден</p>

  return (
    <div>
      <Link to="/" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
        ← Все курсы
      </Link>

      <div className="flex justify-between items-start mt-2 mb-6">
        <div className="flex-1 min-w-0 mr-4">
          {editingCourse ? (
            <form onSubmit={handleSaveCourse} className="flex flex-col gap-2 max-w-lg">
              <input
                autoFocus
                value={editCourseTitle}
                onChange={e => setEditCourseTitle(e.target.value)}
                className="border border-indigo-300 rounded-lg px-3 py-1.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              <textarea
                value={editCourseDesc}
                onChange={e => setEditCourseDesc(e.target.value)}
                rows={2}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-indigo-700">Сохранить</button>
                <button type="button" onClick={() => setEditingCourse(false)} className="text-sm text-gray-500">Отмена</button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-gray-900">{course.title}</h2>
                {course.published
                  ? <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Опубликован</span>
                  : <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">Черновик</span>
                }
                {isOwner && (
                  <button
                    onClick={() => { setEditCourseTitle(course.title); setEditCourseDesc(course.description || ''); setEditingCourse(true) }}
                    className="text-gray-400 hover:text-indigo-500 text-sm"
                    title="Редактировать"
                  >✏</button>
                )}
              </div>
              <p className="text-gray-500 mt-1">{course.description}</p>
              {isTeacher && enrolledCount !== null && (
                <p className="text-xs text-gray-400 mt-1.5">
                  👥 {enrolledCount} {enrolledCount === 1 ? 'студент записан' : enrolledCount < 5 ? 'студента записано' : 'студентов записано'}
                </p>
              )}
            </div>
          )}
        </div>
        {isTeacher && (
          <div className="flex gap-2 shrink-0 ml-4">
            {isOwner && (
              <>
                <button
                  onClick={handleTogglePublish}
                  disabled={publishLoading}
                  className={`text-sm px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                    course.published
                      ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {publishLoading ? '...' : course.published ? 'Снять' : 'Опубликовать'}
                </button>
                <button
                  onClick={handleDeleteCourse}
                  disabled={deleteLoading}
                  className="text-sm px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleteLoading ? '...' : 'Удалить курс'}
                </button>
              </>
            )}
            <button
              onClick={() => navigate(`/courses/${id}/journal`)}
              className="border border-indigo-600 text-indigo-600 text-sm px-4 py-2 rounded-lg hover:bg-indigo-50"
            >
              Журнал
            </button>
            <button
              onClick={() => setAddingModule(true)}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              + Модуль
            </button>
          </div>
        )}
      </div>

      {/* Прогресс студента */}
      {isStudent && (() => {
        const allTopics = course.modules.flatMap(m => m.topics)
        const submitted = allTopics.filter(t => submissionsMap[t.id]).length
        if (allTopics.length === 0) return null
        const pct = Math.round((submitted / allTopics.length) * 100)
        return (
          <div className="mb-5 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 font-medium">Прогресс</span>
              <span className="text-sm font-semibold text-indigo-600">{submitted} / {allTopics.length} тем сдано</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })()}

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
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📂</div>
          <p className="text-gray-500 font-medium">Модулей пока нет</p>
          {isTeacher && <p className="text-gray-400 text-sm mt-1">Нажмите «+ Модуль» чтобы добавить первый</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {course.modules.map(m => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Заголовок модуля */}
              <div className="flex items-center">
                {editingModuleId === m.id ? (
                  <form onSubmit={e => handleSaveModule(e, m.id)} className="flex-1 flex items-center gap-2 px-5 py-3">
                    <input
                      autoFocus
                      value={editModuleTitle}
                      onChange={e => setEditModuleTitle(e.target.value)}
                      className="flex-1 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      required
                    />
                    <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700">✓</button>
                    <button type="button" onClick={() => setEditingModuleId(null)} className="text-xs text-gray-500">✕</button>
                  </form>
                ) : (
                  <button
                    onClick={() => toggleModule(m.id)}
                    className="flex-1 flex justify-between items-center px-5 py-4 text-left hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900 flex items-center gap-2">
                      {m.title}
                      {isOwner && (
                        <span
                          onClick={e => { e.stopPropagation(); setEditModuleTitle(m.title); setEditingModuleId(m.id) }}
                          className="text-gray-300 hover:text-indigo-500 text-xs cursor-pointer"
                        >✏</span>
                      )}
                    </span>
                    <span className="text-gray-400 text-sm">{openModules.has(m.id) ? '▲' : '▼'}</span>
                  </button>
                )}
                {isTeacher && editingModuleId !== m.id && (
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
                        {editingTopicId === t.id ? (
                          <form onSubmit={e => handleSaveTopic(e, t.id)} className="flex flex-col gap-2 max-w-lg">
                            <input
                              autoFocus
                              value={editTopicTitle}
                              onChange={e => setEditTopicTitle(e.target.value)}
                              className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              required
                            />
                            <textarea
                              value={editTopicContent}
                              onChange={e => setEditTopicContent(e.target.value)}
                              rows={2}
                              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <div className="flex gap-2">
                              <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-indigo-700">Сохранить</button>
                              <button type="button" onClick={() => setEditingTopicId(null)} className="text-xs text-gray-500">Отмена</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                              {t.title}
                              {isOwner && (
                                <span
                                  onClick={() => { setEditTopicTitle(t.title); setEditTopicContent(t.content || ''); setEditingTopicId(t.id) }}
                                  className="text-gray-300 hover:text-indigo-500 text-xs cursor-pointer"
                                >✏</span>
                              )}
                            </p>
                            {t.content && <p className="text-sm text-gray-500 mt-1">{t.content}</p>}
                          </>
                        )}
                        {t.materials?.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1">
                            {t.materials.map(mat => (
                              <div key={mat.id} className="inline-flex items-center gap-1.5">
                                <a
                                  href={mat.publicUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-indigo-600 hover:underline"
                                >
                                  📎 {mat.fileName}
                                  <span className="text-gray-400 ml-1">({(mat.sizeBytes / 1024).toFixed(1)} KB)</span>
                                </a>
                                {isOwner && (
                                  <button
                                    onClick={() => handleDeleteMaterial(t.id, mat.id, mat.fileName)}
                                    className="text-gray-300 hover:text-red-500 text-xs leading-none"
                                    title="Удалить файл"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3 ml-4 shrink-0">
                        {isTeacher && (
                          <>
                            <button
                              onClick={() => setUploadingFor(t)}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              ↑ Файл
                            </button>
                            <button
                              onClick={() => setViewingSubmissionsFor(t)}
                              className="text-xs text-purple-600 hover:text-purple-800"
                            >
                              Сдачи
                            </button>
                          </>
                        )}
                        {isStudent && (() => {
                          const sub = submissionsMap[t.id]
                          if (!sub) return (
                            <button
                              onClick={() => setSubmittingFor(t)}
                              className="text-xs text-green-600 hover:text-green-800"
                            >
                              Сдать работу
                            </button>
                          )
                          if (sub.grade) return (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {sub.grade.score}/100
                              </span>
                              <a href={sub.publicUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:underline">
                                {sub.fileName}
                              </a>
                            </div>
                          )
                          return (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                Сдано ✓
                              </span>
                              <a href={sub.publicUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:underline">
                                {sub.fileName}
                              </a>
                            </div>
                          )
                        })()}
                      </div>
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
      {submittingFor && (
        <SubmitWorkModal
          topicId={submittingFor.id}
          topicTitle={submittingFor.title}
          onClose={() => setSubmittingFor(null)}
          onSubmitted={loadSubmissions}
        />
      )}
      {viewingSubmissionsFor && (
        <SubmissionsModal
          topicId={viewingSubmissionsFor.id}
          topicTitle={viewingSubmissionsFor.title}
          onClose={() => setViewingSubmissionsFor(null)}
        />
      )}
    </div>
  )
}

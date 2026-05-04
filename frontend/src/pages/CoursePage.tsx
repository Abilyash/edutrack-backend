import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
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
  deadline: string | null
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

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null
  const d = new Date(deadline)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  if (diffMs < 0) return (
    <span className="text-xs bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full font-medium">
      Просрочено · {label}
    </span>
  )
  if (diffDays <= 3) return (
    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
      {diffDays === 0 ? 'Сегодня' : `${diffDays} дн.`} · {label}
    </span>
  )
  return (
    <span className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
      до {label}
    </span>
  )
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isTeacher, user } = useUser()
  const { showToast } = useToast()
  const isStudent = user?.role === 'STUDENT'
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishLoading, setPublishLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null)
  const isOwner = isTeacher && course?.teacherId === user?.id
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())

  const [addingModule, setAddingModule] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleLoading, setModuleLoading] = useState(false)

  const [uploadingFor, setUploadingFor] = useState<Topic | null>(null)
  const [submittingFor, setSubmittingFor] = useState<Topic | null>(null)
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState<Topic | null>(null)
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, SubmissionDto[]>>({})

  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null)
  const [topicTitle, setTopicTitle] = useState('')
  const [topicContent, setTopicContent] = useState('')
  const [topicDeadline, setTopicDeadline] = useState('')
  const [topicLoading, setTopicLoading] = useState(false)

  const [editingCourse, setEditingCourse] = useState(false)
  const [editCourseTitle, setEditCourseTitle] = useState('')
  const [editCourseDesc, setEditCourseDesc] = useState('')
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editModuleTitle, setEditModuleTitle] = useState('')
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editTopicTitle, setEditTopicTitle] = useState('')
  const [editTopicContent, setEditTopicContent] = useState('')
  const [editTopicDeadline, setEditTopicDeadline] = useState('')

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
      showToast(`Ошибка: ${err.response?.data?.detail || err.message}`, 'error')
    }
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.patch(`/courses/${id}`, { title: editCourseTitle, description: editCourseDesc })
    setEditingCourse(false)
    showToast('Курс обновлён')
    loadCourse()
  }

  const handleSaveModule = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault()
    await api.patch(`/courses/modules/${moduleId}`, { title: editModuleTitle })
    setEditingModuleId(null)
    showToast('Модуль обновлён')
    loadCourse()
  }

  const handleSaveTopic = async (e: React.FormEvent, topicId: string) => {
    e.preventDefault()
    const deadline = editTopicDeadline ? new Date(editTopicDeadline).toISOString() : null
    await api.patch(`/courses/topics/${topicId}`, { title: editTopicTitle, content: editTopicContent, deadline })
    setEditingTopicId(null)
    showToast('Тема обновлена')
    loadCourse()
  }

  const loadSubmissions = () => {
    if (!isStudent) return
    api.get('/submissions/my').then(r => {
      const map: Record<string, SubmissionDto[]> = {}
      for (const s of r.data as SubmissionDto[]) {
        map[s.topicId] = [...(map[s.topicId] ?? []), s]
      }
      setSubmissionsMap(map)
    })
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!window.confirm('Удалить эту сдачу?')) return
    try {
      await api.delete(`/submissions/${submissionId}`)
      showToast('Сдача удалена')
      loadSubmissions()
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Ошибка при удалении', 'error')
    }
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
      const deadline = topicDeadline ? new Date(topicDeadline).toISOString() : null
      await api.post(`/courses/modules/${moduleId}/topics`, { title: topicTitle, content: topicContent, deadline })
      setTopicTitle('')
      setTopicContent('')
      setTopicDeadline('')
      setAddingTopicFor(null)
      loadCourse()
    } finally {
      setTopicLoading(false)
    }
  }

  if (loading) return <Spinner />
  if (!course) return <p className="text-red-500">Курс не найден</p>

  const allTopics = course.modules.flatMap(m => m.topics)
  const submittedCount = allTopics.filter(t => (submissionsMap[t.id]?.length ?? 0) > 0).length
  const progressPct = allTopics.length > 0 ? Math.round((submittedCount / allTopics.length) * 100) : 0

  return (
    <div>
      {/* Breadcrumb */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-5 group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Все курсы
      </Link>

      {/* Course header */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-5">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600" />
        <div className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              {editingCourse ? (
                <form onSubmit={handleSaveCourse} className="flex flex-col gap-3 max-w-lg">
                  <input
                    autoFocus
                    value={editCourseTitle}
                    onChange={e => setEditCourseTitle(e.target.value)}
                    className="border border-indigo-300 rounded-xl px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                  <textarea
                    value={editCourseDesc}
                    onChange={e => setEditCourseDesc(e.target.value)}
                    rows={2}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700">Сохранить</button>
                    <button type="button" onClick={() => setEditingCourse(false)} className="text-sm text-gray-500 px-2">Отмена</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
                    {course.published
                      ? <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">Опубликован</span>
                      : <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">Черновик</span>
                    }
                    {isOwner && (
                      <button
                        onClick={() => { setEditCourseTitle(course.title); setEditCourseDesc(course.description || ''); setEditingCourse(true) }}
                        className="text-gray-300 hover:text-indigo-500 transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">{course.description}</p>
                  )}
                  {isTeacher && enrolledCount !== null && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {enrolledCount} {enrolledCount === 1 ? 'студент' : enrolledCount < 5 ? 'студента' : 'студентов'} записано
                    </div>
                  )}
                </>
              )}
            </div>

            {isTeacher && (
              <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                {isOwner && (
                  <>
                    <button
                      onClick={handleTogglePublish}
                      disabled={publishLoading}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 font-medium ${
                        course.published
                          ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {publishLoading ? '...' : course.published ? 'Снять с публикации' : 'Опубликовать'}
                    </button>
                    <button
                      onClick={handleDeleteCourse}
                      disabled={deleteLoading}
                      className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {deleteLoading ? '...' : 'Удалить'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => navigate(`/courses/${id}/journal`)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
                >
                  Журнал
                </button>
                <button
                  onClick={() => setAddingModule(true)}
                  className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  + Модуль
                </button>
              </div>
            )}
          </div>

          {/* Student progress */}
          {isStudent && allTopics.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Прогресс</span>
                <span className="text-xs font-bold text-indigo-600">{submittedCount} / {allTopics.length} тем</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">0%</span>
                <span className="text-xs text-gray-400">{progressPct}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add module form */}
      {addingModule && (
        <form onSubmit={handleAddModule} className="bg-white border border-indigo-100 rounded-2xl p-4 mb-4 flex gap-3 shadow-sm">
          <input
            autoFocus
            type="text"
            value={moduleTitle}
            onChange={e => setModuleTitle(e.target.value)}
            placeholder="Название модуля"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={moduleLoading}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
          >
            {moduleLoading ? '...' : 'Добавить'}
          </button>
          <button type="button" onClick={() => setAddingModule(false)} className="text-sm text-gray-400 px-2">Отмена</button>
        </form>
      )}

      {/* Modules list */}
      {course.modules.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-600 font-semibold">Модулей пока нет</p>
          {isTeacher && <p className="text-gray-400 text-sm mt-1">Нажмите «+ Модуль» чтобы добавить первый</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {course.modules.map((m, mi) => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {/* Module header */}
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
                    <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg">✓</button>
                    <button type="button" onClick={() => setEditingModuleId(null)} className="text-xs text-gray-400">✕</button>
                  </form>
                ) : (
                  <button
                    onClick={() => toggleModule(m.id)}
                    className="flex-1 flex justify-between items-center px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {mi + 1}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {m.title}
                      </span>
                      {m.topics.length > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {m.topics.length} тем
                        </span>
                      )}
                      {isOwner && (
                        <span
                          onClick={e => { e.stopPropagation(); setEditModuleTitle(m.title); setEditingModuleId(m.id) }}
                          className="text-gray-300 hover:text-indigo-500 text-xs cursor-pointer transition-colors"
                          title="Редактировать"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${openModules.has(m.id) ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                {isTeacher && editingModuleId !== m.id && (
                  <button
                    onClick={() => { setAddingTopicFor(m.id); setOpenModules(prev => new Set(prev).add(m.id)) }}
                    className="text-sm text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors px-4 py-4 shrink-0"
                  >
                    + Тема
                  </button>
                )}
              </div>

              {/* Topics */}
              {openModules.has(m.id) && (
                <div className="border-t border-gray-100">
                  {m.topics.map((t, ti) => (
                    <div key={t.id} className="border-b border-gray-50 last:border-0">
                      <div className="px-5 py-3.5 flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
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
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500 shrink-0">Дедлайн:</label>
                                <input
                                  type="date"
                                  value={editTopicDeadline}
                                  onChange={e => setEditTopicDeadline(e.target.value)}
                                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-indigo-700">Сохранить</button>
                                <button type="button" onClick={() => setEditingTopicId(null)} className="text-xs text-gray-400">Отмена</button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-300 font-mono w-5 shrink-0">{ti + 1}.</span>
                                <p className="text-sm font-semibold text-gray-800 leading-snug">{t.title}</p>
                                <DeadlineBadge deadline={t.deadline} />
                                {isOwner && (
                                  <button
                                    onClick={() => {
                                      setEditTopicTitle(t.title)
                                      setEditTopicContent(t.content || '')
                                      setEditTopicDeadline(t.deadline ? t.deadline.slice(0, 10) : '')
                                      setEditingTopicId(t.id)
                                    }}
                                    className="text-gray-300 hover:text-indigo-500 transition-colors shrink-0"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              {t.content && <p className="text-sm text-gray-400 mt-1 ml-7 leading-relaxed">{t.content}</p>}
                              {t.materials?.length > 0 && (
                                <div className="mt-2 ml-7 flex flex-col gap-1">
                                  {t.materials.map(mat => (
                                    <div key={mat.id} className="inline-flex items-center gap-1.5 group/mat">
                                      <a
                                        href={mat.publicUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline flex items-center gap-1"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        {mat.fileName}
                                        <span className="text-gray-300">({(mat.sizeBytes / 1024).toFixed(0)} KB)</span>
                                      </a>
                                      {isOwner && (
                                        <button
                                          onClick={() => handleDeleteMaterial(t.id, mat.id, mat.fileName)}
                                          className="opacity-0 group-hover/mat:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                                          title="Удалить"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isTeacher && (
                            <>
                              <button
                                onClick={() => setUploadingFor(t)}
                                className="text-xs text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors font-medium"
                              >
                                + Файл
                              </button>
                              <button
                                onClick={() => setViewingSubmissionsFor(t)}
                                className="text-xs text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors font-medium"
                              >
                                Сдачи
                              </button>
                            </>
                          )}
                          {isStudent && (() => {
                            const subs = submissionsMap[t.id] ?? []
                            const hasGrade = subs.some(s => s.grade)
                            return (
                              <div className="flex flex-col items-end gap-1.5 max-w-[200px]">
                                {subs.map(sub => (
                                  <div key={sub.id} className="flex items-center gap-1 group/sub">
                                    {sub.grade ? (
                                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                                        {sub.grade.score}/100
                                      </span>
                                    ) : (
                                      <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                                        ✓
                                      </span>
                                    )}
                                    <a href={sub.publicUrl} target="_blank" rel="noreferrer"
                                      className="text-xs text-gray-400 hover:text-indigo-500 hover:underline truncate max-w-[100px]"
                                      title={sub.fileName}>
                                      {sub.fileName}
                                    </a>
                                    {!sub.grade && (
                                      <button
                                        onClick={() => handleDeleteSubmission(sub.id)}
                                        className="opacity-0 group-hover/sub:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0"
                                        title="Удалить"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {!hasGrade && (
                                  <button
                                    onClick={() => setSubmittingFor(t)}
                                    className="text-xs text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-lg transition-colors font-medium"
                                  >
                                    {subs.length === 0 ? 'Сдать' : '+ Файл'}
                                  </button>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add topic form */}
                  {addingTopicFor === m.id ? (
                    <form onSubmit={e => handleAddTopic(e, m.id)} className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={topicTitle}
                        onChange={e => setTopicTitle(e.target.value)}
                        placeholder="Название темы"
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        required
                      />
                      <textarea
                        value={topicContent}
                        onChange={e => setTopicContent(e.target.value)}
                        placeholder="Описание (необязательно)"
                        rows={2}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 shrink-0">Дедлайн:</label>
                        <input
                          type="date"
                          value={topicDeadline}
                          onChange={e => setTopicDeadline(e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={topicLoading}
                          className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                          {topicLoading ? '...' : 'Добавить'}
                        </button>
                        <button type="button" onClick={() => setAddingTopicFor(null)} className="text-sm text-gray-400">Отмена</button>
                      </div>
                    </form>
                  ) : (
                    m.topics.length === 0 && (
                      <p className="text-gray-300 text-sm px-5 py-4 text-center">Тем нет</p>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadingFor && (
        <UploadMaterialModal topicId={uploadingFor.id} topicTitle={uploadingFor.title}
          onClose={() => setUploadingFor(null)} onUploaded={loadCourse} />
      )}
      {submittingFor && (
        <SubmitWorkModal topicId={submittingFor.id} topicTitle={submittingFor.title}
          onClose={() => setSubmittingFor(null)} onSubmitted={loadSubmissions} />
      )}
      {viewingSubmissionsFor && (
        <SubmissionsModal topicId={viewingSubmissionsFor.id} topicTitle={viewingSubmissionsFor.title}
          onClose={() => setViewingSubmissionsFor(null)} />
      )}
    </div>
  )
}

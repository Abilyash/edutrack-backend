import { useEffect, useState } from 'react'
import api from '../lib/api'
import Spinner from '../components/Spinner'
import { useToast } from '../context/ToastContext'

interface GradeDto {
  id: string
  score: number
  comment: string | null
  gradedAt: string
}

interface SubmissionDto {
  id: string
  topicId: string
  studentId: string
  fileName: string
  publicUrl: string
  status: string
  submittedAt: string
  grade: GradeDto | null
  topicTitle: string | null
  deadline: string | null
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-600 border-red-200'
  return (
    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${color}`}>
      {score}/100
    </span>
  )
}

type SortKey = 'date-desc' | 'date-asc' | 'status' | 'grade'

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null
  const d = new Date(deadline)
  const diffMs = d.getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffMs < 0) return (
    <span className="text-xs bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full">
      Просрочено
    </span>
  )
  if (diffDays <= 3) return (
    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
      {diffDays === 0 ? 'Сегодня' : `${diffDays} дн.`}
    </span>
  )
  return (
    <span className="text-xs bg-gray-50 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
      до {d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
    </span>
  )
}

export default function MySubmissionsPage() {
  const { showToast } = useToast()
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortKey>('date-desc')

  const load = () => {
    api.get('/submissions/my')
      .then(r => setSubmissions(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, fileName: string) => {
    if (!window.confirm(`Удалить сдачу «${fileName}»?`)) return
    try {
      await api.delete(`/submissions/${id}`)
      showToast('Сдача удалена')
    } catch (err: any) {
      showToast(`Ошибка: ${err.response?.data?.detail || err.message}`, 'error')
    } finally {
      load()
    }
  }

  if (loading) return <Spinner />

  const graded = submissions.filter(s => s.grade)
  const avg = graded.length > 0
    ? Math.round(graded.reduce((sum, s) => sum + s.grade!.score, 0) / graded.length)
    : null

  const sorted = [...submissions].sort((a, b) => {
    if (sort === 'date-asc') return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    if (sort === 'date-desc') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    if (sort === 'status') return (a.grade ? 1 : 0) - (b.grade ? 1 : 0)
    if (sort === 'grade') return (b.grade?.score ?? -1) - (a.grade?.score ?? -1)
    return 0
  })

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои сдачи</h1>
          <p className="text-sm text-gray-400 mt-0.5">Все отправленные работы</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Сортировка:</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-600"
          >
            <option value="date-desc">Новые первые</option>
            <option value="date-asc">Старые первые</option>
            <option value="status">На проверке первые</option>
            <option value="grade">По оценке</option>
          </select>
        </div>
        {avg !== null && (
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 px-5 py-3 rounded-2xl text-center">
            <div className="text-2xl font-bold text-indigo-600">{avg}</div>
            <div className="text-xs text-indigo-400 font-medium">средний балл</div>
          </div>
        )}
      </div>

      {/* Stats row */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
            <div className="text-xs text-gray-400 mt-0.5">всего сдач</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-emerald-600">{graded.length}</div>
            <div className="text-xs text-gray-400 mt-0.5">проверено</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-amber-500">{submissions.length - graded.length}</div>
            <div className="text-xs text-gray-400 mt-0.5">ожидает</div>
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">Вы ещё ничего не сдавали</p>
          <p className="text-sm text-gray-400 mt-1">Откройте курс и нажмите «Сдать» в нужной теме</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(s => (
            <div
              key={s.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:border-indigo-100 transition-colors"
            >
              <div className={`h-1 ${s.grade ? (s.grade.score >= 80 ? 'bg-emerald-400' : s.grade.score >= 60 ? 'bg-amber-400' : 'bg-red-400') : 'bg-gray-200'}`} />
              <div className="p-4 flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  {s.topicTitle && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">{s.topicTitle}</span>
                      {!s.grade && <DeadlineBadge deadline={s.deadline} />}
                    </div>
                  )}
                  <a
                    href={s.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="truncate">{s.fileName}</span>
                  </a>
                  <p className="text-xs text-gray-400 mt-1">
                    Сдано {new Date(s.submittedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {s.grade?.comment && (
                    <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-indigo-200">
                      «{s.grade.comment}»
                    </p>
                  )}
                  {s.grade?.gradedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Проверено {new Date(s.grade.gradedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  {s.grade ? (
                    <ScoreBadge score={s.grade.score} />
                  ) : (
                    <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
                      На проверке
                    </span>
                  )}
                  {!s.grade && (
                    <button
                      onClick={() => handleDelete(s.id, s.fileName)}
                      className="text-xs text-gray-300 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import api from '../lib/api'

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
}

interface Props {
  topicId: string
  topicTitle: string
  onClose: () => void
}

function ScorePill({ score }: { score: number }) {
  const cls = score >= 80
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : score >= 60
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-600 border-red-200'
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>{score}/100</span>
}

export default function SubmissionsModal({ topicId, topicTitle, onClose }: Props) {
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [gradingId, setGradingId] = useState<string | null>(null)
  const [score, setScore] = useState('')
  const [comment, setComment] = useState('')
  const [gradeLoading, setGradeLoading] = useState(false)
  const [gradeError, setGradeError] = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/submissions/topics/${topicId}`)
      .then(r => setSubmissions(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [topicId])

  const handleGrade = async (submissionId: string) => {
    const parsed = parseInt(score)
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setGradeError('Оценка должна быть от 0 до 100')
      return
    }
    setGradeLoading(true)
    setGradeError('')
    try {
      await api.post(`/submissions/${submissionId}/grade`, { score: parsed, comment: comment || null })
      setGradingId(null)
      setScore('')
      setComment('')
      load()
    } catch (err: any) {
      setGradeError(err.response?.data?.detail || err.response?.data?.message || 'Ошибка')
    } finally {
      setGradeLoading(false)
    }
  }

  const graded = submissions.filter(s => s.grade).length

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600 shrink-0" />

        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">Сдачи работ</h3>
            <p className="text-sm text-gray-400 mt-0.5">{topicTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {submissions.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {graded} / {submissions.length} проверено
              </span>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Нет сдач по этой теме</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {submissions.map(s => (
                <div key={s.id} className={`border rounded-xl overflow-hidden transition-colors ${s.grade ? 'border-gray-100' : 'border-amber-100'}`}>
                  <div className={`h-0.5 ${s.grade ? (s.grade.score >= 80 ? 'bg-emerald-400' : s.grade.score >= 60 ? 'bg-amber-400' : 'bg-red-400') : 'bg-amber-300'}`} />
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <a
                          href={s.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {s.fileName}
                        </a>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(s.submittedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {s.grade?.comment && (
                          <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 px-2.5 py-1.5 rounded-lg border-l-2 border-indigo-200">
                            «{s.grade.comment}»
                          </p>
                        )}
                      </div>
                      {s.grade ? (
                        <ScorePill score={s.grade.score} />
                      ) : (
                        <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200 shrink-0">
                          Ожидает
                        </span>
                      )}
                    </div>

                    {!s.grade && (
                      gradingId === s.id ? (
                        <div className="mt-3 flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={0} max={100}
                              value={score}
                              onChange={e => setScore(e.target.value)}
                              placeholder="0–100"
                              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <input
                              type="text"
                              value={comment}
                              onChange={e => setComment(e.target.value)}
                              placeholder="Комментарий (необязательно)"
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                          </div>
                          {gradeError && <p className="text-xs text-red-500">{gradeError}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGrade(s.id)}
                              disabled={!score || gradeLoading}
                              className="bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                            >
                              {gradeLoading ? '...' : 'Выставить оценку'}
                            </button>
                            <button
                              onClick={() => { setGradingId(null); setScore(''); setGradeError('') }}
                              className="text-xs text-gray-400 hover:text-gray-600 px-2"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setGradingId(s.id); setGradeError('') }}
                          className="mt-2.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Выставить оценку
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

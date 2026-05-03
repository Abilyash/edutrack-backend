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
      await api.post(`/submissions/${submissionId}/grade`, {
        score: parsed,
        comment: comment || null,
      })
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Сдачи работ</h3>
            <p className="text-sm text-gray-500 mt-0.5">{topicTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <p className="text-gray-400 text-sm">Загрузка...</p>
          ) : submissions.length === 0 ? (
            <p className="text-gray-400 text-sm">Нет сдач по этой теме</p>
          ) : (
            <div className="flex flex-col gap-3">
              {submissions.map(s => (
                <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <a
                        href={s.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        📎 {s.fileName}
                      </a>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(s.submittedAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    {s.grade ? (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3">
                        {s.grade.score}/100
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3">
                        Ожидает
                      </span>
                    )}
                  </div>

                  {s.grade?.comment && (
                    <p className="text-xs text-gray-500 mt-2 italic">"{s.grade.comment}"</p>
                  )}

                  {!s.grade && (
                    gradingId === s.id ? (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={score}
                            onChange={e => setScore(e.target.value)}
                            placeholder="0–100"
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Комментарий (необязательно)"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        {gradeError && <p className="text-xs text-red-500">{gradeError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGrade(s.id)}
                            disabled={!score || gradeLoading}
                            className="bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {gradeLoading ? '...' : 'Выставить'}
                          </button>
                          <button
                            onClick={() => { setGradingId(null); setScore(''); setGradeError('') }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setGradingId(s.id); setGradeError('') }}
                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Выставить оценку
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

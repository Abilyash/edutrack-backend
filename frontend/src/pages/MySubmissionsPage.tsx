import { useEffect, useState } from 'react'
import api from '../lib/api'
import Spinner from '../components/Spinner'

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

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/submissions/my')
      .then(r => setSubmissions(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const graded = submissions.filter(s => s.grade)
  const avg = graded.length > 0
    ? Math.round(graded.reduce((sum, s) => sum + s.grade!.score, 0) / graded.length)
    : null

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Мои сдачи</h2>
        {avg !== null && (
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium">
            Средний балл: {avg}/100
          </div>
        )}
      </div>

      {submissions.length === 0 ? (
          <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 font-medium">Вы ещё ничего не сдавали</p>
          <p className="text-gray-400 text-sm mt-1">Откройте курс и нажмите «Сдать работу» в нужной теме</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map(s => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-start shadow-sm"
            >
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
                  Сдано: {new Date(s.submittedAt).toLocaleString('ru-RU')}
                </p>
                {s.grade?.comment && (
                  <p className="text-xs text-gray-500 mt-1.5 italic">"{s.grade.comment}"</p>
                )}
                {s.grade?.gradedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Проверено: {new Date(s.grade.gradedAt).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>
              <div className="shrink-0 ml-4">
                {s.grade ? (
                  <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">
                    {s.grade.score}/100
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Ожидает проверки
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

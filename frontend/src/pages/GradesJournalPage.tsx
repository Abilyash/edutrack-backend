import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import Spinner from '../components/Spinner'

interface GradeDto {
  score: number
  comment: string | null
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

interface TopicRow {
  topicId: string
  topicTitle: string
  moduleTitle: string
  submissions: SubmissionDto[]
}

interface Topic {
  id: string
  title: string
}

interface Module {
  id: string
  title: string
  topics: Topic[]
}

interface Course {
  id: string
  title: string
  modules: Module[]
}

export default function GradesJournalPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [rows, setRows] = useState<TopicRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/courses/${id}`).then(async r => {
      const c: Course = r.data
      setCourse(c)

      const allTopics: { topicId: string; topicTitle: string; moduleTitle: string }[] = []
      for (const m of c.modules) {
        for (const t of m.topics) {
          allTopics.push({ topicId: t.id, topicTitle: t.title, moduleTitle: m.title })
        }
      }

      const results = await Promise.all(
        allTopics.map(t =>
          api.get(`/submissions/topics/${t.topicId}`)
            .then(r => ({ ...t, submissions: r.data as SubmissionDto[] }))
            .catch(() => ({ ...t, submissions: [] }))
        )
      )

      setRows(results)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />
  if (!course) return <p className="text-red-500">Курс не найден</p>

  const totalSubmissions = rows.reduce((s, r) => s + r.submissions.length, 0)
  const gradedSubmissions = rows.reduce((s, r) => s + r.submissions.filter(s => s.grade).length, 0)
  const allScores = rows.flatMap(r => r.submissions.filter(s => s.grade).map(s => s.grade!.score))
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null

  return (
    <div>
      <Link to={`/courses/${id}`} className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
        ← {course.title}
      </Link>

      <div className="flex justify-between items-start mt-2 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Журнал успеваемости</h2>
        <div className="flex gap-3">
          <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-xl">
            Сдач: {totalSubmissions}
          </div>
          <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-xl">
            Проверено: {gradedSubmissions}
          </div>
          {avgScore !== null && (
            <div className="bg-indigo-50 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-xl">
              Средний балл: {avgScore}/100
            </div>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-400">В курсе нет тем.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(row => (
            <div key={row.topicId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{row.moduleTitle}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{row.topicTitle}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {row.submissions.length === 0
                    ? 'Нет сдач'
                    : `${row.submissions.filter(s => s.grade).length} / ${row.submissions.length} проверено`}
                </span>
              </div>

              {row.submissions.length === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-4">Никто ещё не сдал</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left px-5 py-2 font-medium">Студент</th>
                      <th className="text-left px-5 py-2 font-medium">Файл</th>
                      <th className="text-left px-5 py-2 font-medium">Сдано</th>
                      <th className="text-right px-5 py-2 font-medium">Оценка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.submissions.map(s => (
                      <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                          {s.studentId.substring(0, 8)}…
                        </td>
                        <td className="px-5 py-3">
                          <a
                            href={s.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            📎 {s.fileName}
                          </a>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs">
                          {new Date(s.submittedAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {s.grade ? (
                            <div className="flex flex-col items-end">
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {s.grade.score}/100
                              </span>
                              {s.grade.comment && (
                                <span className="text-xs text-gray-400 mt-0.5 italic">"{s.grade.comment}"</span>
                              )}
                            </div>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2.5 py-0.5 rounded-full">
                              Ожидает
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

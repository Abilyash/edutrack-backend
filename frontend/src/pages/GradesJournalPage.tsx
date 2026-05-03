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

function ScorePill({ score }: { score: number }) {
  const cls = score >= 80
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : score >= 60
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-600 border-red-200'
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>{score}/100</span>
}

export default function GradesJournalPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [rows, setRows] = useState<TopicRow[]>([])
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
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

      const uniqueIds = [...new Set(results.flatMap(r => r.submissions.map(s => s.studentId)))]
      const names: Record<string, string> = {}
      await Promise.all(
        uniqueIds.map(sid =>
          api.get(`/users/${sid}`)
            .then(r => { names[sid] = r.data.name || r.data.email })
            .catch(() => { names[sid] = sid.substring(0, 8) + '…' })
        )
      )
      setStudentNames(names)
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
      {/* Back link */}
      <Link to={`/courses/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors mb-5 group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {course.title}
      </Link>

      {/* Header + stats */}
      <div className="flex justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Журнал успеваемости</h1>
          <p className="text-sm text-gray-400 mt-0.5">Все работы студентов по курсу</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-900">{totalSubmissions}</div>
          <div className="text-xs text-gray-400 mt-0.5">всего сдач</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">{gradedSubmissions}</div>
          <div className="text-xs text-gray-400 mt-0.5">проверено</div>
        </div>
        <div className={`rounded-2xl p-4 shadow-sm text-center border ${avgScore !== null ? 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100' : 'bg-white border-gray-100'}`}>
          <div className={`text-2xl font-bold ${avgScore !== null ? 'text-indigo-600' : 'text-gray-300'}`}>
            {avgScore !== null ? avgScore : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">средний балл</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-400">В курсе нет тем</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(row => (
            <div key={row.topicId} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{row.moduleTitle}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{row.topicTitle}</p>
                </div>
                <div className="text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full">
                  {row.submissions.length === 0
                    ? 'Нет сдач'
                    : `${row.submissions.filter(s => s.grade).length} / ${row.submissions.length} проверено`}
                </div>
              </div>

              {row.submissions.length === 0 ? (
                <p className="text-sm text-gray-300 text-center px-5 py-6">Никто ещё не сдал</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Студент</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Файл</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Дата</th>
                      <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Оценка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.submissions.map(s => (
                      <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-800 font-medium text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                              {(studentNames[s.studentId] ?? '?')[0]?.toUpperCase()}
                            </div>
                            {studentNames[s.studentId] ?? s.studentId.substring(0, 8) + '…'}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <a
                            href={s.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-500 hover:text-indigo-700 hover:underline flex items-center gap-1.5 text-sm"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="truncate max-w-[160px]">{s.fileName}</span>
                          </a>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(s.submittedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {s.grade ? (
                            <div className="flex flex-col items-end gap-1">
                              <ScorePill score={s.grade.score} />
                              {s.grade.comment && (
                                <span className="text-xs text-gray-400 italic max-w-[160px] text-right">«{s.grade.comment}»</span>
                              )}
                            </div>
                          ) : (
                            <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
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

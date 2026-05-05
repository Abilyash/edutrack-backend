import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import api from '../lib/api'
import Spinner from '../components/Spinner'

interface CompletionDto {
  courseId: string
  courseTitle: string
  completed: boolean
  totalTopics: number
  gradedTopics: number
  averageScore: number | null
}

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const [completion, setCompletion] = useState<CompletionDto | null>(null)
  const [loading, setLoading] = useState(true)

  const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    api.get(`/submissions/courses/${id}/my-completion`)
      .then(r => setCompletion(r.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner />
    </div>
  )

  if (!completion?.completed) return <Navigate to={`/courses/${id}`} replace />

  const avg = Math.round(completion.averageScore ?? 0)
  const score = avg >= 90 ? 'отлично' : avg >= 75 ? 'хорошо' : avg >= 60 ? 'удовлетворительно' : 'зачёт'

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 print:bg-white print:p-0">

      {/* Controls — скрыты при печати */}
      <div className="print:hidden mb-6 flex items-center gap-4">
        <Link
          to={`/courses/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          К курсу
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Скачать PDF / Печать
        </button>
      </div>

      {/* Certificate */}
      <div className="bg-white w-full max-w-[800px] shadow-2xl print:shadow-none print:max-w-none print:w-screen">
        <div className="border-[12px] border-double border-indigo-100 m-4 print:m-6 relative">

          {/* Corner ornaments */}
          {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-10 h-10`}>
              <div className={`w-full h-full border-4 border-indigo-300 ${
                i === 0 ? 'border-r-0 border-b-0 rounded-tl-md' :
                i === 1 ? 'border-l-0 border-b-0 rounded-tr-md' :
                i === 2 ? 'border-r-0 border-t-0 rounded-bl-md' :
                          'border-l-0 border-t-0 rounded-br-md'
              }`} />
            </div>
          ))}

          <div className="flex flex-col items-center text-center px-12 py-10">

            {/* Seal */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg ring-4 ring-indigo-100">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>

            <p className="text-xs font-bold tracking-[0.5em] text-indigo-400 uppercase mb-1">EduTrack</p>

            {/* Decorative line */}
            <div className="flex items-center gap-3 w-full max-w-xs mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-200" />
              <div className="w-2 h-2 rounded-full bg-indigo-300" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-200" />
            </div>

            <h1 className="text-5xl font-bold text-gray-800 tracking-[0.15em] uppercase mb-8"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Сертификат
            </h1>

            <p className="text-sm text-gray-400 mb-3">Настоящим подтверждается, что</p>

            <h2 className="text-3xl font-bold text-indigo-700 mb-3"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {user?.name || user?.email}
            </h2>

            <p className="text-sm text-gray-400 mb-2">успешно прошёл(а) курс</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-7 max-w-md leading-snug">
              «{completion.courseTitle}»
            </h3>

            {/* Score */}
            <div className="flex items-center gap-6 mb-7">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-100" />
              <div className="flex flex-col items-center bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-200 rounded-2xl px-8 py-3">
                <span className="text-4xl font-bold text-indigo-600">{avg}</span>
                <span className="text-xs text-indigo-400 font-medium mt-0.5">средний балл — {score}</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-100" />
            </div>

            <p className="text-xs text-gray-400 tracking-wide">{date}</p>

            {/* Bottom decorative line */}
            <div className="flex items-center gap-3 w-full max-w-xs mt-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-200" />
              <div className="w-2 h-2 rounded-full bg-indigo-300" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

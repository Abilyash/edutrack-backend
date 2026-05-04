import { useRef, useState } from 'react'
import api from '../lib/api'

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'image/jpeg',
  'image/png',
])
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

interface Props {
  topicId: string
  topicTitle: string
  onClose: () => void
  onSubmitted: () => void
}

export default function SubmitWorkModal({ topicId, topicTitle, onClose, onSubmitted }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_TYPES.has(f.type)) return `«${f.name}»: недопустимый формат`
    if (f.size > MAX_SIZE) return `«${f.name}»: превышает 20 МБ`
    return null
  }

  const handleFileChange = (selected: FileList | null) => {
    if (!selected || selected.length === 0) return
    const newFiles = Array.from(selected)
    for (const f of newFiles) {
      const err = validateFile(f)
      if (err) { setError(err); return }
    }
    setError('')
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...newFiles.filter(f => !existing.has(f.name))]
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFile = (name: string) => setFiles(prev => prev.filter(f => f.name !== name))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return
    setLoading(true)
    setError('')
    let failed = 0
    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        await api.post(`/submissions/topics/${topicId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      onSubmitted()
      onClose()
    } catch (err: any) {
      failed++
      setError(err.response?.data?.detail || err.response?.data?.message || 'Ошибка при отправке')
    } finally {
      setLoading(false)
    }
  }

  const pluralFiles = (n: number) => n === 1 ? '1 файл' : `${n} файла`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Сдать работу</h3>
              <p className="text-sm text-gray-400 mt-0.5">{topicTitle}</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png"
                onChange={e => handleFileChange(e.target.files)}
              />
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Нажмите чтобы добавить файлы</p>
              <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PPT, TXT, ZIP, JPEG, PNG · до 20 МБ каждый</p>
            </div>

            {files.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {files.map(f => (
                  <div key={f.name} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700 truncate">{f.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button type="button" onClick={() => removeFile(f.name)} className="text-gray-300 hover:text-red-500 transition-colors ml-2 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
                Отмена
              </button>
              <button type="submit" disabled={files.length === 0 || loading}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
                {loading ? 'Отправка...' : `Отправить ${pluralFiles(files.length)}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

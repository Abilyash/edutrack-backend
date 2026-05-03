import { useRef, useState } from 'react'
import api from '../lib/api'

interface Props {
  topicId: string
  topicTitle: string
  onClose: () => void
  onSubmitted: () => void
}

export default function SubmitWorkModal({ topicId, topicTitle, onClose, onSubmitted }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post(`/submissions/topics/${topicId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onSubmitted()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Ошибка при отправке')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Сдать работу</h3>
        <p className="text-sm text-gray-500 mb-5">{topicTitle}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <p className="text-sm text-gray-700 font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-400">Нажмите чтобы выбрать файл</p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!file || loading}
              className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

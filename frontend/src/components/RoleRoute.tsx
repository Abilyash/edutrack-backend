import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

interface Props {
  allow: ('STUDENT' | 'TEACHER' | 'ADMIN')[]
  children: React.ReactNode
}

export default function RoleRoute({ allow, children }: Props) {
  const { user } = useUser()
  if (!user) return null
  if (!allow.includes(user.role as any)) return <Navigate to="/" replace />
  return <>{children}</>
}

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api from '../lib/api'

interface User {
  id: string
  email: string
  name: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  createdAt: string
}

interface UserContextType {
  user: User | null
  loading: boolean
  isTeacher: boolean
  isAdmin: boolean
}

const UserContext = createContext<UserContextType>({ user: null, loading: true, isTeacher: false, isAdmin: false })

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/me')
      .then(r => setUser(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <UserContext.Provider value={{
      user,
      loading,
      isTeacher: user?.role === 'TEACHER' || user?.role === 'ADMIN',
      isAdmin: user?.role === 'ADMIN',
    }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)

'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'
import { useState } from 'react'

export default function AdminHeader() {
  const { data: session } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  if (!session) return null

  return (
    <div className="px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord administrateur</h1>
          <p className="text-sm text-gray-600">Gestion de la plateforme EcoDeli</p>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <div className="flex justify-center items-center w-8 h-8 bg-sky-100 rounded-full">
              <User className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 z-50 py-1 mt-2 w-48 bg-white rounded-md border border-gray-200 shadow-lg">
              <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                <p className="font-medium">{session.user.name}</p>
                <p className="text-gray-500">{session.user.email}</p>
                <p className="mt-1 text-xs text-sky-600">Administrateur</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 w-full text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="mr-2 w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
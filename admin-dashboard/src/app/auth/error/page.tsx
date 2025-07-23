'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Email ou mot de passe incorrect'
      case 'AccessDenied':
        return 'Accès refusé - Seuls les administrateurs peuvent se connecter'
      case 'Configuration':
        return 'Erreur de configuration du serveur'
      default:
        return 'Une erreur est survenue lors de la connexion'
    }
  }

  return (
    <>
      <div className="text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur de connexion</h1>
        <p className="text-gray-600">{getErrorMessage(error)}</p>
      </div>

      <div className="space-y-4">
        <Link
          href="/auth/signin"
          className="w-full bg-sky-600 text-white py-3 px-4 rounded-lg hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Si le problème persiste, contactez l'administrateur système</p>
      </div>
    </>
  )
}

function LoadingFallback() {
  return (
    <>
      <div className="text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur de connexion</h1>
        <p className="text-gray-600">Chargement...</p>
      </div>

      <div className="space-y-4">
        <Link
          href="/auth/signin"
          className="w-full bg-sky-600 text-white py-3 px-4 rounded-lg hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Si le problème persiste, contactez l'administrateur système</p>
      </div>
    </>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <Suspense fallback={<LoadingFallback />}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  )
} 
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Sun, Moon } from 'lucide-react'

export default function VerifyEmail({ isDarkMode, toggleDarkMode }) {
  const router = useRouter()
  const { token, email } = router.query
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)

  useEffect(() => {
    console.log('🔍 VerifyEmail component mounted:', {
      token: token ? `${token.toString().substring(0, 10)}...` : 'null',
      email: email || 'null',
      query: router.query,
      isReady: router.isReady
    });

    // Only proceed when router is ready and we have both token and email
    if (router.isReady && token && email) {
      console.log('✅ Router ready, starting verification...');
      verifyEmail(token, email)
    } else if (router.isReady && (!token || !email)) {
      console.log('❌ Missing token or email after router ready');
      setStatus('error')
      setMessage('Lien de vérification invalide. Token ou email manquant.')
    }
  }, [token, email, router.isReady])

  const verifyEmail = async (token, email) => {
    try {
      console.log('🚀 Starting email verification request...');
      
      const url = `/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
      console.log('📡 Request URL:', url);
      
      setStatus('loading')
      setMessage('Vérification en cours...')
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      let data;
      try {
        data = await response.json()
        console.log('📦 Response data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        const text = await response.text();
        console.log('📄 Raw response:', text.substring(0, 500));
        throw new Error('Réponse du serveur invalide (non-JSON)');
      }

      if (response.ok) {
        console.log('✅ Verification successful');
        setStatus('success')
        setMessage(data.message || 'Votre compte a été vérifié avec succès!')
        setDebugInfo(data.debug)
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          console.log('🔄 Redirecting to login...');
          router.push('/login')
        }, 3000)
      } else {
        console.log('❌ Verification failed:', data);
        setStatus('error')
        setMessage(data.message || 'Erreur lors de la vérification de votre compte.')
        setDebugInfo(data.debug)
      }
    } catch (error) {
      console.error('❌ Verify email error:', error);
      setStatus('error')
      setMessage('Une erreur est survenue lors de la vérification: ' + error.message)
      setDebugInfo({ 
        error: error.message,
        token: token ? `${token.toString().substring(0, 10)}...` : 'null',
        email: email || 'null'
      })
    }
  }

  // Show debug info in development
  const showDebug = process.env.NODE_ENV === 'development' && (debugInfo || status === 'error');

  return (
    <div className="flex flex-col justify-center items-center px-4 py-12 min-h-screen bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Head>
        <title>Vérification Email - ecodeli</title>
        <meta name="description" content="Vérifiez votre adresse email" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-md dark:bg-gray-800">
        {/* Logo */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex gap-2 items-center">
            <Image 
              src="/LOGO_.png"
              alt="Logo Ecodeli"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-2xl font-bold text-black dark:text-white">ecodeli</span>
          </Link>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            ) : (
              <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            )}
          </button>
        </div>

        {/* Contenu principal */}
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              </div>
              <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                Vérification en cours...
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {message || 'Nous vérifions votre adresse email, veuillez patienter.'}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="mb-4 text-2xl font-bold text-green-600">
                Email vérifié avec succès !
              </h1>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vous allez être redirigé vers la page de connexion dans quelques secondes...
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 px-6 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
              >
                Me connecter maintenant
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h1 className="mb-4 text-2xl font-bold text-red-600">
                Erreur de vérification
              </h1>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                {message}
              </p>
              <div className="space-y-2">
                <Link
                  href="/register"
                  className="inline-block px-6 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
                >
                  S'inscrire à nouveau
                </Link>
                <br />
                <Link
                  href="/login"
                  className="inline-block px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Se connecter
                </Link>
              </div>
            </>
          )}

          {/* Debug info en développement */}
          {showDebug && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left">
              <h3 className="text-sm font-bold mb-2 text-gray-800 dark:text-gray-200">Debug Info:</h3>
              <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto">
                {JSON.stringify({
                  router: {
                    isReady: router.isReady,
                    token: token ? `${token.toString().substring(0, 10)}...` : 'null',
                    email: email || 'null'
                  },
                  status,
                  debugInfo
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
import '../styles/globals.css'
import '../styles/leaflet-custom.css'
import { Poppins } from 'next/font/google'
import { useState, useEffect } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { TranslationProvider } from '../contexts/TranslationContext'
import SessionConflictManager from '../components/SessionConflictManager'

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
})

function MyApp({ Component, pageProps }) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur a une préférence de thème
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('theme')
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <TranslationProvider>
      <AuthProvider>
        <main className={poppins.className}>
          {/* Session conflict manager - detects and resolves multiple simultaneous sessions */}
          <SessionConflictManager />
          
          {/* Page content */}
          <Component {...pageProps} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </main>
      </AuthProvider>
    </TranslationProvider>
  )
}

export default MyApp
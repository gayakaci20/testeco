import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react' // Importer useState et useEffect
import { useRouter } from 'next/router' // Importer useRouter pour la redirection
import { useAuth } from '../contexts/AuthContext' // Importer le contexte d'authentification
import { useTranslation } from '../contexts/TranslationContext' // Importer le contexte de traduction
import { getRoleSpecificDashboardUrl } from '../components/RoleBasedNavigation' // Importer la fonction utilitaire
import { Sun, Moon } from 'lucide-react'

export default function Login({ isDarkMode, toggleDarkMode }) {
  const router = useRouter(); // Initialiser useRouter
  const { user, loading, login } = useAuth(); // Utiliser le contexte d'authentification
  const { t } = useTranslation(); // Utiliser le contexte de traduction
  
  // États pour les champs du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user && !loading) {
      // Rediriger selon le rôle de l'utilisateur
      if (user.role === 'ADMIN') {
        console.log('🔄 Redirection automatique ADMIN vers /admin');
        router.replace('/admin').catch((err) => {
          console.error('❌ Erreur lors de la redirection automatique admin:', err);
          window.location.href = '/admin';
        });
      } else if (user.role === 'CARRIER' && user.userType === 'PROFESSIONAL') {
        console.log('🔄 Redirection automatique CARRIER PROFESSIONAL vers /dashboard/procarrier');
        router.replace('/dashboard/procarrier').catch((err) => {
          console.error('❌ Erreur lors de la redirection automatique procarrier:', err);
          window.location.href = '/dashboard/procarrier';
        });
      } else if (user.role === 'PROVIDER' && user.userType === 'PROFESSIONAL') {
        console.log('🔄 Redirection automatique PROVIDER PROFESSIONAL vers /dashboard/proprovider');
        router.replace('/dashboard/proprovider').catch((err) => {
          console.error('❌ Erreur lors de la redirection automatique proprovider:', err);
          window.location.href = '/dashboard/proprovider';
        });
      } else {
        // Utiliser la fonction getRoleSpecificDashboardUrl pour rediriger vers le bon dashboard
        const dashboardUrl = getRoleSpecificDashboardUrl(user);
        const callbackUrl = router.query.callbackUrl || dashboardUrl;
        console.log('🔄 Redirection automatique vers:', callbackUrl, 'pour le rôle:', user.role || user.userType);
        router.replace(callbackUrl).catch((err) => {
          console.error('❌ Erreur lors de la redirection automatique:', err);
          window.location.href = callbackUrl;
        });
      }
    }
  }, [user, loading, router]);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Utiliser la fonction login du contexte d'authentification
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        throw new Error(result.error || 'Une erreur est survenue lors de la connexion.');
      }
      
      // Vérifier que l'utilisateur est correctement défini
      if (!result.user) {
        throw new Error('Erreur: données utilisateur non reçues');
      }

      // Connexion réussie
      console.log('Connexion réussie:', result.user);
      
      // Petit délai pour s'assurer que l'état est mis à jour
      setTimeout(() => {
        // Rediriger selon le rôle de l'utilisateur
        if (result.user.role === 'ADMIN') {
            console.log('🚀 Redirection ADMIN vers /admin');
            router.replace('/admin').catch((err) => {
              console.error('❌ Erreur lors de la redirection admin:', err);
              // Redirection de secours
              window.location.href = '/admin';
            });
        } else if (result.user.role === 'CARRIER' && result.user.userType === 'PROFESSIONAL') {
          console.log('🚀 Redirection CARRIER PROFESSIONAL vers /dashboard/procarrier');
          router.replace('/dashboard/procarrier').catch((err) => {
            console.error('❌ Erreur lors de la redirection procarrier:', err);
            // Redirection de secours
            window.location.href = '/dashboard/procarrier';
          });
        } else if (result.user.role === 'PROVIDER' && result.user.userType === 'PROFESSIONAL') {
          console.log('🚀 Redirection PROVIDER PROFESSIONAL vers /dashboard/proprovider');
          router.replace('/dashboard/proprovider').catch((err) => {
            console.error('❌ Erreur lors de la redirection proprovider:', err);
            // Redirection de secours
            window.location.href = '/dashboard/proprovider';
          });
        } else {
          // Utiliser la fonction getRoleSpecificDashboardUrl pour rediriger vers le bon dashboard
          const dashboardUrl = getRoleSpecificDashboardUrl(result.user);
          const callbackUrl = router.query.callbackUrl || dashboardUrl;
          
          console.log('🚀 Redirection vers:', callbackUrl, 'pour le rôle:', result.user.role || result.user.userType);
          console.log('🚀 Données utilisateur:', { role: result.user.role, userType: result.user.userType });
          
          // Rediriger vers le dashboard approprié - utiliser replace pour forcer la redirection
          router.replace(callbackUrl).catch((err) => {
            console.error('❌ Erreur lors de la redirection:', err);
            // Redirection de secours
            window.location.href = callbackUrl;
          });
        }
      }, 100);
      

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 py-12 min-h-screen bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Head>
        <title>{t('login')} - ecodeli</title>
        <meta name="description" content={t('loginDescription')} />
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
            aria-label={t('toggleDarkMode')}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            ) : (
              <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            )}
          </button>
        </div>

        {/* Titre */}
        <h1 className="mb-2 text-3xl font-bold text-center text-gray-900 dark:text-white">
          {t('welcomeToEcodeli')}
        </h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">
          {t('loginOrRegisterPrompt')}
        </p>

        {/* Affichage des erreurs */}
        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 rounded border border-red-400 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form className="space-y-6" onSubmit={handleSubmit}> {/* Ajouter onSubmit */} 
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end items-center">
            <Link 
              href="/forgot-password"
              className="text-sm text-sky-400 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
            >
              {t('forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading} // Désactiver pendant le chargement
            className="flex justify-center px-4 py-3 w-full text-sm font-medium text-white bg-sky-400 rounded-full border border-transparent shadow-sm transition-colors hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('loggingIn') : t('loginButton')}
          </button>

          <div className="text-center">
            <Link 
              href="/register"
              className="text-sm text-sky-400 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
            >
              {t('registerLink')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
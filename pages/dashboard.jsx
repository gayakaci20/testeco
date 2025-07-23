import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
        router.push('/login');
        return;
      }

      // Mapping des rôles vers leurs tableaux de bord spécifiques
      const roleRoutes = {
        'ADMIN': '/admin-dashboard',
        'CARRIER': '/dashboard/carrier',
        'CUSTOMER': '/dashboard/customer', 
        'MERCHANT': '/dashboard/merchant',
        'PROVIDER': '/dashboard/provider',
        'SERVICE_PROVIDER': '/dashboard/provider', 
        'SPECIALIZED_PROVIDER': '/dashboard/specialized-provider'
      };

      const userRole = user.userType || user.role || 'CUSTOMER';
      let redirectPath = roleRoutes[userRole.toUpperCase()];
      
      // Vérifier si c'est un transporteur professionnel
      if ((user.role === 'CARRIER' || user.userType === 'CARRIER') && user.userType === 'PROFESSIONAL') {
        redirectPath = '/dashboard/procarrier';
      }

      // Vérifier si c'est un prestataire professionnel
      if ((user.role === 'PROVIDER' || user.userType === 'PROVIDER') && user.userType === 'PROFESSIONAL') {
        redirectPath = '/dashboard/proprovider';
      }
      
      console.log('🔄 Dashboard redirect:', {
        userRole,
        redirectPath,
        user: user.firstName
      });

      if (redirectPath) {
        // Rediriger vers le dashboard approprié
        router.replace(redirectPath);
      } else {
        // Fallback vers customer dashboard si rôle non reconnu
        console.warn('⚠️ Rôle non reconnu, redirection vers customer dashboard:', userRole);
        router.replace('/dashboard/customer');
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <Head>
          <title>Redirection - ecodeli</title>
          <meta name="description" content="Redirection vers votre tableau de bord" />
          <link rel="icon" href="/LOGO_.png" />
        </Head>
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement de votre tableau de bord...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Vérification de votre session...' : 'Redirection en cours...'}
          </p>
        </div>
      </div>
    );
  }

  // Si on arrive ici, c'est qu'il y a un problème de redirection
  return (
    <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Redirection - ecodeli</title>
        <meta name="description" content="Redirection vers votre tableau de bord" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>
      <div className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
        <p className="text-gray-600 dark:text-gray-300">Redirection vers votre tableau de bord...</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Rôle: {user?.role || user?.userType || 'Non défini'}
        </p>
        
        {/* Bouton de secours si la redirection échoue */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard/customer')}
            className="px-6 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
          >
            Aller au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
} 
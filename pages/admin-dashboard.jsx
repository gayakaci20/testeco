import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head';

export default function AdminDashboardRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
        router.push('/login');
        return;
      }

      if (user.role !== 'ADMIN') {
        // Si l'utilisateur n'est pas admin, rediriger vers la page d'accueil
        router.push('/');
        return;
      }

      // Si l'utilisateur est admin, rediriger vers le dashboard admin externe
      window.location.href = 'http://localhost:3001'; // Port du dashboard admin
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Head>
          <title>Redirection - Dashboard Admin</title>
        </Head>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 rounded-full animate-spin border-sky-500"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Redirection - Dashboard Admin</title>
      </Head>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-b-2 rounded-full animate-spin border-sky-500"></div>
        <p className="text-gray-600 dark:text-gray-300">Redirection vers le dashboard administrateur...</p>
      </div>
    </div>
  );
} 
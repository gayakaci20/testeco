import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function ServicesIndex() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        // Rediriger vers la page browse
        router.push('/services/browse');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="mx-auto w-32 h-32 rounded-full border-b-2 border-emerald-600 animate-spin"></div>
        <p className="mt-4 text-gray-600">Chargement des services...</p>
      </div>
    </div>
  );
} 
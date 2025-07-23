import { Suspense } from 'react';
import UsersContent from './UsersContent';
import Loading from '../dashboard/loading';
import Link from 'next/link';
import { Users, UserPlus, TrendingUp, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import UsersStats from './UsersStats';

export const metadata = {
  title: 'Users Management - EcoDeli Admin',
  description: 'Manage users of the eco-delivery platform',
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Header Section - Same design as rides */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
              <p className="mt-1 text-gray-600">Gérez et administrez tous les utilisateurs de la plateforme</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link href="/adduser">
              <button className="inline-flex items-center px-6 py-3 font-medium text-white bg-purple-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-purple-700 hover:shadow-md">
                <UserPlus className="mr-2 w-5 h-5" />
                Nouvel Utilisateur
              </button>
            </Link>
            {/* Bouton Actualiser retiré pour éviter l'erreur Server Component */}
          </div>
        </div>
      </div>

      {/* Stats Cards - Enhanced design like rides */}
      <Suspense fallback={
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md animate-pulse">
              <div className="flex justify-between items-center">
                <div>
                  <div className="mb-2 w-20 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="flex items-center mt-4">
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      }>
        <UsersStats />
      </Suspense>

      {/* Main Content - Enhanced container like rides */}
      <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
        <Suspense fallback={<Loading />}>
          <UsersContent />
        </Suspense>
      </div>
    </div>
  );
} 
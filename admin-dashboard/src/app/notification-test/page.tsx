import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Loading from '../dashboard/loading';
import { Bell, Send, TestTube, AlertCircle } from 'lucide-react';

// Use dynamic import instead of direct import
const NotificationTestContent = dynamic(() => import('./NotificationTestContent'), {
  loading: () => <Loading />
});

export const metadata = {
  title: 'Tests de Notifications - EcoDeli Admin',
  description: 'Testez et gérez les notifications email/SMS',
};

export default function NotificationTestPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TestTube className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tests de Notifications</h1>
              <p className="mt-1 text-gray-600">Testez et validez vos systèmes de notifications</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors duration-200">
              <Bell className="mr-2 w-4 h-4" />
              Historique
            </button>
            <button className="inline-flex items-center px-6 py-3 font-medium text-white bg-purple-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-purple-700 hover:shadow-md">
              <Send className="mr-2 w-5 h-5" />
              Nouveau Test
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Tests Envoyés</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">156</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">+8</span>
            <span className="ml-1 text-gray-500">aujourd'hui</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de Réussite</p>
              <p className="mt-1 text-2xl font-bold text-green-600">98.7%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TestTube className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">+0.3%</span>
            <span className="ml-1 text-gray-500">vs hier</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Notifications Email</p>
              <p className="mt-1 text-2xl font-bold text-purple-600">89</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Dernière: il y a 2min</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Erreurs</p>
              <p className="mt-1 text-2xl font-bold text-red-600">2</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-red-600">-1</span>
            <span className="ml-1 text-gray-500">vs hier</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border shadow-sm">
        <Suspense fallback={<Loading />}>
          <NotificationTestContent />
        </Suspense>
      </div>
    </div>
  );
} 
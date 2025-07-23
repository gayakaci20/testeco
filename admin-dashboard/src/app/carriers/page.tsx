import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Loading from '../dashboard/loading';
import { Truck, Users, TrendingUp, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

// Use dynamic import instead of direct import
const CarriersContent = dynamic(() => import('./CarriersContent'), {
  loading: () => <Loading />
});

export const metadata = {
  title: 'Carriers Management - Admin Dashboard',
  description: 'Manage carriers and delivery personnel',
};

export default function CarriersPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <Truck className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Transporteurs</h1>
            <p className="text-gray-600 mt-1">Administrez tous les transporteurs et livreurs de la plateforme</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transporteurs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">284</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Truck className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-1">ce mois</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600 mt-1">247</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-green-600 font-medium">87%</span>
            <span className="text-gray-500 ml-1">taux d'activité</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Livraison</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">89</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-blue-600 font-medium">Actuellement</span>
            <span className="text-gray-500 ml-1">sur la route</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactifs</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">37</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-orange-600 font-medium">13%</span>
            <span className="text-gray-500 ml-1">hors service</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border shadow-sm">
        <Suspense fallback={<Loading />}>
          <CarriersContent />
        </Suspense>
      </div>
    </div>
  );
} 
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Loading from './loading';
import { LayoutDashboard, Activity, TrendingUp, Users, Package, Car, Settings, BarChart3 } from 'lucide-react';

// Use dynamic import instead of direct import
const DashboardContent = dynamic(() => import('./DashboardContent'), {
  loading: () => <Loading />
});

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard for managing the eco-delivery platform',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble de votre plateforme de livraison écologique</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">2,847</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Colis en Transit</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">1,247</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <Activity className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-gray-500">En cours de livraison</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trajets Disponibles</p>
              <p className="text-2xl font-bold text-green-600 mt-1">89</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-green-600 font-medium">Prêts</span>
            <span className="text-gray-500 ml-1">pour réservation</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Services Actifs</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">156</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <BarChart3 className="w-4 h-4 text-purple-500 mr-1" />
            <span className="text-purple-600 font-medium">92%</span>
            <span className="text-gray-500 ml-1">taux d'utilisation</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="bg-white rounded-xl border shadow-sm">
        <DashboardContent />
      </div>
    </div>
  );
} 
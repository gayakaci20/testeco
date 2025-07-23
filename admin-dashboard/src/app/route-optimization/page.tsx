import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Loading from '../dashboard/loading';
import { Route, Zap, TrendingUp, Clock, Target, MapPin } from 'lucide-react';

// Use dynamic import instead of direct import
const RouteOptimizationContent = dynamic(() => import('./RouteOptimizationContent'), {
  loading: () => <Loading />
});

export const metadata = {
  title: 'Optimisation des Routes - EcoDeli Admin',
  description: 'Optimisez les itinéraires de livraison pour une efficacité maximale',
};

export default function RouteOptimizationPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <Route className="w-8 h-8 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Optimisation des Routes</h1>
              <p className="mt-1 text-gray-600">Maximisez l'efficacité de vos itinéraires de livraison</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 font-medium text-cyan-700 bg-cyan-100 rounded-lg hover:bg-cyan-200 transition-colors duration-200">
              <MapPin className="mr-2 w-4 h-4" />
              Voir Carte
            </button>
            <button className="inline-flex items-center px-6 py-3 font-medium text-white bg-cyan-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-cyan-700 hover:shadow-md">
              <Zap className="mr-2 w-5 h-5" />
              Optimiser Maintenant
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Routes Optimisées</p>
              <p className="mt-1 text-2xl font-bold text-cyan-600">89</p>
            </div>
            <div className="p-3 bg-cyan-50 rounded-lg">
              <Route className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">+12</span>
            <span className="ml-1 text-gray-500">cette semaine</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Économies Carburant</p>
              <p className="mt-1 text-2xl font-bold text-green-600">23.4%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">€1,247</span>
            <span className="ml-1 text-gray-500">économisés</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Temps Gagné</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">4.2h</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Par jour en moyenne</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Efficacité</p>
              <p className="mt-1 text-2xl font-bold text-purple-600">94.8%</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-purple-600">+2.1%</span>
            <span className="ml-1 text-gray-500">vs mois dernier</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border shadow-sm">
        <Suspense fallback={<Loading />}>
          <RouteOptimizationContent />
        </Suspense>
      </div>
    </div>
  );
} 
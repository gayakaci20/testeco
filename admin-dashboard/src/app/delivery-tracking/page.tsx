import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';
import Loading from '../dashboard/loading';
import { Truck, MapPin, Clock, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
import { prisma } from '@/lib/prisma';

// Use dynamic import instead of direct import
const DeliveryTrackingContent = dynamicImport(() => import('./DeliveryTrackingContent'), {
  loading: () => <Loading />
});

export const metadata = {
  title: 'Suivi des Livraisons - EcoDeli Admin',
  description: 'Suivez et gérez toutes les livraisons en temps réel',
};

// Force dynamic rendering for admin dashboard
export const dynamic = 'force-dynamic';

export default async function DeliveryTrackingPage() {
  // Fetch delivery stats from database
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [totalDeliveries, inTransitCount, deliveredToday, delaysCount] = await Promise.all([
    prisma.package.count(),
    prisma.package.count({ where: { status: 'IN_TRANSIT' } }),
    prisma.package.count({ where: { status: 'DELIVERED', updatedAt: { gte: startOfToday } } }),
    prisma.package.count({ 
      where: { 
        status: 'IN_TRANSIT',
        createdAt: { 
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Plus de 24h en transit
        }
      } 
    })
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Navigation className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Suivi des Livraisons</h1>
              <p className="mt-1 text-gray-600">Surveillez toutes vos livraisons en temps réel</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 font-medium text-emerald-700 bg-emerald-100 rounded-lg transition-colors duration-200 hover:bg-emerald-200">
              <MapPin className="mr-2 w-4 h-4" />
              Carte
            </button>
            <button className="inline-flex items-center px-6 py-3 font-medium text-white bg-emerald-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md">
              <Truck className="mr-2 w-5 h-5" />
              Nouvelle Livraison
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Livraisons Actives</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{totalDeliveries}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Truck className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-emerald-600">+5</span>
            <span className="ml-1 text-gray-500">depuis ce matin</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">En Transit</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{inTransitCount}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Navigation className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Temps moyen: 2h 15min</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Livrées Aujourd'hui</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{deliveredToday}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Retards</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">{delaysCount}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-orange-600">-2</span>
            <span className="ml-1 text-gray-500">vs hier</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border shadow-sm">
        <Suspense fallback={<Loading />}>
          <DeliveryTrackingContent />
        </Suspense>
      </div>
    </div>
  );
} 
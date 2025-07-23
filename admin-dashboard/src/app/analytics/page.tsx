'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Activity, RefreshCw, Calendar, Package, Star, Clock } from 'lucide-react';

interface AnalyticsData {
  users: {
    total: number;
    byRole: Record<string, number>;
    newThisMonth: number;
    growthRate: number;
  };
  services: {
    total: number;
    active: number;
    byCategory: Record<string, number>;
    averageRating: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    thisMonth: number;
    revenue: number;
  };
  packages: {
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
  };
  storageBoxes: {
    total: number;
    occupied: number;
    revenue: number;
    occupancyRate: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    bySource: Record<string, number>;
  };
  matches: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    thisMonth: number;
  };
  rides: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    thisMonth: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-4 border-blue-600 animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center">
          <BarChart3 className="mb-4 w-12 h-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-500">Impossible de charger les données</p>
          <p className="text-sm text-gray-400">Veuillez réessayer plus tard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Analytique</h1>
              <p className="mt-1 text-gray-600">Insights métier et métriques de performance</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 font-medium text-white bg-gray-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-gray-700 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
              <option value="1y">Dernière année</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires Total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.revenue.total.toFixed(0)}€</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className={`w-4 h-4 mr-1 ${analytics.revenue.growth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`font-medium ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.revenue.growth >= 0 ? '+' : ''}{analytics.revenue.growth.toFixed(1)}%
            </span>
            <span className="ml-1 text-gray-500">vs mois dernier</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs Total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.users.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-blue-600">+{analytics.users.newThisMonth}</span>
            <span className="ml-1 text-gray-500">nouveaux ce mois</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Services Actifs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.services.active}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <Star className="mr-1 w-4 h-4 text-yellow-500" />
            <span className="text-gray-500">Note moy: {analytics.services.averageRating.toFixed(1)}/5</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Réservations</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{analytics.bookings.thisMonth}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-purple-600">{analytics.bookings.completed}</span>
            <span className="ml-1 text-gray-500">terminées</span>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Distribution */}
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Distribution des Utilisateurs par Rôle</h2>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {Object.entries(analytics.users.byRole).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {role.toLowerCase().replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="overflow-hidden w-32 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 rounded-full transition-all duration-300" 
                      style={{ width: `${(count / analytics.users.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-sm font-bold text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Categories */}
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Services par Catégorie</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {Object.entries(analytics.services.byCategory).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {category.toLowerCase()}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="overflow-hidden w-32 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-600 rounded-full transition-all duration-300" 
                      style={{ width: `${(count / analytics.services.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-sm font-bold text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Sources */}
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Sources de Revenus</h2>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {Object.entries(analytics.revenue.bySource).map(([source, amount]) => (
              <div key={source} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {source.toLowerCase().replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="overflow-hidden w-32 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-yellow-600 rounded-full transition-all duration-300" 
                      style={{ width: `${(amount / analytics.revenue.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="w-16 text-sm font-bold text-gray-900">{amount.toFixed(0)}€</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Package Status */}
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Statut des Colis</h2>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 text-center bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.packages.delivered}</div>
              <div className="text-sm text-green-700">Livrés</div>
            </div>
            <div className="p-4 text-center bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.packages.inTransit}</div>
              <div className="text-sm text-blue-700">En Transit</div>
            </div>
            <div className="p-4 text-center bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{analytics.packages.pending}</div>
              <div className="text-sm text-yellow-700">En Attente</div>
            </div>
            <div className="p-4 text-center bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{analytics.packages.total}</div>
              <div className="text-sm text-gray-700">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Boîtes de Stockage</h3>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-medium">{analytics.storageBoxes.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Occupées</span>
              <span className="font-medium text-blue-600">{analytics.storageBoxes.occupied}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Taux d'occupation</span>
              <span className="font-medium text-green-600">{analytics.storageBoxes.occupancyRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenus</span>
              <span className="font-medium text-purple-600">{analytics.storageBoxes.revenue.toFixed(0)}€</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Correspondances</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-medium">{analytics.matches?.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Terminées</span>
              <span className="font-medium text-green-600">{analytics.matches?.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">En Attente</span>
              <span className="font-medium text-yellow-600">{analytics.matches?.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ce mois</span>
              <span className="font-medium text-blue-600">{analytics.matches?.thisMonth}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Trajets</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-medium">{analytics.rides?.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Terminés</span>
              <span className="font-medium text-green-600">{analytics.rides?.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">En Attente</span>
              <span className="font-medium text-yellow-600">{analytics.rides?.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ce mois</span>
              <span className="font-medium text-blue-600">{analytics.rides?.thisMonth}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
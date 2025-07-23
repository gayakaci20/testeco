'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface RouteOptimization {
  id: string;
  carrierId: string;
  carrierName: string;
  date: string;
  status: 'PENDING' | 'OPTIMIZED' | 'IN_PROGRESS' | 'COMPLETED';
  originalDistance: number;
  optimizedDistance: number;
  timeSaved: number;
  fuelSaved: number;
  deliveries: Array<{
    id: string;
    packageTitle: string;
    address: string;
    estimatedTime: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    order: number;
  }>;
  optimizationScore: number;
}

interface OptimizationStats {
  totalRoutes: number;
  routesOptimized: number;
  avgTimeSaved: number;
  avgFuelSaved: number;
  totalDistanceReduced: number;
  co2Reduced: number;
}

function formatDate(date: string) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

export default function RouteOptimizationContent() {
  const [routes, setRoutes] = useState<RouteOptimization[]>([]);
  const [stats, setStats] = useState<OptimizationStats>({
    totalRoutes: 0,
    routesOptimized: 0,
    avgTimeSaved: 0,
    avgFuelSaved: 0,
    totalDistanceReduced: 0,
    co2Reduced: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('routes');
  const [selectedRoute, setSelectedRoute] = useState<RouteOptimization | null>(null);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    fetchRouteData();
  }, []);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      
      // Mock data for route optimization
      const mockRoutes: RouteOptimization[] = [
        {
          id: '1',
          carrierId: 'carrier1',
          carrierName: 'Jean Dupont',
          date: new Date().toISOString(),
          status: 'OPTIMIZED',
          originalDistance: 85.5,
          optimizedDistance: 67.2,
          timeSaved: 35,
          fuelSaved: 12.8,
          optimizationScore: 92,
          deliveries: [
            { id: '1', packageTitle: 'Colis A', address: '123 Rue de Paris', estimatedTime: '09:00', priority: 'HIGH', order: 1 },
            { id: '2', packageTitle: 'Colis B', address: '456 Avenue Victor Hugo', estimatedTime: '10:30', priority: 'MEDIUM', order: 2 },
            { id: '3', packageTitle: 'Colis C', address: '789 Boulevard Saint-Germain', estimatedTime: '12:00', priority: 'LOW', order: 3 }
          ]
        },
        {
          id: '2',
          carrierId: 'carrier2',
          carrierName: 'Marie Martin',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'COMPLETED',
          originalDistance: 72.3,
          optimizedDistance: 58.1,
          timeSaved: 28,
          fuelSaved: 9.6,
          optimizationScore: 88,
          deliveries: [
            { id: '4', packageTitle: 'Colis D', address: '321 Rue de Rivoli', estimatedTime: '08:30', priority: 'HIGH', order: 1 },
            { id: '5', packageTitle: 'Colis E', address: '654 Place de la République', estimatedTime: '11:00', priority: 'MEDIUM', order: 2 }
          ]
        }
      ];

      setRoutes(mockRoutes);

      // Calculate stats
      const totalRoutes = mockRoutes.length;
      const routesOptimized = mockRoutes.filter(r => r.status === 'OPTIMIZED' || r.status === 'COMPLETED').length;
      const avgTimeSaved = mockRoutes.reduce((sum, r) => sum + r.timeSaved, 0) / totalRoutes;
      const avgFuelSaved = mockRoutes.reduce((sum, r) => sum + r.fuelSaved, 0) / totalRoutes;
      const totalDistanceReduced = mockRoutes.reduce((sum, r) => sum + (r.originalDistance - r.optimizedDistance), 0);

      setStats({
        totalRoutes,
        routesOptimized,
        avgTimeSaved,
        avgFuelSaved,
        totalDistanceReduced,
        co2Reduced: totalDistanceReduced * 0.12 // Estimation: 120g CO2/km saved
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'OPTIMIZED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'OPTIMIZED': return '🎯';
      case 'IN_PROGRESS': return '🚚';
      case 'COMPLETED': return '✅';
      default: return '⚪';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const optimizeRoute = async (routeId: string) => {
    setOptimizing(true);
    try {
      // Mock optimization process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update route status
      setRoutes(prevRoutes => 
        prevRoutes.map(route => 
          route.id === routeId 
            ? { ...route, status: 'OPTIMIZED' as const, optimizationScore: Math.floor(Math.random() * 20) + 80 }
            : route
        )
      );
      
      alert('Route optimisée avec succès!');
    } catch (error) {
      console.error('Error optimizing route:', error);
      alert('Erreur lors de l\'optimisation de la route');
    } finally {
      setOptimizing(false);
    }
  };

  const openRouteDetails = (route: RouteOptimization) => {
    setSelectedRoute(route);
    setShowOptimizationModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'routes', label: 'Routes', icon: '🗺️' },
    { id: 'analytics', label: 'Analytiques', icon: '📊' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center">
            <div className="p-3 bg-blue-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-100">Routes Optimisées</p>
              <p className="text-3xl font-bold">{stats.routesOptimized}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center">
            <div className="p-3 bg-green-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-100">Temps Économisé</p>
              <p className="text-3xl font-bold">{stats.avgTimeSaved.toFixed(0)}min</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-100">Carburant Économisé</p>
              <p className="text-3xl font-bold">{stats.avgFuelSaved.toFixed(1)}L</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center">
            <div className="p-3 bg-purple-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-100">CO₂ Réduit</p>
              <p className="text-3xl font-bold">{stats.co2Reduced.toFixed(1)}kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-green-100 rounded-lg mr-3">
            <span className="text-2xl">🌱</span>
          </div>
          <h3 className="text-lg font-medium text-green-900">Impact Environnemental</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.totalDistanceReduced.toFixed(1)} km</div>
            <div className="text-sm text-green-700">Distance réduite</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.co2Reduced.toFixed(1)} kg</div>
            <div className="text-sm text-green-700">CO₂ évité</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{(stats.avgFuelSaved * stats.routesOptimized).toFixed(1)} L</div>
            <div className="text-sm text-green-700">Carburant économisé</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Routes Tab */}
        {activeTab === 'routes' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporteur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Économies</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                            <span className="text-sky-600 font-medium">🚚</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{route.carrierName}</div>
                          <div className="text-sm text-gray-500">{route.deliveries.length} livraisons</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(route.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                        <span className="mr-1">{getStatusIcon(route.status)}</span>
                        {route.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="line-through text-gray-400">{route.originalDistance} km</span>
                        <span className="text-green-600 font-medium">{route.optimizedDistance} km</span>
                      </div>
                      <div className="text-xs text-green-600">
                        -{((route.originalDistance - route.optimizedDistance) / route.originalDistance * 100).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-green-600">{route.timeSaved} min</div>
                      <div className="text-green-600">{route.fuelSaved} L</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${route.optimizationScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{route.optimizationScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openRouteDetails(route)}
                        className="text-sky-600 hover:text-sky-900"
                      >
                        Détails
                      </button>
                      {route.status === 'PENDING' && (
                        <button
                          onClick={() => optimizeRoute(route.id)}
                          disabled={optimizing}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {optimizing ? 'Optimisation...' : 'Optimiser'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Efficacité des Optimisations</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taux d'optimisation:</span>
                    <span className="font-medium text-green-600">
                      {stats.totalRoutes > 0 ? ((stats.routesOptimized / stats.totalRoutes) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Réduction moyenne distance:</span>
                    <span className="font-medium">18.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Économies de temps:</span>
                    <span className="font-medium">{stats.avgTimeSaved.toFixed(0)} min/route</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Impact Économique</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Économies carburant:</span>
                    <span className="font-medium text-green-600">€{(stats.avgFuelSaved * 1.5 * stats.routesOptimized).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gain productivité:</span>
                    <span className="font-medium text-green-600">€{(stats.avgTimeSaved * 0.5 * stats.routesOptimized).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total économisé:</span>
                    <span className="font-medium text-green-600 text-lg">€{((stats.avgFuelSaved * 1.5 + stats.avgTimeSaved * 0.5) * stats.routesOptimized).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-6">
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Paramètres d'Optimisation</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Algorithme d'optimisation
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent">
                    <option value="genetic">Algorithme Génétique</option>
                    <option value="simulated_annealing">Recuit Simulé</option>
                    <option value="ant_colony">Colonie de Fourmis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité d'optimisation
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" name="priority" value="distance" className="mr-2" defaultChecked />
                      <span>Minimiser la distance</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="priority" value="time" className="mr-2" />
                      <span>Minimiser le temps</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="priority" value="fuel" className="mr-2" />
                      <span>Minimiser la consommation</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraintes de livraison
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span>Respecter les créneaux horaires</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span>Prioriser les livraisons urgentes</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Éviter les zones de trafic dense</span>
                    </label>
                  </div>
                </div>

                <button className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 transition-colors">
                  Sauvegarder les Paramètres
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Route Details Modal */}
      {showOptimizationModal && selectedRoute && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Détails de la Route - {selectedRoute.carrierName}
              </h3>
              <button
                onClick={() => setShowOptimizationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Route Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Distance originale:</span>
                    <div className="font-medium">{selectedRoute.originalDistance} km</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Distance optimisée:</span>
                    <div className="font-medium text-green-600">{selectedRoute.optimizedDistance} km</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Temps économisé:</span>
                    <div className="font-medium text-green-600">{selectedRoute.timeSaved} min</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Score d'optimisation:</span>
                    <div className="font-medium">{selectedRoute.optimizationScore}%</div>
                  </div>
                </div>
              </div>

              {/* Delivery List */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Ordre de Livraison Optimisé</h4>
                <div className="space-y-3">
                  {selectedRoute.deliveries
                    .sort((a, b) => a.order - b.order)
                    .map((delivery, index) => (
                    <div key={delivery.id} className="flex items-center p-3 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-sky-600 font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{delivery.packageTitle}</div>
                            <div className="text-sm text-gray-500">{delivery.address}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{delivery.estimatedTime}</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(delivery.priority)}`}>
                              {delivery.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
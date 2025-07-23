'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import ExportCSVButton from '@/components/ExportCSVButton'

interface Carrier {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isOnline?: boolean;
  lastActiveAt?: string;
  isVerified: boolean;
  createdAt: string;
  _count?: {
    ridesAsCarrier: number;
    deliveries: number;
  };
  totalEarnings?: number;
  rating?: number;
}

interface Match {
  id: string;
  status: string;
  price: number;
  createdAt: string;
  package: {
    id: string;
    description: string;
    senderAddress: string;
    recipientAddress: string;
    senderName: string;
    recipientName: string;
    sender?: {
      firstName?: string;
      lastName?: string;
    };
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
  ride: {
    carrier?: {
      firstName?: string;
      lastName?: string;
    };
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

function formatDate(date: string) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

// Safe function to get user initials
function getUserInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '?';
  const last = lastName?.charAt(0)?.toUpperCase() || '?';
  return `${first}${last}`;
}

export default function CarriersContent() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('carriers');
  const [stats, setStats] = useState({
    totalCarriers: 0,
    onlineCarriers: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    fetchCarriersData();
  }, []);

  const fetchCarriersData = async () => {
    try {
      setLoading(true);
      
      // Fetch carriers
      const carriersResponse = await fetch('/api/users?role=CARRIER');
      if (!carriersResponse.ok) {
        throw new Error('Failed to fetch carriers');
      }
      const carriersData = await carriersResponse.json();
      setCarriers(carriersData);

      // Fetch active deliveries
      const deliveriesResponse = await fetch('/api/matches?status=IN_TRANSIT,CONFIRMED');
      if (deliveriesResponse.ok) {
        const deliveriesData = await deliveriesResponse.json();
        setActiveDeliveries(deliveriesData);
      }

      // Calculate statistics
      const onlineCount = carriersData.filter((c: Carrier) => c.isOnline).length;
      const totalEarnings = carriersData.reduce((sum: number, c: Carrier) => sum + (c.totalEarnings || 0), 0);
      
      setStats({
        totalCarriers: carriersData.length,
        onlineCarriers: onlineCount,
        activeDeliveries: activeDeliveries.length || 0,
        completedDeliveries: 0, // This would come from a separate API call
        totalEarnings: totalEarnings
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleCarrierStatus = async (carrierId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/carriers/${carrierId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline: !currentStatus }),
      });

      if (response.ok) {
        // Refresh data
        fetchCarriersData();
      } else {
        alert('Failed to update carrier status');
      }
    } catch (error) {
      console.error('Error updating carrier status:', error);
      alert('Error updating carrier status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-32 h-32 rounded-full border-b-2 border-sky-600 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'carriers', label: 'Transporteurs', count: stats.totalCarriers },
    { id: 'deliveries', label: 'Livraisons Actives', count: stats.activeDeliveries },
    { id: 'stats', label: 'Statistiques', count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <ExportCSVButton data={carriers} fileName="carriers.csv" />
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        <div className="p-6 text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 bg-blue-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-100">Total Transporteurs</p>
              <p className="text-3xl font-bold">{stats.totalCarriers}</p>
            </div>
          </div>
        </div>

        <div className="p-6 text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 bg-green-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-100">En Ligne</p>
              <p className="text-3xl font-bold">{stats.onlineCarriers}</p>
            </div>
          </div>
        </div>

        <div className="p-6 text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 bg-orange-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-100">Livraisons Actives</p>
              <p className="text-3xl font-bold">{stats.activeDeliveries}</p>
            </div>
          </div>
        </div>

        <div className="p-6 text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 bg-purple-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-100">Livraisons Complétées</p>
              <p className="text-3xl font-bold">{stats.completedDeliveries}</p>
            </div>
          </div>
        </div>

        <div className="p-6 text-white bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-100">Revenus Totaux</p>
              <p className="text-3xl font-bold">€{stats.totalEarnings.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'carriers' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Transporteur</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Dernière Activité</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Trajets</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Note</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carriers.map((carrier) => (
                  <tr key={carrier.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="flex justify-center items-center w-10 h-10 bg-sky-100 rounded-full">
                            <span className="font-medium text-sky-600">
                              {getUserInitials(carrier.firstName, carrier.lastName)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {carrier.firstName || 'N/A'} {carrier.lastName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {carrier.isVerified ? '✅ Vérifié' : '❌ Non vérifié'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{carrier.email}</div>
                      <div className="text-sm text-gray-500">{carrier.phoneNumber || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        carrier.isOnline 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {carrier.isOnline ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {carrier.lastActiveAt ? formatDate(carrier.lastActiveAt) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {carrier._count?.ridesAsCarrier || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {carrier.rating ? `⭐ ${carrier.rating.toFixed(1)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => toggleCarrierStatus(carrier.id, carrier.isOnline || false)}
                        className={`mr-2 px-3 py-1 rounded text-xs ${
                          carrier.isOnline
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {carrier.isOnline ? 'Mettre hors ligne' : 'Mettre en ligne'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Colis</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Expéditeur</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Transporteur</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Trajet</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Prix</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeDeliveries.map((delivery) => {
                  const sender = (delivery.package.sender || delivery.package.user || {}) as { firstName?: string; lastName?: string };
                  const carrier = (delivery.ride.carrier || delivery.ride.user || {}) as { firstName?: string; lastName?: string };
                  return (
                    <tr key={delivery.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{delivery.package.description}</div>
                        <div className="text-sm text-gray-500">#{delivery.package.id.slice(-8)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {sender.firstName ?? 'N/A'} {sender.lastName ?? ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {carrier.firstName ?? 'N/A'} {carrier.lastName ?? ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{delivery.package.senderAddress}</div>
                        <div className="text-sm text-gray-500">→ {delivery.package.recipientAddress}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          delivery.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          delivery.status === 'IN_TRANSIT' ? 'bg-yellow-100 text-yellow-800' :
                          delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        €{delivery.price}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(delivery.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="mb-4 text-lg font-medium text-gray-900">Statistiques des Transporteurs</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taux d'activité:</span>
                    <span className="font-medium">
                      {stats.totalCarriers > 0 ? ((stats.onlineCarriers / stats.totalCarriers) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Livraisons en cours:</span>
                    <span className="font-medium">{stats.activeDeliveries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenus moyens:</span>
                    <span className="font-medium">
                      €{stats.totalCarriers > 0 ? (stats.totalEarnings / stats.totalCarriers).toFixed(0) : 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="mb-4 text-lg font-medium text-gray-900">Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Efficacité des livraisons:</span>
                    <span className="font-medium">95.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temps moyen de livraison:</span>
                    <span className="font-medium">2.3h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Satisfaction client:</span>
                    <span className="font-medium">⭐ 4.7/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
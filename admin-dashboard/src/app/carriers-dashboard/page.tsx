'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Carrier {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  vehicleType?: string;
  vehicleRegistration?: string;
  isOnline: boolean;
  isActive: boolean;
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
  lastActiveAt: string;
}
  
interface Delivery {
  id: string;
  carrierId: string;
  packageId: string;
  status: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
  package: {
    id: string;
    description: string;
    weight: number;
    dimensions: string;
    sender: {
      firstName: string;
      lastName: string;
    };
    recipient: {
      firstName: string;
      lastName: string;
      phoneNumber?: string;
    };
  };
  carrier: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  };
}

interface DeliveryMetrics {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  activeCarriers: number;
  totalCarriers: number;
}

// Fonction utilitaire pour tronquer le texte
function truncateText(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function CarriersDashboardPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [metrics, setMetrics] = useState<DeliveryMetrics>({
    totalDeliveries: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    averageDeliveryTime: 0,
    onTimeDeliveryRate: 0,
    activeCarriers: 0,
    totalCarriers: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    // Set up real-time updates
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [carriersRes, deliveriesRes, metricsRes] = await Promise.all([
        fetch('/api/carriers'),
        fetch('/api/deliveries'),
        fetch('/api/deliveries/metrics')
      ]);

      if (carriersRes.ok) {
        const carriersData = await carriersRes.json();
        setCarriers(carriersData);
      }

      if (deliveriesRes.ok) {
        const deliveriesData = await deliveriesRes.json();
        setDeliveries(deliveriesData);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarrierDetails = async (carrierId: string) => {
    try {
      const response = await fetch(`/api/carriers/${carrierId}`);
      if (response.ok) {
        const carrierDetails = await response.json();
        setSelectedCarrier(carrierDetails);
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching carrier details:', error);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setDeliveries(deliveries.map(delivery => 
          delivery.id === deliveryId 
            ? { ...delivery, status: newStatus as any }
            : delivery
        ));
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  const toggleCarrierStatus = async (carrierId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/carriers/${carrierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setCarriers(carriers.map(carrier => 
          carrier.id === carrierId 
            ? { ...carrier, isActive }
            : carrier
        ));
      }
    } catch (error) {
      console.error('Error updating carrier status:', error);
    }
  };

  const assignDelivery = async (deliveryId: string, carrierId: string) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ carrierId }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error assigning delivery:', error);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCarrier(null);
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    const matchesCarrier = carrierFilter === 'all' || delivery.carrierId === carrierFilter;
    const matchesSearch = 
      delivery.package.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.package.sender.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.package.recipient.firstName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesCarrier && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED: 'bg-blue-100 text-blue-800',
      PICKED_UP: 'bg-yellow-100 text-yellow-800',
      IN_TRANSIT: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.ASSIGNED;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCarrierStatusIcon = (carrier: Carrier) => {
    if (!carrier.isActive) return '🔴'; // Inactive
    if (carrier.isOnline) return '🟢'; // Online
    return '🟡'; // Offline but active
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-32 h-32 rounded-full border-b-2 border-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Carriers Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor carrier performance and delivery operations</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Active Carriers</h3>
          <div className="text-2xl font-bold text-green-600">
            {metrics.activeCarriers}/{metrics.totalCarriers}
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Pending Deliveries</h3>
          <div className="text-2xl font-bold text-yellow-600">{metrics.pendingDeliveries}</div>
        </div>
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Completed Today</h3>
          <div className="text-2xl font-bold text-blue-600">{metrics.completedDeliveries}</div>
        </div>
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-gray-500">On-Time Rate</h3>
          <div className="text-2xl font-bold text-purple-600">{metrics.onTimeDeliveryRate}%</div>
        </div>
      </div>

      {/* Carriers Overview */}
      <div className="mb-8 bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Carriers</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {carriers.filter(c => c.isActive).map((carrier) => (
              <div key={carrier.id} className="p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCarrierStatusIcon(carrier)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {carrier.firstName} {carrier.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{carrier.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchCarrierDetails(carrier.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Rating:</span>
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1">{carrier.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Deliveries:</span>
                    <p className="text-gray-600">{carrier.completedDeliveries}/{carrier.totalDeliveries}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Vehicle:</span>
                    <p className="text-gray-600">
                      {carrier.vehicleType} {carrier.vehicleRegistration && `(${carrier.vehicleRegistration})`}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Last active: {formatDate(carrier.lastActiveAt)}
                    </span>
                    <button
                      onClick={() => toggleCarrierStatus(carrier.id, !carrier.isActive)}
                      className={`px-2 py-1 rounded text-xs ${
                        carrier.isActive 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {carrier.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {carriers.filter(c => c.isActive).length === 0 && (
            <div className="py-8 text-center">
              <div className="text-gray-500">No active carriers found.</div>
            </div>
          )}
        </div>
      </div>

      {/* Deliveries Management */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Delivery Management</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="mr-2 text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-md border border-gray-300"
                >
                  <option value="all">All Status</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="mr-2 text-sm font-medium text-gray-700">Carrier:</label>
                <select
                  value={carrierFilter}
                  onChange={(e) => setCarrierFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-md border border-gray-300"
                >
                  <option value="all">All Carriers</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.firstName} {carrier.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search deliveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 w-full text-sm rounded-md border border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Package
                </th>
                <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Route
                </th>
                <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Carrier
                </th>
                <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Estimated Delivery
                </th>
                <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 max-w-xs">
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate" title={delivery.package.description}>
                        {truncateText(delivery.package.description, 20)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {delivery.package.weight}kg - {truncateText(delivery.package.dimensions, 10)}
                      </div>
                      <div className="text-xs text-gray-400 truncate" title={`From: ${delivery.package.sender.firstName} ${delivery.package.sender.lastName}`}>
                        From: {truncateText(`${delivery.package.sender.firstName} ${delivery.package.sender.lastName}`, 15)}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-xs">
                    <div className="text-xs text-gray-900">
                      <div className="mb-1 truncate" title={delivery.pickupAddress}>
                        📍 {truncateText(delivery.pickupAddress, 20)}
                      </div>
                      <div className="truncate" title={delivery.deliveryAddress}>
                        🎯 {truncateText(delivery.deliveryAddress, 20)}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-xs">
                    <div className="text-sm text-gray-900 truncate" title={`${delivery.carrier.firstName} ${delivery.carrier.lastName}`}>
                      {truncateText(`${delivery.carrier.firstName} ${delivery.carrier.lastName}`, 20)}
                    </div>
                    {delivery.carrier.phoneNumber && (
                      <div className="text-xs text-gray-500 truncate" title={delivery.carrier.phoneNumber}>
                        {truncateText(delivery.carrier.phoneNumber, 15)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                      {delivery.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    <div className="text-gray-900">
                      {delivery.estimatedDeliveryTime 
                        ? format(new Date(delivery.estimatedDeliveryTime), 'dd/MM/yy HH:mm')
                        : 'Not set'
                      }
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">
                    <div className="flex flex-col gap-1 lg:flex-row lg:gap-2">
                      {delivery.status === 'ASSIGNED' && (
                        <button
                          onClick={() => updateDeliveryStatus(delivery.id, 'PICKED_UP')}
                          className="px-2 py-1 text-xs text-white bg-yellow-600 rounded hover:bg-yellow-700"
                          title="Mark as Picked Up"
                        >
                          Picked Up
                        </button>
                      )}
                      {delivery.status === 'PICKED_UP' && (
                        <button
                          onClick={() => updateDeliveryStatus(delivery.id, 'IN_TRANSIT')}
                          className="px-2 py-1 text-xs text-white bg-purple-600 rounded hover:bg-purple-700"
                          title="Mark In Transit"
                        >
                          In Transit
                        </button>
                      )}
                      {delivery.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => updateDeliveryStatus(delivery.id, 'DELIVERED')}
                          className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                          title="Mark as Delivered"
                        >
                          Delivered
                        </button>
                      )}
                      <button
                        className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                        title="Track Package"
                      >
                        Track
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDeliveries.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-gray-500">No deliveries found matching your criteria.</div>
          </div>
        )}
      </div>

      {/* Carrier Details Modal */}
      {selectedCarrier && isDetailsModalOpen && (
        <div className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-center w-full h-full bg-gray-600 bg-opacity-50">
          <div className="relative mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Carrier Details - {selectedCarrier.firstName} {selectedCarrier.lastName}
              </h3>
              <button 
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Carrier Information */}
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">
                        {selectedCarrier.firstName} {selectedCarrier.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedCarrier.email}</p>
                    </div>
                    {selectedCarrier.phoneNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm text-gray-900">{selectedCarrier.phoneNumber}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCarrierStatusIcon(selectedCarrier)}</span>
                        <span className="text-sm text-gray-900">
                          {selectedCarrier.isOnline ? 'Online' : 'Offline'} 
                          {!selectedCarrier.isActive && ' (Inactive)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Vehicle Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                      <p className="text-sm text-gray-900">{selectedCarrier.vehicleType || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Registration</label>
                      <p className="text-sm text-gray-900">{selectedCarrier.vehicleRegistration || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rating</label>
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 text-sm text-gray-900">{selectedCarrier.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Deliveries</label>
                      <p className="text-sm text-gray-900">{selectedCarrier.totalDeliveries}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Completed Deliveries</label>
                      <p className="text-sm text-gray-900">{selectedCarrier.completedDeliveries}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Success Rate</label>
                      <p className="text-sm text-gray-900">
                        {selectedCarrier.totalDeliveries > 0 
                          ? Math.round((selectedCarrier.completedDeliveries / selectedCarrier.totalDeliveries) * 100)
                          : 0
                        }%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Activity */}
              <div className="space-y-6">
                {selectedCarrier.currentLocation && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="mb-3 font-semibold text-gray-900">Current Location</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="text-sm text-gray-900">{selectedCarrier.currentLocation.address}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Latitude</label>
                          <p className="text-sm text-gray-900">{selectedCarrier.currentLocation.latitude}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Longitude</label>
                          <p className="text-sm text-gray-900">{selectedCarrier.currentLocation.longitude}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Activity History</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Joined</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedCarrier.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Active</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedCarrier.lastActiveAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Deliveries */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Recent Deliveries</h4>
                  <div className="overflow-y-auto space-y-2 max-h-40">
                    {deliveries
                      .filter(d => d.carrierId === selectedCarrier.id)
                      .slice(0, 5)
                      .map((delivery) => (
                        <div key={delivery.id} className="p-2 bg-white rounded border">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{delivery.package.description}</span>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(delivery.status)}`}>
                              {delivery.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(delivery.createdAt)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button 
                onClick={closeDetailsModal}
                className="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => toggleCarrierStatus(selectedCarrier.id, !selectedCarrier.isActive)}
                className={`px-4 py-2 rounded text-white ${
                  selectedCarrier.isActive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedCarrier.isActive ? 'Deactivate Carrier' : 'Activate Carrier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
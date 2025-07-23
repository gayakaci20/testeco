'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Star, TrendingUp, CheckCircle, AlertCircle, Search, Filter, RefreshCw, MapPin, Phone, Mail, Package, Box } from 'lucide-react';
import ExportCSVButton from '@/components/ExportCSVButton'

interface Booking {
  id: string;
  type?: 'service' | 'storage'; // Added type field
  serviceId: string;
  customerId: string;
  providerId: string;
  scheduledAt: string;
  duration: number | null;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  notes: string | null;
  address: string | null;
  rating: number | null;
  review: string | null;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  } | null;
  // Storage-specific fields
  box?: {
    id: string;
    code: string;
    location: string;
    size: string;
    pricePerDay: number;
  };
  boxId?: string;
  startDate?: string;
  endDate?: string;
  totalCost?: number;
  accessCode?: string;
  isActive?: boolean;
  itemName?: string;
  itemType?: string;
  customerName?: string;
  providerName?: string;
  statusLabel?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // Added type filter
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/all-reservations'); // Changed to all-reservations
      if (response.ok) {
        const result = await response.json();
        // Extract the data array from the API response
        const data = result.data || result;
        // Ensure data is an array
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          console.error('API did not return an array:', result);
          setBookings([]);
        }
      } else {
        console.error('Failed to fetch bookings:', response.status);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Alternative function that bypasses API and uses list data directly
  const showBookingDetailsDirectly = (bookingId: string) => {
    console.log('Showing booking details directly for ID:', bookingId);
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      console.log('Found booking directly:', booking);
      setSelectedBooking(booking);
      setIsDetailsModalOpen(true);
    } else {
      console.error('Booking not found in list:', bookingId);
    }
  };

  const fetchBookingDetails = async (bookingId: string) => {
    console.log('Fetching booking details for ID:', bookingId);
    console.log('Current bookings array:', bookings);
    console.log('Bookings length:', bookings.length);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const bookingDetails = await response.json();
        console.log('Booking details received:', bookingDetails);
        setSelectedBooking(bookingDetails);
        setIsDetailsModalOpen(true);
      } else {
        console.error('Failed to fetch booking details:', response.status);
        // Fallback: use the booking from the list
        console.log('Looking for booking with ID:', bookingId, 'in bookings:', bookings.map(b => b.id));
        const fallbackBooking = bookings.find(b => b.id === bookingId);
        console.log('Fallback booking found:', fallbackBooking);
        if (fallbackBooking) {
          console.log('Using fallback booking data:', fallbackBooking);
          setSelectedBooking(fallbackBooking);
          setIsDetailsModalOpen(true);
        } else {
          console.error('No fallback booking found for ID:', bookingId);
        }
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      // Fallback: use the booking from the list
      console.log('Error fallback - Looking for booking with ID:', bookingId);
      const fallbackBooking = bookings.find(b => b.id === bookingId);
      console.log('Error fallback booking found:', fallbackBooking);
      if (fallbackBooking) {
        console.log('Using fallback booking data after error:', fallbackBooking);
        setSelectedBooking(fallbackBooking);
        setIsDetailsModalOpen(true);
      } else {
        console.error('No error fallback booking found for ID:', bookingId);
      }
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      const endpoint = booking?.type === 'storage' ? `/api/box-rentals/${bookingId}` : `/api/bookings/${bookingId}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          // For storage, map status to isActive
          ...(booking?.type === 'storage' && {
            isActive: newStatus === 'IN_PROGRESS' || newStatus === 'CONFIRMED'
          })
        }),
      });

      if (response.ok) {
        setBookings(bookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus as any }
            : booking
        ));
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, status: newStatus as any });
        }
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedBooking(null);
  };

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesType = typeFilter === 'all' || booking.type === typeFilter;
    
    const today = new Date();
    const bookingDate = new Date(booking.scheduledAt);
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'today' && bookingDate.toDateString() === today.toDateString()) ||
      (dateFilter === 'week' && bookingDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && bookingDate >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));
    
    const matchesSearch = 
      booking.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.provider?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.provider?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.box?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.box?.location?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesDate && matchesSearch && matchesType;
  }) : [];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Attente' },
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmé' },
      IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Cours' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Terminé' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulé' },
      REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Remboursé' },
    };
    
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate stats - ensure bookings is an array
  const bookingsArray = Array.isArray(bookings) ? bookings : [];
  const completedBookings = bookingsArray.filter(b => b.status === 'COMPLETED').length;
  const pendingBookings = bookingsArray.filter(b => b.status === 'PENDING').length;
  const serviceBookings = bookingsArray.filter(b => b.type === 'service' || !b.type).length;
  const storageBookings = bookingsArray.filter(b => b.type === 'storage').length;
  const totalRevenue = bookingsArray
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.totalAmount || b.totalCost || 0), 0);
  const averageRating = bookingsArray.length > 0 
    ? bookingsArray.filter(b => b.rating).reduce((sum, b) => sum + (b.rating || 0), 0) / bookingsArray.filter(b => b.rating).length 
    : 0;

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-600 animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Réservations</h1>
              <p className="mt-1 text-gray-600">Administrez toutes les réservations de services</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <ExportCSVButton data={bookings} fileName="bookings.csv" />
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 font-medium text-white bg-indigo-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Réservations</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{bookingsArray.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <div className="text-xs text-gray-500">
              <span className="text-blue-600 font-medium">{serviceBookings} services</span> • 
              <span className="text-orange-600 font-medium"> {storageBookings} stockage</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">{pendingBookings}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Nécessitent une attention</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{completedBookings}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">{bookingsArray.length > 0 ? Math.round((completedBookings / bookingsArray.length) * 100) : 0}%</span>
            <span className="ml-1 text-gray-500">taux de réussite</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Boîtes de Stockage</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">{storageBookings}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Box className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Locations actives</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{totalRevenue.toFixed(0)}€</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Services + Stockage</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Search className="inline mr-1 w-4 h-4" />
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Rechercher par service, client ou prestataire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="w-full lg:w-48">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Package className="inline mr-1 w-4 h-4" />
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="service">Services</option>
              <option value="storage">Stockage</option>
            </select>
          </div>
          <div className="w-full lg:w-48">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Filter className="inline mr-1 w-4 h-4" />
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="PENDING">En Attente</option>
              <option value="CONFIRMED">Confirmé</option>
              <option value="IN_PROGRESS">En Cours</option>
              <option value="COMPLETED">Terminé</option>
              <option value="CANCELLED">Annulé</option>
              <option value="REFUNDED">Remboursé</option>
            </select>
          </div>
          <div className="w-full lg:w-48">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Calendar className="inline mr-1 w-4 h-4" />
              Période
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Liste des Réservations ({filteredBookings.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Calendar className="inline mr-1 w-4 h-4" />
                  Réservation
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Type / Détails
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Users className="inline mr-1 w-4 h-4" />
                  Client
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Prestataire / Info
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Clock className="inline mr-1 w-4 h-4" />
                  Date & Heure
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Montant
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar className="mb-4 w-12 h-12 text-gray-400" />
                      <p className="text-lg font-medium text-gray-500">Aucune réservation trouvée</p>
                      <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="transition-colors duration-150 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="font-mono text-xs text-gray-400">ID: {booking.id.slice(0, 8)}...</div>
                        <div className="mt-1 text-xs text-gray-500">
                          Créé le {formatDate(booking.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        {booking.type === 'storage' ? (
                          <>
                            <div className="flex items-center text-sm font-medium text-orange-600">
                              <Box className="w-4 h-4 mr-1" />
                              Boîte de Stockage
                            </div>
                            <div className="text-xs text-gray-900">{booking.box?.code}</div>
                            <div className="text-xs text-gray-500">{booking.box?.location}</div>
                            <div className="text-xs text-blue-600">{booking.box?.pricePerDay}€/jour</div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center text-sm font-medium text-blue-600">
                              <Package className="w-4 h-4 mr-1" />
                              Service
                            </div>
                            <div className="text-xs text-gray-900">{booking.service?.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{booking.service?.category.toLowerCase()}</div>
                            <div className="text-xs text-blue-600">{booking.service?.price}€</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.customer?.firstName} {booking.customer?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{booking.customer?.email}</div>
                        {booking.customer?.phoneNumber && (
                          <div className="text-xs text-blue-600">{booking.customer?.phoneNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        {booking.type === 'storage' ? (
                          <>
                            <div className="text-sm font-medium text-orange-600">{booking.providerName}</div>
                            <div className="text-xs text-gray-500">Taille: {booking.box?.size}</div>
                            {booking.provider?.email && (
                              <div className="text-xs text-gray-500">{booking.provider.email}</div>
                            )}
                            {booking.accessCode && (
                              <div className="text-xs text-green-600">Code: {booking.accessCode}</div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.provider?.firstName} {booking.provider?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{booking.provider?.email}</div>
                            {booking.provider?.phoneNumber && (
                              <div className="text-xs text-blue-600">{booking.provider?.phoneNumber}</div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.scheduledAt || booking.startDate || booking.createdAt)}
                      </div>
                      {booking.type === 'storage' ? (
                        booking.endDate && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="mr-1 w-3 h-3" />
                            Fin: {formatDate(booking.endDate)}
                          </div>
                        )
                      ) : (
                        booking.duration && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="mr-1 w-3 h-3" />
                            {booking.duration}min
                          </div>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(booking.totalAmount || booking.totalCost || 0).toFixed(2)}€
                      </div>
                      {booking.rating && (
                        <div className="flex items-center mt-1">
                          <Star className="mr-1 w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-gray-500">{booking.rating}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => showBookingDetailsDirectly(booking.id)}
                          className="inline-flex items-center px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md transition-colors duration-150 hover:bg-blue-200"
                        >
                          Voir Détails
                        </button>
                        {booking.status === 'PENDING' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                            className="inline-flex items-center px-3 py-1 text-xs text-green-700 bg-green-100 rounded-md transition-colors duration-150 hover:bg-green-200"
                          >
                            Confirmer
                          </button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'IN_PROGRESS')}
                            className="inline-flex items-center px-3 py-1 text-xs text-purple-700 bg-purple-100 rounded-md transition-colors duration-150 hover:bg-purple-200"
                          >
                            Démarrer
                          </button>
                        )}
                        {booking.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                            className="inline-flex items-center px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md transition-colors duration-150 hover:bg-blue-200"
                          >
                            Terminer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredBookings.length > 0 && (
          <div className="flex justify-between items-center px-6 py-3 bg-white border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-700">
              <span className="font-medium">{filteredBookings.length}</span>
              <span className="ml-1">réservation{filteredBookings.length > 1 ? 's' : ''} trouvée{filteredBookings.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm text-gray-700 bg-white rounded-md border border-gray-300 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50">
                Précédent
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">Page 1</span>
              <button className="px-3 py-1 text-sm text-gray-700 bg-white rounded-md border border-gray-300 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50">
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && isDetailsModalOpen && (
        <div className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-center w-full h-full bg-gray-600 bg-opacity-50">
          <div className="relative mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
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
              {/* Booking Information */}
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Booking Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Booking ID</label>
                      <p className="font-mono text-sm text-gray-900">{selectedBooking.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service</label>
                      <p className="text-sm text-gray-900">{selectedBooking.service?.name}</p>
                      <p className="text-xs text-gray-500">{selectedBooking.service?.category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Scheduled Date & Time</label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedBooking.scheduledAt)}</p>
                    </div>
                    {selectedBooking.duration && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Duration</label>
                        <p className="text-sm text-gray-900">{selectedBooking.duration} minutes</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                      <p className="text-lg font-semibold text-gray-900">€{selectedBooking.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    {selectedBooking.address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Service Address</label>
                        <p className="text-sm text-gray-900">{selectedBooking.address}</p>
                      </div>
                    )}
                    {selectedBooking.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <p className="text-sm text-gray-900">{selectedBooking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review & Rating */}
                {(selectedBooking.rating || selectedBooking.review) && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="mb-3 font-semibold text-gray-900">Customer Review</h4>
                    <div className="space-y-3">
                      {selectedBooking.rating && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Rating</label>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < selectedBooking.rating! ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">({selectedBooking.rating}/5)</span>
                          </div>
                        </div>
                      )}
                      {selectedBooking.review && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Review</label>
                          <p className="text-sm text-gray-900">{selectedBooking.review}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer & Provider Information */}
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="mb-3 font-semibold text-gray-900">Customer Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedBooking.customer?.email}</p>
                    </div>
                    {selectedBooking.customer?.phoneNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm text-gray-900">{selectedBooking.customer?.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="mb-3 font-semibold text-gray-900">Service Provider</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.provider?.firstName} {selectedBooking.provider?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedBooking.provider?.email}</p>
                    </div>
                    {selectedBooking.provider?.phoneNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm text-gray-900">{selectedBooking.provider?.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Booking History</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedBooking.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedBooking.updatedAt)}</p>
                    </div>
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
              {selectedBooking.status === 'PENDING' && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'CONFIRMED')}
                  className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Confirm Booking
                </button>
              )}
              {selectedBooking.status === 'CONFIRMED' && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'IN_PROGRESS')}
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Mark In Progress
                </button>
              )}
              {selectedBooking.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'COMPLETED')}
                  className="px-4 py-2 text-white bg-purple-600 rounded hover:bg-purple-700"
                >
                  Mark Completed
                </button>
              )}
              {(selectedBooking.status === 'PENDING' || selectedBooking.status === 'CONFIRMED') && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'CANCELLED')}
                  className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
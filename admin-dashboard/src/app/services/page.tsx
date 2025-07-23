'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Plus, TrendingUp, Users, Star, Clock, Search, Filter, RefreshCw, MapPin, Phone, Mail, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import ExportCSVButton from '@/components/ExportCSVButton'

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  location: string;
  isActive: boolean;
  rating: number;
  totalRatings: number;
  requirements?: string;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  bookings?: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    customer: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceDetails = async (serviceId: string) => {
    console.log('Fetching service details for ID:', serviceId);
    
    // SOLUTION DIRECTE : Utiliser directement les données de la liste
    const service = services.find(s => s.id === serviceId);
    if (service) {
      console.log('Using service data directly:', service);
      // Créer un objet service sécurisé avec des données par défaut
      const safeService = {
        ...service,
        bookings: service.bookings || [],
        provider: {
          ...service.provider,
          firstName: service.provider?.firstName || 'Unknown',
          lastName: service.provider?.lastName || 'Provider',
          email: service.provider?.email || 'No email',
          phoneNumber: service.provider?.phoneNumber || undefined
        }
      };
      setSelectedService(safeService);
      setIsDetailsModalOpen(true);
      return;
    }

    // FALLBACK : Essayer l'API seulement si pas trouvé dans la liste
    try {
      const response = await fetch(`/api/services/${serviceId}`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const serviceDetails = await response.json();
        console.log('Service details received:', serviceDetails);
        setSelectedService(serviceDetails);
        setIsDetailsModalOpen(true);
      } else {
        console.error('Failed to fetch service details:', response.status);
        console.error('Service not found in list or API');
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setServices(services.map(service => 
          service.id === serviceId 
            ? { ...service, isActive: !currentStatus }
            : service
        ));
      }
    } catch (error) {
      console.error('Error updating service status:', error);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedService(null);
  };

  const filteredServices = services.filter(service => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && service.isActive) ||
      (filter === 'inactive' && !service.isActive);
    
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.provider.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.provider.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getCategoryBadge = (category: string) => {
    const categoryConfig: Record<string, { bg: string; text: string; label: string }> = {
      CLEANING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Nettoyage' },
      MAINTENANCE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Maintenance' },
      DELIVERY: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Livraison' },
      PERSONAL_CARE: { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Soins personnels' },
      TUTORING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Tutorat' },
      CONSULTING: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Conseil' },
      OTHER: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Autre' },
    };
    
    const config = categoryConfig[category] || categoryConfig.OTHER;
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

  // Safe function to get customer name from booking
  const getCustomerName = (booking: any) => {
    if (!booking) return 'Unknown Customer';
    if (booking.customer) {
      const firstName = booking.customer.firstName || '';
      const lastName = booking.customer.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown Customer';
    }
    if (booking.user) {
      const firstName = booking.user.firstName || '';
      const lastName = booking.user.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown Customer';
    }
    return 'Unknown Customer';
  };

  // Safe function to get booking date
  const getBookingDate = (booking: any) => {
    if (!booking) return 'No date';
    const dateField = booking.scheduledAt || booking.createdAt || booking.date;
    return dateField ? formatDate(dateField) : 'No date';
  };

  // Safe function to get booking status
  const getBookingStatus = (booking: any) => {
    return booking?.status || 'Unknown';
  };

  // Calculate stats
  const activeServices = services.filter(s => s.isActive).length;
  const totalBookings = services.reduce((sum, s) => sum + (s.bookings?.length || 0), 0);
  const averageRating = services.length > 0 
    ? services.reduce((sum, s) => sum + s.rating, 0) / services.length 
    : 0;

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-4 border-orange-600 animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Services</h1>
              <p className="mt-1 text-gray-600">Administrez tous les services de la plateforme</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ExportCSVButton data={services} fileName="services.csv" />
            <button
              onClick={fetchServices}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 font-medium text-white bg-gray-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-gray-700 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button className="inline-flex items-center px-6 py-3 font-medium text-white bg-orange-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-orange-700 hover:shadow-md">
              <Plus className="mr-2 w-5 h-5" />
              Nouveau Service
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{services.length}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="mr-1 w-4 h-4 text-green-500" />
            <span className="font-medium text-green-600">+15%</span>
            <span className="ml-1 text-gray-500">ce mois</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Services Actifs</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{activeServices}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">{services.length > 0 ? Math.round((activeServices / services.length) * 100) : 0}%</span>
            <span className="ml-1 text-gray-500">taux d'activation</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Réservations</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{totalBookings}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Total des réservations</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Note Moyenne</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">{averageRating.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <Star className="mr-1 w-4 h-4 text-yellow-500" />
            <span className="text-gray-500">sur 5 étoiles</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Search className="inline mr-1 w-4 h-4" />
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Rechercher par nom de service ou prestataire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Filter className="inline mr-1 w-4 h-4" />
              Statut
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tous les services</option>
              <option value="active">Services actifs</option>
              <option value="inactive">Services inactifs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Liste des Services ({filteredServices.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Settings className="inline mr-1 w-4 h-4" />
                  Service
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Users className="inline mr-1 w-4 h-4" />
                  Prestataire
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <MapPin className="inline mr-1 w-4 h-4" />
                  Lieu
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Prix & Durée
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Star className="inline mr-1 w-4 h-4" />
                  Évaluation
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
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Settings className="mb-4 w-12 h-12 text-gray-400" />
                      <p className="text-lg font-medium text-gray-500">Aucun service trouvé</p>
                      <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id} className="transition-colors duration-150 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        <div className="max-w-xs text-sm text-gray-500 truncate">{service.description}</div>
                        <div className="mt-1 font-mono text-xs text-gray-400">ID: {service.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {service.provider.firstName} {service.provider.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{service.provider.email}</div>
                        {service.provider.phoneNumber && (
                          <div className="text-xs text-blue-600">{service.provider.phoneNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(service.category)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs text-sm text-gray-900 truncate">{service.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{service.price}€</div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="mr-1 w-3 h-3" />
                          {service.duration}min
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="mr-1 w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-900">{service.rating}</span>
                        <span className="ml-1 text-xs text-gray-500">({service.totalRatings})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {service.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 w-3 h-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="mr-1 w-3 h-3" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => fetchServiceDetails(service.id)}
                          className="inline-flex items-center px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md transition-colors duration-150 hover:bg-blue-200"
                        >
                          Voir Détails
                        </button>
                        <button
                          onClick={() => toggleServiceStatus(service.id, service.isActive)}
                          className={`inline-flex items-center px-3 py-1 text-xs rounded-md transition-colors duration-150 ${
                            service.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {service.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredServices.length > 0 && (
          <div className="flex justify-between items-center px-6 py-3 bg-white border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-700">
              <span className="font-medium">{filteredServices.length}</span>
              <span className="ml-1">service{filteredServices.length > 1 ? 's' : ''} trouvé{filteredServices.length > 1 ? 's' : ''}</span>
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

      {/* Service Details Modal */}
      {selectedService && isDetailsModalOpen && (
        <div className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-center w-full h-full bg-gray-600 bg-opacity-50">
          <div className="relative mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Service Details</h3>
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
              {/* Service Information */}
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Service Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedService.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900">{selectedService.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadge(selectedService.category)}`}>
                        {selectedService.category}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">{selectedService.location}</p>
                    </div>
                    {selectedService.requirements && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Requirements</label>
                        <p className="text-sm text-gray-900">{selectedService.requirements}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Pricing & Duration</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <p className="text-lg font-semibold text-gray-900">€{selectedService.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <p className="text-sm text-gray-900">{selectedService.duration} minutes</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedService.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedService.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Rating & Reviews</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Average Rating</label>
                      <div className="flex items-center">
                        <p className="text-lg font-semibold text-yellow-600">
                          {selectedService.rating ? selectedService.rating.toFixed(1) : 'N/A'}
                        </p>
                        <span className="ml-2 text-sm text-gray-500">
                          ({selectedService.totalRatings} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Information */}
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Provider Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">
                        {selectedService.provider.firstName} {selectedService.provider.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedService.provider.email}</p>
                    </div>
                    {selectedService.provider.phoneNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm text-gray-900">{selectedService.provider.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-3 font-semibold text-gray-900">Service History</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedService.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedService.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings */}
                {selectedService.bookings && selectedService.bookings.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="mb-3 font-semibold text-gray-900">Recent Bookings</h4>
                    <div className="overflow-y-auto space-y-2 max-h-40">
                      {selectedService.bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="p-2 bg-white rounded border">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {getCustomerName(booking)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              getBookingStatus(booking) === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              getBookingStatus(booking) === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                              getBookingStatus(booking) === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getBookingStatus(booking)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {getBookingDate(booking)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                onClick={() => toggleServiceStatus(selectedService.id, selectedService.isActive)}
                className={`px-4 py-2 rounded text-white ${
                  selectedService.isActive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedService.isActive ? 'Deactivate Service' : 'Activate Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
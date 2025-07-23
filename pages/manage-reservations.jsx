import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import RoleBasedNavigation from '../components/RoleBasedNavigation';

export default function ManageReservations() {
  const [bookings, setBookings] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('services');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (!['PROVIDER', 'SERVICE_PROVIDER'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data which includes bookings and rentals
      const response = await fetch('/api/dashboard/service-provider');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      
      // Filter pending bookings and rentals
      const pendingBookings = data.bookings.filter(booking => booking.status === 'PENDING');
      const pendingRentals = data.boxRentals.filter(rental => !rental.isActive);
      
      setBookings(pendingBookings);
      setRentals(pendingRentals);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId, action, reason = '') => {
    try {
      setProcessingId(bookingId);
      
      const response = await fetch('/api/bookings/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          action,
          reason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process booking');
      }

      const result = await response.json();
      
      // Remove booking from list
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      
      // Show success message
      alert(result.message);
      
    } catch (err) {
      console.error('Error processing booking:', err);
      alert('Erreur lors du traitement de la réservation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRentalAction = async (rentalId, action, reason = '') => {
    try {
      setProcessingId(rentalId);
      
      const response = await fetch('/api/box-rentals/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
          action,
          reason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process rental');
      }

      const result = await response.json();
      
      // Remove rental from list
      setRentals(prev => prev.filter(rental => rental.id !== rentalId));
      
      // Show success message
      alert(result.message);
      
    } catch (err) {
      console.error('Error processing rental:', err);
      alert('Erreur lors du traitement de la location');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleBasedNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des Réservations
            </h1>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Retour au dashboard
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex mb-6 border-b">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'services'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Services ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'storage'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Boîtes de stockage ({rentals.length})
            </button>
          </div>

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Demandes de réservation de services
                </h2>
                
                {bookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Aucune demande de réservation en attente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{booking.serviceName}</h3>
                            <p className="text-gray-600">
                              Client: {booking.customerName}
                            </p>
                            <p className="text-gray-600">
                              Email: {booking.customerEmail}
                            </p>
                            <p className="text-gray-600">
                              Date: {formatDate(booking.scheduledAt)}
                            </p>
                            <p className="text-gray-600">
                              Adresse: {booking.address}
                            </p>
                            {booking.notes && (
                              <p className="text-gray-600">
                                Notes: {booking.notes}
                              </p>
                            )}
                            <p className="text-green-600 font-semibold">
                              Montant: {booking.totalAmount}€
                            </p>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleBookingAction(booking.id, 'ACCEPT')}
                              disabled={processingId === booking.id}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {processingId === booking.id ? 'Traitement...' : 'Accepter'}
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Raison du refus (optionnel):');
                                if (reason !== null) {
                                  handleBookingAction(booking.id, 'REJECT', reason);
                                }
                              }}
                              disabled={processingId === booking.id}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Storage Tab */}
          {activeTab === 'storage' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Demandes de location de boîtes de stockage
                </h2>
                
                {rentals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Aucune demande de location en attente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {rentals.map((rental) => (
                      <div key={rental.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{rental.storageBoxTitle}</h3>
                            <p className="text-gray-600">
                              Client: {rental.customerName}
                            </p>
                            <p className="text-gray-600">
                              Email: {rental.customerEmail}
                            </p>
                            <p className="text-gray-600">
                              Période: {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                            </p>
                            <p className="text-gray-600">
                              Durée: {rental.duration} jours
                            </p>
                            <p className="text-gray-600">
                              Localisation: {rental.box.location}
                            </p>
                            <p className="text-green-600 font-semibold">
                              Montant total: {rental.totalCost}€
                            </p>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRentalAction(rental.id, 'ACCEPT')}
                              disabled={processingId === rental.id}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {processingId === rental.id ? 'Traitement...' : 'Accepter'}
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Raison du refus (optionnel):');
                                if (reason !== null) {
                                  handleRentalAction(rental.id, 'REJECT', reason);
                                }
                              }}
                              disabled={processingId === rental.id}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
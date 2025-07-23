import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RoleBasedNavigation from '../../../components/RoleBasedNavigation';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  AlertCircle,
  Star,
  Wrench,
  Save,
  CreditCard,
  Timer
} from 'lucide-react';

export default function ServiceBooking({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [bookingData, setBookingData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    notes: '',
    phone: '',
    email: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch service details
  useEffect(() => {
    if (id && user) {
      fetchServiceDetails();
    }
  }, [id, user]);

  const fetchServiceDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/services/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setService(data);
        
        // Préremplir les données utilisateur
        setBookingData(prev => ({
          ...prev,
          phone: user.phone || '',
          email: user.email || ''
        }));
      } else {
        setError('Service non trouvé');
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      setError('Erreur lors du chargement du service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: id,
          date: bookingData.scheduledDate,
          time: bookingData.scheduledTime,
          address: bookingData.location,
          notes: bookingData.notes,
          paymentMethod: 'CARD'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Réservation effectuée avec succès !');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Erreur lors de la réservation');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Erreur lors de la réservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />);
      } else if (i - 0.5 <= roundedRating) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-current opacity-50" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    return stars;
  };

  const getCategoryLabel = (category) => {
    const categories = {
      'OTHER': 'Autre',
      'CLEANING': 'Nettoyage',
      'MAINTENANCE': 'Maintenance',
      'REPAIR': 'Réparation',
      'INSTALLATION': 'Installation',
      'CONSULTING': 'Conseil',
      'DELIVERY': 'Livraison',
      'GARDENING': 'Jardinage',
      'MOVING': 'Déménagement',
      'HANDYMAN': 'Bricolage'
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Réserver un service - EcoDeli</title>
        <meta name="description" content="Réservez votre service" />
      </Head>

      <RoleBasedNavigation 
        user={user} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        logout={logout}
      />

      <div className="px-6 py-8 mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/services/browse">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              <ArrowLeft className="w-4 h-4" />
              Retour aux services
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Réserver un service
          </h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 mb-6 text-green-700 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement du service...</p>
            </div>
          </div>
        ) : service ? (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Service Details */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900">
                  <Wrench className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {service.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getCategoryLabel(service.category)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        Prix
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {service.price}€
                      </div>
                    </div>
                    {service.duration && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Timer className="w-4 h-4" />
                          Durée
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {service.duration} min
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    Prestataire
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {service.provider.firstName} {service.provider.lastName}
                  </div>
                  {service.provider.phone && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {service.provider.phone}
                    </div>
                  )}
                </div>

                {service.location && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      Zone d'intervention
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {service.location}
                    </div>
                  </div>
                )}

                {service.averageRating > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                      <Star className="w-4 h-4" />
                      Évaluation
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(service.averageRating)}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({service.averageRating}) - {service.totalBookings} réservations
                      </span>
                    </div>
                  </div>
                )}

                {service.description && (
                  <div>
                    <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {service.description}
                    </p>
                  </div>
                )}

                {service.requirements && (
                  <div>
                    <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
                      Prérequis
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {service.requirements}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Form */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
                Formulaire de réservation
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date et heure */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date souhaitée *
                    </label>
                    <input
                      type="date"
                      value={bookingData.scheduledDate}
                      onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                      className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Heure souhaitée *
                    </label>
                    <input
                      type="time"
                      value={bookingData.scheduledTime}
                      onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                      className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Localisation */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adresse d'intervention *
                  </label>
                  <input
                    type="text"
                    value={bookingData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Adresse complète où le service sera effectué"
                    required
                  />
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={bookingData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Votre numéro de téléphone"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={bookingData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Votre email"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes additionnelles
                  </label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                    placeholder="Détails supplémentaires, instructions spéciales..."
                  />
                </div>

                {/* Récapitulatif */}
                <div className="p-4 bg-sky-50 rounded-lg dark:bg-sky-900/20">
                  <h3 className="mb-2 font-medium text-sky-900 dark:text-sky-200">
                    Récapitulatif
                  </h3>
                  <div className="space-y-1 text-sm text-sky-700 dark:text-sky-300">
                    <div>Service: {service.name}</div>
                    <div>Prix: {service.price}€</div>
                    {service.duration && <div>Durée: {service.duration} minutes</div>}
                    <div>Prestataire: {service.provider.firstName} {service.provider.lastName}</div>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 text-white bg-emerald-500 rounded-lg transition-colors hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                        Réservation...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" />
                        Confirmer la réservation
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 w-16 h-16 text-red-400" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Service non trouvé
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Le service que vous recherchez n'existe pas ou n'est plus disponible.
            </p>
            <Link href="/services/browse">
              <button className="mt-4 px-6 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600">
                Retour aux services
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 
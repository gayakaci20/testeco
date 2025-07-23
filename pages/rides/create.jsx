import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RoleBasedNavigation from '../../components/RoleBasedNavigation';
import VehicleTypeModal from '../../components/VehicleTypeModal';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Truck,
  DollarSign,
  Package,
  Users,
  AlertCircle,
  CheckCircle,
  Navigation,
  Route,
  Info,
  Save,
  Eye,
  Star,
  TrendingUp
} from 'lucide-react';

export default function CreateRide({ isDarkMode, toggleDarkMode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    fromCity: '',
    toCity: '',
    departureDate: '',
    departureTime: '',
    availableSpaces: 3,
    pricePerKm: 0.5,
    description: '',
    vehicleType: 'car',
    maxWeight: 50,
    isRecurring: false,
    recurringDays: [],
    allowsPackages: true,
    allowsPassengers: true,
    contactPreference: 'app',
    specialRequirements: '',
    returnTrip: false,
    returnDate: '',
    returnTime: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'CARRIER')) {
      router.push('/login');
      return;
    }
    
    // Check if user has vehicle type
    if (user && !user.vehicleType) {
      setShowVehicleTypeModal(true);
    } else if (user && user.vehicleType) {
      // Pre-fill vehicle type from user profile
      setFormData(prev => ({
        ...prev,
        vehicleType: user.vehicleType
      }));
    }
  }, [user, loading, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRecurringDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fromCity.trim()) newErrors.fromCity = 'Ville de départ requise';
    if (!formData.toCity.trim()) newErrors.toCity = 'Ville d\'arrivée requise';
    if (!formData.departureDate) newErrors.departureDate = 'Date de départ requise';
    if (!formData.departureTime) newErrors.departureTime = 'Heure de départ requise';
    if (formData.availableSpaces < 1) newErrors.availableSpaces = 'Au moins 1 place requise';
    if (formData.pricePerKm < 0.1) newErrors.pricePerKm = 'Prix minimum: 0.1€/km';
    if (formData.maxWeight < 1) newErrors.maxWeight = 'Poids maximum minimum: 1kg';
    
    // Check if departure date is in the future
    const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime}`);
    if (departureDateTime <= new Date()) {
      newErrors.departureDate = 'La date de départ doit être dans le futur';
    }

    if (formData.isRecurring && formData.recurringDays.length === 0) {
      newErrors.recurringDays = 'Sélectionnez au moins un jour pour les trajets récurrents';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVehicleTypeSaved = (vehicleType) => {
    setShowVehicleTypeModal(false);
    setFormData(prev => ({
      ...prev,
      vehicleType: vehicleType
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user has vehicle type before submitting
    if (!user?.vehicleType && !formData.vehicleType) {
      setShowVehicleTypeModal(true);
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
          carrierId: user.id // Pour compatibilité
        })
      });

      if (response.ok) {
        const createdRide = await response.json();
        alert('Trajet créé avec succès! Vous recevrez des notifications pour les propositions.');
        router.push('/dashboard/carrier?rideCreated=true');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la création du trajet');
      }
    } catch (error) {
      console.error('Erreur lors de la création du trajet:', error);
      alert('Erreur lors de la création du trajet');
    } finally {
      setIsLoading(false);
    }
  };

  const vehicleOptions = [
    { value: 'car', label: '🚗 Voiture', capacity: '1-4 personnes' },
    { value: 'van', label: '🚐 Fourgonnette', capacity: '5-8 personnes' },
    { value: 'truck', label: '🚛 Camion', capacity: 'Transport de marchandises' },
    { value: 'motorcycle', label: '🏍️ Moto', capacity: '1-2 personnes' },
    { value: 'bus', label: '🚌 Bus', capacity: '9+ personnes' }
  ];

  const weekDays = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Créer un Trajet - ecodeli</title>
        <meta name="description" content="Créez un trajet pour recevoir des propositions de transport" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/rides" className="p-2 mr-4 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Créer un Trajet
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Créez un trajet pour recevoir des propositions de transport
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Comment ça marche ?
                </h3>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                  Créez votre trajet avec les détails de votre itinéraire. Les clients pourront voir votre annonce et vous envoyer des propositions pour transporter leurs colis ou voyager avec vous.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Route Section */}
                <div>
                  <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    <Route className="mr-2 w-5 h-5 text-blue-600" />
                    Itinéraire
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ville de départ *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 w-5 h-5 text-green-500 transform -translate-y-1/2" />
                        <input
                          type="text"
                          name="fromCity"
                          value={formData.fromCity}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                            errors.fromCity ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Paris"
                        />
                      </div>
                      {errors.fromCity && (
                        <p className="mt-1 text-sm text-red-500">{errors.fromCity}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ville d'arrivée *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 w-5 h-5 text-red-500 transform -translate-y-1/2" />
                        <input
                          type="text"
                          name="toCity"
                          value={formData.toCity}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                            errors.toCity ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Lyon"
                        />
                      </div>
                      {errors.toCity && (
                        <p className="mt-1 text-sm text-red-500">{errors.toCity}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date & Time Section */}
                <div>
                  <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    <Calendar className="mr-2 w-5 h-5 text-blue-600" />
                    Date et Heure
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date de départ *
                      </label>
                      <input
                        type="date"
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.departureDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.departureDate && (
                        <p className="mt-1 text-sm text-red-500">{errors.departureDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Heure de départ *
                      </label>
                      <input
                        type="time"
                        name="departureTime"
                        value={formData.departureTime}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.departureTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.departureTime && (
                        <p className="mt-1 text-sm text-red-500">{errors.departureTime}</p>
                      )}
                    </div>
                  </div>

                  {/* Recurring Option */}
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleInputChange}
                        className="text-blue-600 rounded border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Trajet récurrent (même heure chaque semaine)
                      </span>
                    </label>
                  </div>

                  {formData.isRecurring && (
                    <div className="mt-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Jours de la semaine *
                      </label>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {weekDays.map(day => (
                          <label key={day.key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.recurringDays.includes(day.key)}
                              onChange={() => handleRecurringDayChange(day.key)}
                              className="text-blue-600 rounded border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              {day.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.recurringDays && (
                        <p className="mt-1 text-sm text-red-500">{errors.recurringDays}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Vehicle & Capacity Section */}
                <div>
                  <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    <Truck className="mr-2 w-5 h-5 text-blue-600" />
                    Véhicule et Capacité
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Type de véhicule
                      </label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {vehicleOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {vehicleOptions.find(v => v.value === formData.vehicleType)?.capacity}
                      </p>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Places disponibles *
                      </label>
                      <input
                        type="number"
                        name="availableSpaces"
                        value={formData.availableSpaces}
                        onChange={handleInputChange}
                        min="1"
                        max="50"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.availableSpaces ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.availableSpaces && (
                        <p className="mt-1 text-sm text-red-500">{errors.availableSpaces}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Poids max (kg) *
                      </label>
                      <input
                        type="number"
                        name="maxWeight"
                        value={formData.maxWeight}
                        onChange={handleInputChange}
                        min="1"
                        max="10000"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.maxWeight ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.maxWeight && (
                        <p className="mt-1 text-sm text-red-500">{errors.maxWeight}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div>
                  <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    <DollarSign className="mr-2 w-5 h-5 text-blue-600" />
                    Tarification
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Prix par kilomètre (€) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 w-5 h-5 text-green-500 transform -translate-y-1/2" />
                        <input
                          type="number"
                          name="pricePerKm"
                          value={formData.pricePerKm}
                          onChange={handleInputChange}
                          min="0.1"
                          step="0.1"
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                            errors.pricePerKm ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.pricePerKm && (
                        <p className="mt-1 text-sm text-red-500">{errors.pricePerKm}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Prix recommandé: 0.3€ - 0.8€ par km (covoiturage)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services Section */}
                <div>
                  <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    <Package className="mr-2 w-5 h-5 text-blue-600" />
                    Services proposés
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="allowsPackages"
                        checked={formData.allowsPackages}
                        onChange={handleInputChange}
                        className="text-blue-600 rounded border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Transport de colis
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="allowsPassengers"
                        checked={formData.allowsPassengers}
                        onChange={handleInputChange}
                        className="text-blue-600 rounded border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Transport de passagers
                      </span>
                    </label>
                  </div>
                </div>

                {/* Additional Info Section */}
                <div>
                  <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    <Info className="mr-2 w-5 h-5 text-blue-600" />
                    Informations supplémentaires
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description du trajet
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Informations supplémentaires sur le trajet, conditions particulières, etc."
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Exigences spéciales
                      </label>
                      <textarea
                        name="specialRequirements"
                        value={formData.specialRequirements}
                        onChange={handleInputChange}
                        rows={2}
                        className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Conditions spéciales, restrictions, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center px-4 py-2 text-gray-600 transition-colors dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <Eye className="mr-2 w-4 h-4" />
                    {showPreview ? 'Masquer' : 'Prévisualiser'}
                  </button>
                  <div className="flex space-x-3">
                    <Link href="/rides" className="px-4 py-2 text-gray-600 transition-colors dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                          Création...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 w-4 h-4" />
                          Créer le trajet
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips Card */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                <Star className="mr-2 w-5 h-5 text-yellow-500" />
                Conseils pour réussir
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Soyez précis
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Plus votre description est détaillée, plus vous recevrez de propositions pertinentes
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Prix juste
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Un prix équitable attire plus de clients et favorise les bonnes évaluations
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Réactivité
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Répondez rapidement aux propositions pour maximiser vos chances
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                <TrendingUp className="mr-2 w-5 h-5 text-green-500" />
                Votre potentiel
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formData.fromCity && formData.toCity && formData.pricePerKm ? 
                      `≈ ${Math.round(80 * formData.pricePerKm * formData.availableSpaces)}€` : '---'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Revenus estimés (trajet ~80km)
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formData.availableSpaces || 0}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Places disponibles
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            {showPreview && (
              <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Aperçu de votre annonce
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formData.fromCity || 'Ville de départ'}
                    </span>
                    <Route className="w-4 h-4 text-gray-400" />
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formData.toCity || 'Ville d\'arrivée'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.departureDate ? 
                        new Date(formData.departureDate).toLocaleDateString('fr-FR') : 
                        'Date non définie'}
                    </span>
                    <Clock className="ml-4 w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.departureTime || 'Heure non définie'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.availableSpaces} places - {formData.maxWeight}kg max
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formData.pricePerKm}€/km
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Vehicle Type */}
      <VehicleTypeModal
        isOpen={showVehicleTypeModal}
        onClose={() => {}} // Prevent closing without selection
        onSave={handleVehicleTypeSaved}
        currentVehicleType={user?.vehicleType || formData.vehicleType}
      />
    </div>
  );
} 
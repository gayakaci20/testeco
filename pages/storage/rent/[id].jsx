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
  Box,
  Save,
  CreditCard,
  Ruler,
  Shield,
  Package
} from 'lucide-react';

export default function StorageRental({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [storageBox, setStorageBox] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [rentalData, setRentalData] = useState({
    startDate: '',
    endDate: '',
    phone: '',
    email: '',
    notes: '',
    duration: 30 // Par défaut 30 jours
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch storage box details
  useEffect(() => {
    if (id && id !== 'null' && id !== 'undefined' && user) {
      console.log('useEffect: ID détecté:', id, 'User:', user?.email);
      fetchStorageBoxDetails();
    } else {
      console.log('useEffect: En attente de l\'ID ou de l\'utilisateur. ID:', id, 'User:', user?.email);
    }
  }, [id, user]);

  const fetchStorageBoxDetails = async () => {
    // Vérifier que l'ID existe et n'est pas null
    if (!id || id === 'null' || id === 'undefined') {
      console.error('ID de storage box invalide:', id);
      setError('ID de boîte de stockage invalide');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Récupération des détails pour la storage box:', id);
      const response = await fetch(`/api/storage-boxes/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setStorageBox(data);
        
        // Préremplir les données utilisateur
        setRentalData(prev => ({
          ...prev,
          phone: user?.phoneNumber || user?.phone || '',
          email: user?.email || ''
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur API storage-boxes:', response.status, errorData);
        setError(errorData.error || 'Boîte de stockage non trouvée');
      }
    } catch (error) {
      console.error('Error fetching storage box:', error);
      setError('Erreur lors du chargement de la boîte de stockage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Validation de l'ID avant soumission
    if (!id || id === 'null' || id === 'undefined') {
      setError('ID de boîte de stockage invalide. Veuillez recharger la page.');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Soumission du formulaire avec ID:', id);
      const response = await fetch('/api/box-rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storageBoxId: id,
          startDate: rentalData.startDate,
          endDate: rentalData.endDate,
          totalAmount: calculateTotalPrice(),
          paymentMethod: 'CARD'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresPayment && data.redirectTo) {
          setSuccess('Réservation créée ! Redirection vers le paiement...');
          setTimeout(() => {
            router.push(data.redirectTo);
          }, 1500);
        } else {
          setSuccess('Location effectuée avec succès !');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } else {
        setError(data.error || 'Erreur lors de la location');
      }
    } catch (error) {
      console.error('Error creating rental:', error);
      setError('Erreur lors de la location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setRentalData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Calculer automatiquement la durée si les dates sont renseignées
      if (field === 'startDate' || field === 'endDate') {
        if (newData.startDate && newData.endDate) {
          const start = new Date(newData.startDate);
          const end = new Date(newData.endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          newData.duration = diffDays;
        }
      }
      
      return newData;
    });
  };

  const getSizeLabel = (size) => {
    const sizes = {
      'SMALL': 'Petit (1m²)',
      'MEDIUM': 'Moyen (2-3m²)',
      'LARGE': 'Grand (4-5m²)',
      'EXTRA_LARGE': 'Très Grand (6m²+)'
    };
    return sizes[size] || size;
  };

  const calculateTotalPrice = () => {
    if (!storageBox || !rentalData.duration) return 0;
    return (storageBox.pricePerDay * rentalData.duration).toFixed(2);
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
        <title>Louer une boîte de stockage - EcoDeli</title>
        <meta name="description" content="Louez votre boîte de stockage" />
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
          <Link href="/storage/browse">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              <ArrowLeft className="w-4 h-4" />
              Retour aux boîtes
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Louer une boîte de stockage
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
              <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement de la boîte...</p>
            </div>
          </div>
        ) : storageBox ? (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Storage Box Details */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Box className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {storageBox.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Code: {storageBox.code}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        Prix par jour
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {storageBox.pricePerDay}€
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Ruler className="w-4 h-4" />
                        Taille
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {getSizeLabel(storageBox.size)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    Propriétaire
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {storageBox.owner.firstName} {storageBox.owner.lastName}
                  </div>
                  {storageBox.owner.phone && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {storageBox.owner.phone}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    Localisation
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {storageBox.location}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="w-4 h-4" />
                    Disponibilité
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    storageBox.available 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {storageBox.available ? 'Disponible' : 'Occupé'}
                  </div>
                </div>

                {storageBox.description && (
                  <div>
                    <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {storageBox.description}
                    </p>
                  </div>
                )}

                {storageBox.features && storageBox.features.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
                      Caractéristiques
                    </h3>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {storageBox.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Rental Form */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
                Formulaire de location
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dates */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      value={rentalData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date de fin *
                    </label>
                    <input
                      type="date"
                      value={rentalData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                      min={rentalData.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Durée calculée */}
                {rentalData.duration > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                    <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-300">
                      <Clock className="w-4 h-4" />
                      Durée: {rentalData.duration} jour{rentalData.duration > 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={rentalData.phone}
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
                      value={rentalData.email}
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
                    value={rentalData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="3"
                    placeholder="Utilisation prévue, objets à stocker, instructions spéciales..."
                  />
                </div>

                {/* Récapitulatif */}
                <div className="p-4 bg-orange-50 rounded-lg dark:bg-orange-900/20">
                  <h3 className="mb-2 font-medium text-orange-900 dark:text-orange-200">
                    Récapitulatif de la location
                  </h3>
                  <div className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                    <div>Boîte: {storageBox.title}</div>
                    <div>Taille: {getSizeLabel(storageBox.size)}</div>
                    <div>Prix/jour: {storageBox.pricePerDay}€</div>
                    <div>Durée: {rentalData.duration} jour{rentalData.duration > 1 ? 's' : ''}</div>
                    <div className="pt-2 font-medium border-t border-orange-200 dark:border-orange-800">
                      Total: {calculateTotalPrice()}€
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                  <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Conditions de location
                  </h3>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li>• Paiement requis avant accès à la boîte</li>
                    <li>• Objets interdits: dangereux, illégaux, périssables</li>
                    <li>• Responsabilité du locataire pour les dommages</li>
                    <li>• Accès 24h/24 selon disponibilité</li>
                    <li>• Résiliation possible avec préavis de 7 jours</li>
                  </ul>
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
                    disabled={isSubmitting || !storageBox.available}
                    className="flex-1 px-4 py-3 text-white bg-orange-500 rounded-lg transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                        Location...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" />
                        Confirmer la location
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
              Boîte de stockage non trouvée
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              La boîte de stockage que vous recherchez n'existe pas ou n'est plus disponible.
            </p>
            <Link href="/storage/browse">
              <button className="mt-4 px-6 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                Retour aux boîtes
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 
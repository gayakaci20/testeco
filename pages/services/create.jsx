import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RoleBasedNavigation from '../../components/RoleBasedNavigation';
import { 
  ArrowLeft,
  Plus,
  Save,
  AlertCircle,
  CheckCircle,
  Wrench,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  Tag,
  User,
  Info,
  List
} from 'lucide-react';

export default function ServiceCreate({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'OTHER',
    price: '',
    duration: '',
    location: '',
    requirements: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const categories = [
    { value: 'OTHER', label: 'Autre', icon: Wrench, color: 'gray' },
    { value: 'CLEANING', label: 'Nettoyage', icon: Wrench, color: 'blue' },
    { value: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, color: 'yellow' },
    { value: 'REPAIR', label: 'Réparation', icon: Wrench, color: 'red' },
    { value: 'INSTALLATION', label: 'Installation', icon: Wrench, color: 'green' },
    { value: 'CONSULTING', label: 'Conseil', icon: Wrench, color: 'purple' },
    { value: 'DELIVERY', label: 'Livraison', icon: Wrench, color: 'orange' },
    { value: 'GARDENING', label: 'Jardinage', icon: Wrench, color: 'green' },
    { value: 'MOVING', label: 'Déménagement', icon: Wrench, color: 'blue' },
    { value: 'HANDYMAN', label: 'Bricolage', icon: Wrench, color: 'yellow' }
  ];

  // Redirect if not logged in or not a provider
  useEffect(() => {
    if (!loading && (!user || !['PROVIDER', 'SERVICE_PROVIDER'].includes(user.role))) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    // Validation
    if (!formData.name.trim()) {
      setError('Le nom du service est requis');
      setIsSubmitting(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Le prix doit être supérieur à 0');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration: formData.duration ? parseInt(formData.duration) : null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Service créé avec succès !');
        // Redirect to dashboard with success parameter
        setTimeout(() => {
          router.push('/dashboard/provider?serviceCreated=true');
        }, 1500);
      } else {
        setError(data.error || 'Erreur lors de la création du service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      setError('Erreur lors de la création du service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  if (!user || !['PROVIDER', 'SERVICE_PROVIDER'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Créer un Service - EcoDeli</title>
        <meta name="description" content="Créer un nouveau service" />
      </Head>

      <RoleBasedNavigation 
        user={user} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        logout={logout}
      />

      {/* Header Section */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/provider"
                className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour au tableau de bord
              </Link>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Créer un nouveau service
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Ajoutez un nouveau service à votre offre
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-4xl">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center">
              <AlertCircle className="mr-3 w-5 h-5 text-red-400" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-center">
              <CheckCircle className="mr-3 w-5 h-5 text-green-400" />
              <p className="text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Informations de base */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informations de base
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <User className="inline w-4 h-4 mr-2" />
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="Ex: Nettoyage de vitres, Réparation électrique..."
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Tag className="inline w-4 h-4 mr-2" />
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tarifs et durée */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tarifs et durée
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <DollarSign className="inline w-4 h-4 mr-2" />
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Clock className="inline w-4 h-4 mr-2" />
                    Durée estimée (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="60"
                  />
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Localisation
              </h3>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Zone d'intervention
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Ex: Paris 15ème, Lille centre, dans un rayon de 10km..."
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Description détaillée
              </h3>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText className="inline w-4 h-4 mr-2" />
                  Description du service
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="4"
                  className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Décrivez votre service en détail, les prestations incluses, votre expérience..."
                />
              </div>
            </div>

            {/* Prérequis */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Prérequis et conditions
              </h3>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <List className="inline w-4 h-4 mr-2" />
                  Prérequis ou conditions particulières
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows="3"
                  className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Ex: Matériel à fournir par le client, accès nécessaire, contraintes spéciales..."
                />
              </div>
            </div>

            {/* Informations importantes */}
            <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
              <div className="flex items-start">
                <Info className="mr-3 w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Informations importantes
                  </h4>
                  <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Votre service sera visible par tous les clients une fois créé</li>
                    <li>• Vous recevrez des notifications pour chaque nouvelle demande</li>
                    <li>• Vous pourrez modifier ou désactiver votre service à tout moment</li>
                    <li>• Les prix sont affichés TTC</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/dashboard/provider"
                className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 rounded-lg transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Annuler
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 font-medium text-white bg-sky-500 rounded-lg transition hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Créer le service
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
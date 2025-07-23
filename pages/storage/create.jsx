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
  Box,
  MapPin,
  DollarSign,
  Maximize,
  FileText,
  Info,
  Ruler,
  Shield,
  Tag
} from 'lucide-react';

export default function StorageCreate({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    size: 'SMALL',
    pricePerDay: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const sizes = [
    { 
      value: 'XS', 
      label: 'Très petit (XS)', 
      description: 'Idéal pour documents, objets personnels (env. 0.3 m²)',
      icon: '📦'
    },
    { 
      value: 'SMALL', 
      label: 'Petit (S)', 
      description: 'Parfait pour cartons, vêtements (env. 0.8 m²)',
      icon: '📋'
    },
    { 
      value: 'MEDIUM', 
      label: 'Moyen (M)', 
      description: 'Équipement sportif, meubles légers (env. 1.5 m²)',
      icon: '🗄️'
    },
    { 
      value: 'LARGE', 
      label: 'Grand (L)', 
      description: 'Mobilier, électroménager (env. 3 m²)',
      icon: '🏠'
    },
    { 
      value: 'XL', 
      label: 'Très grand (XL)', 
      description: 'Stockage professionnel, gros mobilier (env. 5 m²)',
      icon: '🏢'
    }
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
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      setIsSubmitting(false);
      return;
    }

    if (!formData.location.trim()) {
      setError('La localisation est requise');
      setIsSubmitting(false);
      return;
    }

    if (!formData.pricePerDay || parseFloat(formData.pricePerDay) <= 0) {
      setError('Le prix par jour doit être supérieur à 0');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/storage-boxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          location: formData.location.trim(),
          size: formData.size,
          pricePerDay: parseFloat(formData.pricePerDay),
          description: formData.description.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Boîte de stockage créée avec succès !');
        // Redirect to dashboard with success parameter
        setTimeout(() => {
          router.push('/dashboard/provider?storageBoxCreated=true');
        }, 1500);
      } else {
        setError(data.error || 'Erreur lors de la création de la boîte de stockage');
      }
    } catch (error) {
      console.error('Error creating storage box:', error);
      setError('Erreur lors de la création de la boîte de stockage');
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

  const getSelectedSizeInfo = () => {
    return sizes.find(size => size.value === formData.size);
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
        <title>Créer une Boîte de Stockage - EcoDeli</title>
        <meta name="description" content="Créer une nouvelle boîte de stockage" />
      </Head>

      <RoleBasedNavigation 
        user={user} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        logout={logout}
      />

      {/* Header Section */}
      <div className="px-6 py-8 bg-purple-50 dark:bg-purple-900/20">
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
              Créer une nouvelle boîte de stockage
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Ajoutez un nouvel espace de stockage à louer
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
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Tag className="inline w-4 h-4 mr-2" />
                    Titre de la boîte *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="Ex: Boîte de stockage sécurisée centre-ville"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Localisation *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="Ex: 123 Rue de la Paix, 75001 Paris"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Taille et prix */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Taille et tarification
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Ruler className="inline w-4 h-4 mr-2" />
                    Taille *
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    {sizes.map(size => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                  
                  {/* Size info */}
                  {getSelectedSizeInfo() && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-lg dark:bg-purple-900/20">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getSelectedSizeInfo().icon}</span>
                        <div>
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                            {getSelectedSizeInfo().label}
                          </p>
                          <p className="text-xs text-purple-700 dark:text-purple-400">
                            {getSelectedSizeInfo().description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <DollarSign className="inline w-4 h-4 mr-2" />
                    Prix par jour (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerDay}
                    onChange={(e) => handleInputChange('pricePerDay', e.target.value)}
                    className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Prix recommandé pour cette taille: {formData.size === 'XS' ? '2-5€' : 
                    formData.size === 'SMALL' ? '5-10€' : 
                    formData.size === 'MEDIUM' ? '10-20€' : 
                    formData.size === 'LARGE' ? '20-35€' : '35-50€'} par jour
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Description et équipements
              </h3>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText className="inline w-4 h-4 mr-2" />
                  Description de la boîte
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="4"
                  className="w-full p-3 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Décrivez votre boîte de stockage : équipements, sécurité, accessibilité, conditions d'accès..."
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
                    <li>• Un code unique sera généré automatiquement pour votre boîte</li>
                    <li>• Votre boîte sera visible par tous les clients une fois créée</li>
                    <li>• Vous recevrez des notifications pour chaque demande de location</li>
                    <li>• Les prix sont affichés TTC par jour</li>
                    <li>• Vous pouvez modifier ou désactiver votre boîte à tout moment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Conseils de sécurité */}
            <div className="p-4 bg-yellow-50 rounded-lg dark:bg-yellow-900/20">
              <div className="flex items-start">
                <Shield className="mr-3 w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                    Conseils de sécurité
                  </h4>
                  <ul className="mt-2 text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• Vérifiez l'identité des locataires avant de donner accès</li>
                    <li>• Établissez des règles claires d'utilisation</li>
                    <li>• Documentez l'état de la boîte avant et après chaque location</li>
                    <li>• Assurez-vous que votre assurance couvre la location</li>
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
                className="flex items-center px-6 py-3 font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Créer la boîte
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
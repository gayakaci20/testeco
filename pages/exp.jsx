import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import RoleBasedNavigation from '../components/RoleBasedNavigation'
import { useAuth } from '../contexts/AuthContext'
import { 
  Camera, 
  ChevronRight, 
  Calculator,
  Package,
  Truck,
  Store,
  User,
  Clock,
  MapPin,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  Calendar,
  Repeat,
  Star,
  Shield,
  Zap
} from 'lucide-react'

const isDev = process.env.NODE_ENV === 'production';
const SKIP_REAL_UPLOAD = false; 

const CameraIcon = () => (
  <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500" />
)

const ArrowRightIcon = () => (
  <ChevronRight className="ml-1 w-5 h-5" />
)

const CalculatorIcon = () => (
  <Calculator className="w-5 h-5" />
)

export default function Exp({ isDarkMode, toggleDarkMode }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [userType, setUserType] = useState('individual') 

  const [photos, setPhotos] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [objectName, setObjectName] = useState('')
  const [knowDimensions, setKnowDimensions] = useState(false)
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [format, setFormat] = useState('')
  const [weight, setWeight] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [pickupAddress, setPickupAddress] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  const [calculatedPrice, setCalculatedPrice] = useState(null)
  const [priceDetails, setPriceDetails] = useState(null)
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false)
  const [priceError, setPriceError] = useState('')

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [createdPackageInfo, setCreatedPackageInfo] = useState(null)

  const [isUrgent, setIsUrgent] = useState(false)
  const [isFragile, setIsFragile] = useState(false)
  const [needsInsurance, setNeedsInsurance] = useState(false)
  const [insuranceValue, setInsuranceValue] = useState('')
  const [preferredDeliveryTime, setPreferredDeliveryTime] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState('weekly')
  
  const [isBusinessShipment, setIsBusinessShipment] = useState(false)
  const [customerEmail, setCustomerEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [packages, setPackages] = useState([{ id: 1, objectName: '', quantity: 1, weight: '' }])

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?callbackUrl=${encodeURIComponent('/exp')}`);
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      if (user.role === 'MERCHANT' || user.userType === 'MERCHANT') {
        setUserType('merchant');
      } else if (user.role === 'SERVICE_PROVIDER' || user.userType === 'SERVICE_PROVIDER') {
        setUserType('professional');
      } else {
        setUserType('individual');
      }
    }
  }, [user]);

  const calculatePrice = async () => {
    if (!pickupAddress || !deliveryAddress) {
      setCalculatedPrice(null);
      setPriceDetails(null);
      return;
    }

    setIsCalculatingPrice(true);
    setPriceError('');

    try {
      const calculatedDimensions = dimensions || (knowDimensions && length && width && height ? `${length}x${width}x${height}` : null);
      
      const response = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickupAddress,
          deliveryAddress,
          weight: weight ? parseFloat(weight) : undefined,
          dimensions: calculatedDimensions,
          isUrgent,
          isFragile,
          needsInsurance,
          insuranceValue: needsInsurance ? parseFloat(insuranceValue) || 0 : 0,
          userType
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCalculatedPrice(data.price);
        setPriceDetails(data.details);
      } else {
        const errorData = await response.json();
        setPriceError(errorData.error || 'Erreur lors du calcul du prix');
      }
    } catch (error) {
      console.error('Erreur lors du calcul du prix:', error);
      setPriceError('Erreur lors du calcul du prix');
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculatePrice();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [pickupAddress, deliveryAddress, weight, dimensions, length, width, height, knowDimensions, isUrgent, isFragile, needsInsurance, insuranceValue]);

  if (loading || (!loading && !user)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  const addPackage = () => {
    const newId = packages.length + 1;
    setPackages([...packages, { id: newId, objectName: '', quantity: 1, weight: '' }]);
  };

  const removePackage = (id) => {
    if (packages.length > 1) {
      setPackages(packages.filter(pkg => pkg.id !== id));
    }
  };

  const updatePackage = (id, field, value) => {
    setPackages(packages.map(pkg => 
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  const getUserTypeConfig = () => {
    const configs = {
      individual: {
        title: "Envoyer un colis - Particulier",
        subtitle: "Envoi simple et économique",
        icon: User,
        color: "blue",
        features: ["Calcul automatique", "Suivi en temps réel", "Assurance incluse"]
      },
      professional: {
        title: "Envoi professionnel - Prestataire",
        subtitle: "Solutions pour vos activités professionnelles",
        icon: Package,
        color: "orange",
        features: ["Envois urgents", "Assurance renforcée", "Factures automatiques"]
      },
      merchant: {
        title: "Expéditions e-commerce - Marchand",
        subtitle: "Gestion complète de vos expéditions",
        icon: Store,
        color: "purple",
        features: ["Envois groupés", "API intégration", "Gestion commandes"]
      }
    };
    
    return configs[userType] || configs.individual;
  };

  const config = getUserTypeConfig();

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* User Type Header */}
            <div className={`bg-${config.color}-50 dark:bg-${config.color}-900/20 p-6 rounded-lg border border-${config.color}-200 dark:border-${config.color}-800`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 bg-${config.color}-100 dark:bg-${config.color}-900/40 rounded-lg`}>
                  <config.icon className={`w-8 h-8 text-${config.color}-600 dark:text-${config.color}-400`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{config.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{config.subtitle}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {config.features.map((feature, index) => (
                  <span key={index} className={`px-3 py-1 bg-${config.color}-100 dark:bg-${config.color}-900/40 text-${config.color}-700 dark:text-${config.color}-300 rounded-full text-sm`}>
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Package Information */}
            {userType === 'merchant' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Colis à expédier</h3>
                  <button
                    onClick={addPackage}
                    className="flex items-center px-3 py-2 text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
                  >
                    <Plus className="mr-2 w-4 h-4" />
                    Ajouter un colis
                  </button>
                </div>
                
                {packages.map((pkg, index) => (
                  <div key={pkg.id} className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Colis {index + 1}</h4>
                      {packages.length > 1 && (
                        <button
                          onClick={() => removePackage(pkg.id)}
                          className="p-2 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Objet *
                        </label>
                        <input
                          type="text"
                          value={pkg.objectName}
                          onChange={(e) => updatePackage(pkg.id, 'objectName', e.target.value)}
                          className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="Nom de l'objet"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Quantité
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={pkg.quantity}
                          onChange={(e) => updatePackage(pkg.id, 'quantity', parseInt(e.target.value))}
                          className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Poids (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={pkg.weight}
                          onChange={(e) => updatePackage(pkg.id, 'weight', e.target.value)}
                          className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Business Shipment Toggle for Merchants */}
                <div className="p-4 bg-purple-50 rounded-lg dark:bg-purple-900/20">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isBusinessShipment}
                      onChange={(e) => setIsBusinessShipment(e.target.checked)}
                      className="text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Expédition commerciale (facture client)
                    </span>
                  </label>
                  
                  {isBusinessShipment && (
                    <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email du client
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="client@email.com"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Numéro de commande
                        </label>
                        <input
                          type="text"
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value)}
                          className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="CMD-001"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations du colis</h3>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Objet à envoyer *
                    </label>
                    <input
                      type="text"
                      value={objectName}
                      onChange={(e) => setObjectName(e.target.value)}
                      className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="ex: Livre, Vêtements, Électronique..."
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantité
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Poids estimé (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="ex: 1.5"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dimensions (L x l x h)
                  </label>
                  <input
                    type="text"
                    value={dimensions || ''}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="ex: 30x20x10"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Photo du colis (optionnel)
                  </label>
                  <div className="p-6 text-center rounded-lg border-2 border-gray-300 border-dashed dark:border-gray-600">
                    <Camera className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotos(e.target.files)}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="text-sky-600 cursor-pointer hover:text-sky-500"
                    >
                      Cliquez pour ajouter une photo
                    </label>
                    {photos && photos.length > 0 && (
                      <p className="mt-2 text-sm text-green-600">
                        Photo sélectionnée: {photos[0].name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Professional/Advanced Options */}
            {(userType === 'professional' || userType === 'merchant') && (
              <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Options avancées</h3>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <Zap className="mr-1 w-4 h-4 text-red-500" />
                        <span className="font-medium text-gray-900 dark:text-white">Urgent</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Livraison prioritaire</span>
                    </div>
                  </label>

                  <label className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={isFragile}
                      onChange={(e) => setIsFragile(e.target.checked)}
                      className="text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <AlertCircle className="mr-1 w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-gray-900 dark:text-white">Fragile</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Manipulation délicate</span>
                    </div>
                  </label>

                  <label className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={needsInsurance}
                      onChange={(e) => setNeedsInsurance(e.target.checked)}
                      className="text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <Shield className="mr-1 w-4 h-4 text-green-500" />
                        <span className="font-medium text-gray-900 dark:text-white">Assurance</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Protection renforcée</span>
                    </div>
                  </label>
                </div>

                {needsInsurance && (
                  <div className="mt-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Valeur à assurer (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={insuranceValue}
                      onChange={(e) => setInsuranceValue(e.target.value)}
                      className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="ex: 100.00"
                    />
                  </div>
                )}

                {userType === 'merchant' && (
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Expédition récurrente
                      </span>
                    </label>
                    
                    {isRecurring && (
                      <div className="mt-2">
                        <select
                          value={recurringFrequency}
                          onChange={(e) => setRecurringFrequency(e.target.value)}
                          className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="daily">Quotidien</option>
                          <option value="weekly">Hebdomadaire</option>
                          <option value="monthly">Mensuel</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Adresses</h3>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin className="inline mr-1 w-4 h-4" />
                    Adresse d'enlèvement *
                  </label>
                  <textarea
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    rows="3"
                    placeholder="123 Rue de la Paix, 75001 Paris"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin className="inline mr-1 w-4 h-4" />
                    Adresse de livraison *
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    rows="3"
                    placeholder="456 Avenue de la Liberté, 69000 Lyon"
                  />
                </div>
              </div>

              {userType === 'professional' && (
                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Clock className="inline mr-1 w-4 h-4" />
                    Créneau de livraison préféré
                  </label>
                  <select
                    value={preferredDeliveryTime}
                    onChange={(e) => setPreferredDeliveryTime(e.target.value)}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Aucune préférence</option>
                    <option value="morning">Matin (8h-12h)</option>
                    <option value="afternoon">Après-midi (12h-18h)</option>
                    <option value="evening">Soirée (18h-20h)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Price Display */}
            {calculatedPrice && (
              <div className="p-6 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                      Prix estimé
                    </h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      €{calculatedPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <CheckCircle className="mb-2 w-8 h-8 text-green-500" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Prix calculé automatiquement
                    </p>
                  </div>
                </div>
                
                {priceDetails && (
                  <div className="pt-4 mt-4 border-t border-green-200 dark:border-green-700">
                    <h4 className="mb-2 font-medium text-green-800 dark:text-green-200">Détails du prix :</h4>
                    <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                      {priceDetails.distance && (
                        <p>Distance : {priceDetails.distance} km</p>
                      )}
                      {priceDetails.basePrice && (
                        <p>Prix de base : €{priceDetails.basePrice.toFixed(2)}</p>
                      )}
                      {isUrgent && priceDetails.urgentSurcharge && (
                        <p>Supplément urgent : €{priceDetails.urgentSurcharge.toFixed(2)}</p>
                      )}
                      {needsInsurance && priceDetails.insuranceFee && (
                        <p>Assurance : €{priceDetails.insuranceFee.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCalculatingPrice && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="flex items-center">
                  <Calculator className="mr-2 w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-blue-700 dark:text-blue-300">Calcul du prix en cours...</span>
                </div>
              </div>
            )}

            {priceError && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-300">{priceError}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Résumé de votre expédition</h3>
              
              {/* Summary Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg md:grid-cols-2 dark:bg-gray-700">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Expéditeur</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.name || user.email}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{pickupAddress}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Destinataire</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{deliveryAddress}</p>
                  </div>
                </div>

                {userType === 'merchant' ? (
                  <div>
                    <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Colis à expédier</h4>
                    {packages.map((pkg, index) => (
                      <div key={pkg.id} className="p-3 mb-2 bg-gray-50 rounded-lg dark:bg-gray-700">
                        <p className="font-medium">{pkg.objectName} (x{pkg.quantity})</p>
                        {pkg.weight && <p className="text-sm text-gray-600 dark:text-gray-400">Poids: {pkg.weight} kg</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white">{objectName}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantité: {quantity}</p>
                    {weight && <p className="text-sm text-gray-600 dark:text-gray-400">Poids: {weight} kg</p>}
                  </div>
                )}

                {/* Options Summary */}
                <div className="flex flex-wrap gap-2">
                  {isUrgent && (
                    <span className="px-3 py-1 text-sm text-red-800 bg-red-100 rounded-full">
                      <Zap className="inline mr-1 w-3 h-3" />
                      Urgent
                    </span>
                  )}
                  {isFragile && (
                    <span className="px-3 py-1 text-sm text-yellow-800 bg-yellow-100 rounded-full">
                      <AlertCircle className="inline mr-1 w-3 h-3" />
                      Fragile
                    </span>
                  )}
                  {needsInsurance && (
                    <span className="px-3 py-1 text-sm text-green-800 bg-green-100 rounded-full">
                      <Shield className="inline mr-1 w-3 h-3" />
                      Assuré (€{insuranceValue})
                    </span>
                  )}
                </div>

                {calculatedPrice && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-green-800 dark:text-green-200">
                        Prix total
                      </span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        €{calculatedPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Validation
      if (!pickupAddress || !deliveryAddress) {
        setError('Les adresses d\'enlèvement et de livraison sont obligatoires');
        setIsLoading(false);
        return;
      }

      if (userType === 'merchant') {
        const hasValidPackage = packages.some(pkg => pkg.objectName.trim());
        if (!hasValidPackage) {
          setError('Au moins un colis avec un nom est requis');
          setIsLoading(false);
          return;
        }
      } else {
        if (!objectName.trim()) {
          setError('Le nom de l\'objet est obligatoire');
          setIsLoading(false);
          return;
        }
      }

      // Préparer les données pour l'API
      let packageData;

      if (userType === 'merchant') {
        // Pour les marchands, créer un colis pour chaque package
        const validPackages = packages.filter(pkg => pkg.objectName.trim());
        
        // Pour l'instant, on crée juste le premier colis (on pourrait boucler pour tous)
        const firstPackage = validPackages[0];
        packageData = {
          userId: user.id,
          title: firstPackage.objectName,
          description: `Expédition commerciale${orderNumber ? ` - Commande: ${orderNumber}` : ''}${customerEmail ? ` - Client: ${customerEmail}` : ''}`,
          weight: firstPackage.weight ? parseFloat(firstPackage.weight) : null,
          dimensions: knowDimensions && length && width && height ? `${length}x${width}x${height}` : null,
          pickupAddress: pickupAddress.trim(),
          deliveryAddress: deliveryAddress.trim(),
          imageUrl: null, 
          isMerchant: true
        };
      } else {
        packageData = {
          userId: user.id,
          title: objectName.trim(),
          description: additionalInfo.trim() || null,
          weight: weight ? parseFloat(weight) : null,
          dimensions: knowDimensions && length && width && height ? `${length}x${width}x${height}` : null,
          pickupAddress: pickupAddress.trim(),
          deliveryAddress: deliveryAddress.trim(),
          imageUrl: null, 
          isMerchant: false
        };
      }

      console.log('Submitting package data:', packageData);

      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });

      if (response.ok) {
        const createdPackage = await response.json();
        console.log('Package created successfully:', createdPackage);
        
        // Proposer le paiement direct si le prix a été calculé
        if (createdPackage.price && createdPackage.price > 0) {
          setCreatedPackageInfo(createdPackage);
          setShowPaymentModal(true);
          setIsLoading(false);
          return;
        }
        
        // Rediriger vers le dashboard avec message de succès
        router.push(`/dashboard/customer?packageCreated=${createdPackage.id}`);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        setError(errorData.error || 'Erreur lors de la création du colis');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError('Erreur lors de la création du colis. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions pour la modal de paiement
  const handlePayNow = () => {
    setShowPaymentModal(false);
    router.push(`/payments/process?packageId=${createdPackageInfo.id}&type=direct`);
  };

  const handlePayLater = () => {
    setShowPaymentModal(false);
    router.push(`/dashboard/customer?packageCreated=${createdPackageInfo.id}`);
  };

  // Composant modal de confirmation de paiement
  const PaymentConfirmationModal = () => {
    if (!showPaymentModal || !createdPackageInfo) return null;

    return (
      <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
        <div className="p-6 w-full max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-800">
          <div className="text-center">
            <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full dark:bg-green-900/20">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Colis créé avec succès !
            </h3>
            
            <div className="p-4 mb-6 bg-green-50 rounded-lg dark:bg-green-900/20">
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Prix estimé :
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {createdPackageInfo.price.toFixed(2)}€
              </p>
            </div>
            
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Voulez-vous payer maintenant pour réserver le service de livraison ?
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={handlePayNow}
              className="flex justify-center items-center px-4 py-3 w-full font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
            >
              <DollarSign className="mr-2 w-5 h-5" />
              Payer maintenant
              <span className="ml-2 text-sm opacity-90">(Priorité transporteurs)</span>
            </button>
            
            <button
              onClick={handlePayLater}
              className="flex justify-center items-center px-4 py-3 w-full font-medium text-gray-700 bg-gray-100 rounded-lg transition dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Clock className="mr-2 w-5 h-5" />
              Attendre les propositions
            </button>
          </div>
          
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-start space-x-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex-shrink-0">
                <div className="mt-2 w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-green-600 dark:text-green-400">Paiement immédiat :</p>
                <p>Votre colis sera prioritaire auprès des transporteurs</p>
              </div>
            </div>
            
            <div className="flex items-start mt-3 space-x-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex-shrink-0">
                <div className="mt-2 w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium text-blue-600 dark:text-blue-400">Attendre :</p>
                <p>Recevez d'abord les propositions des transporteurs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Envoyer un colis - EcoDeli</title>
        <meta name="description" content="Envoyez vos colis de manière écologique et économique" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <div className="container px-6 py-8 mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= activeStep 
                    ? 'bg-sky-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {step < activeStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < activeStep ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Étape {activeStep} sur 3: {
                activeStep === 1 ? 'Informations du colis' :
                activeStep === 2 ? 'Adresses et options' :
                'Confirmation'
              }
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="mx-auto max-w-4xl">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mx-auto mt-8 max-w-4xl">
          <button
            onClick={handlePrevious}
            disabled={activeStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeStep === 1
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
          >
            Précédent
          </button>

          {activeStep < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center px-6 py-3 font-medium text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
            >
              Suivant
              <ChevronRight className="ml-1 w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center px-6 py-3 font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 w-5 h-5 rounded-full border-2 border-white animate-spin border-t-transparent" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 w-5 h-5" />
                  Confirmer l'envoi
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal />
    </div>
  );
}

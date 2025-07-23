import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import RoleBasedNavigation from '../../components/RoleBasedNavigation';
import RelayManager from '../../components/RelayManager';
import TutorialOverlay from '../../components/TutorialOverlay';
import { useTutorial } from '../../components/useTutorial';
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Eye,
  Search,
  Star,
  MessageCircle,
  Send,
  Users,
  Plus,
  Settings,
  BarChart3,
  Award,
  Box,
  Truck,
  MapPin,
  Route,
  Navigation,
  ShieldCheck,
  Zap,
  Activity,
  AlertCircle,
  Bell,
  RefreshCw,
  Building,
  Store,
  FileText,
  Shield,
  AlertTriangle,
  ExclamationTriangle
} from 'lucide-react';

// Contract Signature Modal Component
function ContractSignatureModal({ contract, onClose, onContractSigned }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSignContract = async () => {
    if (!agreed) {
      alert('Vous devez accepter les termes du contrat pour pouvoir le signer');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🖊️ Tentative de signature du contrat transporteur:', {
        contractId: contract.id,
        status: 'SIGNED',
        signedAt: new Date().toISOString()
      });

      const response = await fetch('/api/contracts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: contract.id,
          status: 'SIGNED',
          signedAt: new Date().toISOString()
        })
      });

      console.log('📡 Réponse du serveur:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Contrat signé avec succès:', result);
        alert('Contrat signé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités professionnelles.');
        onContractSigned();
        onClose();
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur du serveur:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        let errorMessage = 'Erreur lors de la signature du contrat';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        alert(`Erreur lors de la signature: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la signature du contrat:', error);
      alert(`Erreur lors de la signature du contrat: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isContractExpired = contract.endDate && new Date(contract.endDate) < new Date();

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield className="mr-3 w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Signature du Contrat Transporteur Professionnel
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {contract.endDate ? 'Contrat à Durée Déterminée (CDD)' : 'Contrat à Durée Indéterminée (CDI)'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              {contract.title}
            </h4>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Contrat créé le {new Date(contract.createdAt).toLocaleDateString('fr-FR')}
            </p>
            {contract.startDate && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Début:</strong> {new Date(contract.startDate).toLocaleDateString('fr-FR')}
              </p>
            )}
            {contract.endDate && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Fin:</strong> {new Date(contract.endDate).toLocaleDateString('fr-FR')}
                {isContractExpired && (
                  <span className="px-2 py-1 ml-2 text-xs font-medium text-red-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-red-300">
                    Expiré
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="overflow-y-auto p-4 mb-6 max-h-96 bg-gray-50 rounded-lg dark:bg-gray-700">
            <h5 className="mb-3 font-medium text-gray-900 dark:text-white">Termes du contrat :</h5>
            <div className="max-w-none prose dark:prose-invert">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                {contract.terms}
              </pre>
            </div>
          </div>

          {contract.value && (
            <div className="p-4 mb-6 bg-emerald-50 rounded-lg dark:bg-emerald-900/20">
              <h5 className="mb-2 font-medium text-emerald-900 dark:text-emerald-100">Rémunération :</h5>
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {contract.value}€ {contract.currency}
              </p>
            </div>
          )}

          {isContractExpired && (
            <div className="p-4 mb-6 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-center">
                <AlertTriangle className="mr-3 w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <h5 className="font-medium text-red-900 dark:text-red-100">Contrat expiré</h5>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Ce contrat a expiré. Vous devez attendre qu'un nouveau contrat vous soit proposé.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="agreeToCarrierContract"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mr-3 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              disabled={isContractExpired}
            />
            <label htmlFor="agreeToCarrierContract" className="text-sm text-gray-700 dark:text-gray-300">
              J'ai lu et j'accepte les termes et conditions de ce contrat professionnel. 
              Je comprends que cette signature est légalement contraignante et me permet d'exercer en tant que transporteur professionnel.
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              onClick={handleSignContract}
              disabled={isSubmitting || !agreed || isContractExpired}
              className="flex-1 px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signature en cours...' : 'Signer le contrat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Contract Warning Banner Component
function ContractWarningBanner({ contract, onSignContract }) {
  const isExpired = contract.endDate && new Date(contract.endDate) < new Date();
  
  return (
    <div className={`p-4 mb-6 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'}`}>
      <div className="flex items-center">
        <AlertTriangle className={`mr-3 w-6 h-6 ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${isExpired ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
            {isExpired ? 'Contrat expiré' : 'Signature de contrat professionnel requise'}
          </h3>
          <p className={`text-sm ${isExpired ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
            {isExpired 
              ? `Votre contrat "${contract.title}" a expiré le ${new Date(contract.endDate).toLocaleDateString('fr-FR')}. Vous ne pouvez plus exercer d'activité professionnelle.`
              : `Vous devez signer le contrat professionnel "${contract.title}" pour accéder aux fonctionnalités transporteur professionnel.`
            }
          </p>
        </div>
        {!isExpired && (
          <button
            onClick={onSignContract}
            className="px-4 py-2 ml-4 text-white bg-yellow-600 rounded-lg transition-colors hover:bg-yellow-700"
          >
            Signer maintenant
          </button>
        )}
      </div>
    </div>
  );
}

// Blocked Feature Component
function BlockedFeature({ title, description, icon: Icon, reason }) {
  return (
    <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed dark:bg-gray-800 dark:border-gray-600">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-gray-200 rounded-full dark:bg-gray-700">
          <Icon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        {description}
      </p>
      <div className="flex justify-center items-center text-sm text-red-600 dark:text-red-400">
        <Shield className="mr-2 w-4 h-4" />
        {reason}
      </div>
    </div>
  );
}

export default function ProCarrierDashboard({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tutoriel
  const { showTutorial, completeTutorial, forceTutorial } = useTutorial(user?.role);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Contract state
  const [contracts, setContracts] = useState([]);
  const [userContract, setUserContract] = useState(null);
  const [hasSignedContract, setHasSignedContract] = useState(false);
  const [isContractExpired, setIsContractExpired] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  
  // Main state
  const [dashboardStats, setDashboardStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [relayProposals, setRelayProposals] = useState([]);
  const [rides, setRides] = useState([]);
  const [packages, setPackages] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [merchantDeliveries, setMerchantDeliveries] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, month: 0, total: 0 });
  const [reviews, setReviews] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isRelayModalOpen, setIsRelayModalOpen] = useState(false);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState('active');

  // Messages state
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Rating system state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedPackageForRating, setSelectedPackageForRating] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'CARRIER')) {
      router.push('/login');
      return;
    }

    // Rediriger les transporteurs non-professionnels vers le dashboard standard
    if (user && user.role === 'CARRIER' && user.userType !== 'PROFESSIONAL') {
      router.replace('/dashboard/carrier');
      return;
    }

    if (user) {
      fetchDashboardData();
      fetchNotifications();
      fetchRelayProposals();
      fetchUserContract();
    }
  }, [user, loading]);

  // Effet séparé pour gérer le message de succès
  useEffect(() => {
    if (router.query.rideCreated || router.query.profileUpdated) {
      setShowSuccessMessage(true);
      fetchDashboardData();
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.replace('/dashboard/procarrier', undefined, { shallow: true });
      }, 5000);
    }
  }, [router.query.rideCreated, router.query.profileUpdated, router]);

  // Effet pour rafraîchir les données périodiquement
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchNotifications();
        fetchRelayProposals();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/dashboard/carrier?_t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Pro Carrier dashboard data received:', data);
        
        setDashboardStats(data.stats || {});
        setRides(data.rides || []);
        setPackages(data.packages || []);
        setDeliveries(data.deliveries || []);
        // Filter for merchant deliveries only
        setMerchantDeliveries(data.deliveries?.filter(d => d.isMerchantDelivery) || []);
        setEarnings(data.earnings || { today: 0, month: 0, total: 0 });
        setReviews(data.reviews || []);
        setCurrentLocation(data.currentLocation);
      } else {
        console.error('❌ Pro Carrier Dashboard API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching pro carrier dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        console.log('🔔 Pro Carrier notifications received:', data.notifications?.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          isRead: n.isRead,
          createdAt: n.createdAt
        })) || []);
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchRelayProposals = async () => {
    try {
      const response = await fetch('/api/carriers/relay-proposals');
      if (response.ok) {
        const data = await response.json();
        setRelayProposals(data.proposals || []);
      }
    } catch (error) {
      console.error('Error fetching relay proposals:', error);
    }
  };

  const fetchUserContract = async () => {
    try {
      console.log('📞 Récupération des contrats pour le transporteur professionnel:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        userType: user.userType
      });

      const response = await fetch(`/api/contracts?carrierId=${user.id}`, {
        credentials: 'include'
      });
      
      console.log('📡 Réponse API contracts:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const contractsData = await response.json();
        console.log('📋 Contrats récupérés:', contractsData);
        
        const userContracts = contractsData.filter(contract => contract.carrierId === user.id);
        console.log('📊 Contrats filtrés pour le transporteur:', userContracts);
        
        if (userContracts.length > 0) {
          // Chercher un contrat signé et non expiré
          const activeContract = userContracts.find(contract => 
            contract.status === 'SIGNED' && 
            (!contract.endDate || new Date(contract.endDate) > new Date())
          );
          
          if (activeContract) {
            console.log('✅ Contrat actif trouvé:', {
              id: activeContract.id,
              title: activeContract.title,
              status: activeContract.status,
              signedAt: activeContract.signedAt,
              endDate: activeContract.endDate
            });
            setUserContract(activeContract);
            setHasSignedContract(true);
            setIsContractExpired(false);
          } else {
            // Chercher un contrat en attente de signature
            const pendingContract = userContracts.find(contract => contract.status === 'PENDING_SIGNATURE');
            if (pendingContract) {
              console.log('⏳ Contrat en attente de signature trouvé:', {
                id: pendingContract.id,
                title: pendingContract.title,
                status: pendingContract.status,
                endDate: pendingContract.endDate
              });
              setUserContract(pendingContract);
              setHasSignedContract(false);
              setIsContractExpired(false);
            } else {
              // Vérifier les contrats expirés
              const expiredContract = userContracts.find(contract => 
                contract.status === 'SIGNED' && 
                contract.endDate && 
                new Date(contract.endDate) < new Date()
              );
              
              if (expiredContract) {
                console.log('⏰ Contrat expiré trouvé:', {
                  id: expiredContract.id,
                  title: expiredContract.title,
                  status: expiredContract.status,
                  endDate: expiredContract.endDate
                });
                setUserContract(expiredContract);
                setHasSignedContract(false);
                setIsContractExpired(true);
              } else {
                console.log('❌ Aucun contrat trouvé ou applicable');
              }
            }
          }
        } else {
          console.log('❌ Aucun contrat trouvé pour ce transporteur');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur lors de la récupération des contrats:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des contrats:', error);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchNotifications(),
      fetchRelayProposals(),
      fetchUserContract()
    ]);
  };

  const handleContractSigned = () => {
    setHasSignedContract(true);
    setIsContractExpired(false);
    fetchUserContract();
    fetchDashboardData();
  };

  const acceptMatch = async (matchId) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        await refreshData();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error accepting match:', error);
    }
  };

  const acceptRelayProposal = async (proposalId) => {
    try {
      const response = await fetch(`/api/matches/${proposalId}/accept-relay`, {
        method: 'POST',
      });

      if (response.ok) {
        await refreshData();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.message);
      }
    } catch (error) {
      console.error('Error accepting relay proposal:', error);
      alert('Erreur lors de l\'acceptation du relais');
    }
  };

  // Helper function to get the correct package ID from a delivery object
  const getPackageId = (delivery) => {
    console.log('📦 Getting package ID from delivery:', delivery);
    // Try different possible structures
    const packageId = delivery.package?.id || delivery.packageId || delivery.id;
    console.log('📦 Extracted package ID:', packageId);
    return packageId;
  };

  const updateDeliveryStatus = async (delivery, status) => {
    try {
      const packageId = getPackageId(delivery);
      
      if (!packageId) {
        console.error('❌ No package ID found in delivery object:', delivery);
        alert('Erreur: ID du colis non trouvé');
        return;
      }
      
      console.log('🚀 Updating delivery status:', { packageId, status, delivery });
      
      const response = await fetch(`/api/packages/${packageId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          carrierInfo: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            phone: user.phoneNumber || user.phone,
            email: user.email
          },
          timestampUpdated: new Date().toISOString(),
          updatedBy: 'professional_carrier'
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Status update successful:', data);
        
        // Refresh local data
        await refreshData();
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        // Send real-time notification to merchant if delivered
        if (status === 'DELIVERED') {
          try {
            await fetch('/api/notifications/delivery-completed', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                packageId: packageId,
                merchantId: delivery.senderId || delivery.merchantId,
                carrierName: `${user.firstName} ${user.lastName}`,
                deliveryTitle: delivery.title,
                completedAt: new Date().toISOString()
              })
            });
            console.log('📲 Notification sent to merchant');
          } catch (notifError) {
            console.warn('⚠️ Failed to send notification to merchant:', notifError);
          }
        }
        
        // Trigger browser storage event for real-time sync
        if (window.localStorage) {
          const deliveryUpdate = {
            packageId: packageId,
            status: status,
            timestamp: new Date().toISOString(),
            updatedBy: 'professional_carrier',
            carrierInfo: {
              name: `${user.firstName} ${user.lastName}`,
              id: user.id
            }
          };
          window.localStorage.setItem('deliveryUpdate', JSON.stringify(deliveryUpdate));
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'deliveryUpdate',
            newValue: JSON.stringify(deliveryUpdate)
          }));
          console.log('🔄 Real-time sync event dispatched');
        }
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Status update failed:', errorData);
        alert(`Erreur lors de la mise à jour: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert(`Erreur réseau: ${error.message}`);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'PENDING': { color: 'yellow', text: 'En attente', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-300' },
      'CONFIRMED': { color: 'blue', text: 'Confirmé', bgColor: 'bg-blue-100', textColor: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-300' },
      'ACCEPTED_BY_SENDER': { color: 'green', text: 'Accepté et payé', bgColor: 'bg-green-100', textColor: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-300' },
      'ACCEPTED_BY_CARRIER': { color: 'blue', text: 'Accepté par transporteur', bgColor: 'bg-blue-100', textColor: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-300' },
      'IN_TRANSIT': { color: 'indigo', text: 'En transit', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800', darkBg: 'dark:bg-indigo-900', darkText: 'dark:text-indigo-300' },
      'DELIVERED': { color: 'green', text: 'Livré', bgColor: 'bg-green-100', textColor: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-300' },
      'CANCELLED': { color: 'red', text: 'Annulé', bgColor: 'bg-red-100', textColor: 'text-red-800', darkBg: 'dark:bg-red-900', darkText: 'dark:text-red-300' },
      'AWAITING_RELAY': { color: 'orange', text: 'En attente de relais', bgColor: 'bg-orange-100', textColor: 'text-orange-800', darkBg: 'dark:bg-orange-900', darkText: 'dark:text-orange-300' },
      'RELAY_IN_PROGRESS': { color: 'purple', text: 'Relais en cours', bgColor: 'bg-purple-100', textColor: 'text-purple-800', darkBg: 'dark:bg-purple-900', darkText: 'dark:text-purple-300' }
    };
    return configs[status] || { color: 'gray', text: status, bgColor: 'bg-gray-100', textColor: 'text-gray-800', darkBg: 'dark:bg-gray-900', darkText: 'dark:text-gray-300' };
  };

  // Messages functions
  const fetchConversations = async () => {
    if (!user?.id) return;
    
    try {
      setMessagesLoading(true);
      const response = await fetch('/api/conversations', {
        headers: {
          'x-user-id': user.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data || []);
      } else {
        console.error('Error fetching conversations:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/messages?conversationWith=${partnerId}`, {
        headers: {
          'x-user-id': user.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
        markConversationAsRead(partnerId);
      } else {
        console.error('Error fetching messages:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markConversationAsRead = async (partnerId) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          partnerId: partnerId
        })
      });

      if (response.ok) {
        setConversations(prev => 
          prev.map(conv => 
            conv.partner.id === partnerId 
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || sendingMessage || !user?.id) {
      return;
    }

    try {
      setSendingMessage(true);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          receiverId: selectedConversation.id,
          content: newMessage.trim()
        })
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        setConversations(prev => 
          prev.map(conv => 
            conv.partner.id === selectedConversation.id
              ? { 
                  ...conv, 
                  lastMessage: { 
                    content: newMessage.trim(), 
                    createdAt: new Date().toISOString() 
                  } 
                }
              : conv
          )
        );
      } else {
        console.error('Error sending message:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Fetch conversations when messages tab is selected
  useEffect(() => {
    if (activeTab === 'messages' && user?.id) {
      fetchConversations();
    }
  }, [activeTab, user?.id]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, user?.id]);

  // Rating system functions
  const checkIfCarrierCanBeRated = (pkg) => {
    return pkg.status === 'DELIVERED' && pkg.matches && pkg.matches.some(match => match.status === 'COMPLETED');
  };

  const hasCarrierBeenRated = (pkg) => {
    return pkg.matches && pkg.matches.some(match => match.carrierReview);
  };

  const openRatingModal = (pkg) => {
    setSelectedPackageForRating(pkg);
    setShowRatingModal(true);
    setRating(0);
    setReview('');
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedPackageForRating(null);
    setRating(0);
    setReview('');
  };

  const submitRating = async () => {
    if (!selectedPackageForRating || rating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await fetch(`/api/packages/${selectedPackageForRating.id}/rate-carrier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          rating,
          review: review.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Évaluation envoyée avec succès !');
        closeRatingModal();
        refreshData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erreur lors de l'envoi de l'évaluation: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Erreur réseau lors de l\'envoi de l\'évaluation');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCreateRide = () => {
    router.push('/rides/create');
  };

  const handleViewDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    // Logique pour afficher les détails de la livraison
  };

  const handleCreateRelay = (delivery) => {
    setSelectedDelivery(delivery);
    setIsRelayModalOpen(true);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notificationId,
          isRead: true
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement du tableau de bord professionnel...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalRides: rides.length,
    activeRides: rides.filter(r => r.status === 'ACTIVE').length,
    totalDeliveries: merchantDeliveries.length,
    activeDeliveries: merchantDeliveries.filter(d => ['CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_TRANSIT'].includes(d.status)).length,
    completedDeliveries: merchantDeliveries.filter(d => d.status === 'DELIVERED').length,
    totalEarnings: earnings.total || 0,
    activeRelays: merchantDeliveries.filter(d => ['AWAITING_RELAY', 'RELAY_IN_PROGRESS'].includes(d.status)).length,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Tableau de Bord Pro Transporteur - ecodeli</title>
        <meta name="description" content="Tableau de bord professionnel pour transporteurs - Gérez vos livraisons marchandes" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header avec RoleBasedNavigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                <Building className="inline mr-2 w-8 h-8 text-emerald-600" />
                Tableau de Bord Pro
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Transporteur professionnel - Gérez vos livraisons marchandes
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateRide}
                className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25 create-ride-btn"
              >
                <Plus className="w-4 h-4" />
                Créer un trajet
              </button>
              <button
                onClick={refreshData}
                className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-teal-600 hover:to-teal-700 shadow-teal-500/25"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="px-6 mx-auto max-w-7xl">
          <div className="p-4 mb-6 bg-emerald-50 rounded-lg border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
            <div className="flex items-center">
              <CheckCircle className="mr-3 w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Action effectuée avec succès !
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Votre opération a été prise en compte et vos données ont été mises à jour.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications importantes */}
      {notifications.filter(n => !n.isRead && ['MATCH_PROPOSED', 'MATCH_UPDATE', 'DELIVERY_ASSIGNED', 'RELAY_REQUEST'].includes(n.type)).length > 0 && (
        <div className="px-6 mx-auto max-w-7xl">
          <div className="mb-6 space-y-3">
            {notifications
              .filter(n => !n.isRead && ['MATCH_PROPOSED', 'MATCH_UPDATE', 'DELIVERY_ASSIGNED', 'RELAY_REQUEST'].includes(n.type))
              .slice(0, 3)
              .map((notification) => (
                <div key={notification.id} className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="mr-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <div>
                        <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                          {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {notification.type === 'MATCH_PROPOSED' && (
                        <button
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            setActiveTab('deliveries');
                          }}
                          className="px-3 py-1 text-sm font-medium text-white bg-emerald-500 rounded-lg transition hover:bg-emerald-600"
                        >
                          Voir proposition
                        </button>
                      )}
                      {notification.type === 'MATCH_UPDATE' && (
                        <button
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            setActiveTab('deliveries');
                          }}
                          className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                        >
                          Voir livraison
                        </button>
                      )}
                      {notification.type === 'RELAY_REQUEST' && (
                        <button
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            setActiveTab('relays');
                          }}
                          className="px-3 py-1 text-sm font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                        >
                          Voir relais
                        </button>
                      )}
                      <button
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Marquer comme lu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Contract Warning Banner */}
        {userContract && (!hasSignedContract || isContractExpired) && (
          <ContractWarningBanner 
            contract={userContract} 
            onSignContract={() => setShowContractModal(true)}
          />
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-5 overview-section">
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trajets actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeRides}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total: {stats.totalRides}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full dark:from-emerald-900 dark:to-emerald-800">
                <Route className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livraisons marchandes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeDeliveries}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total: {stats.totalDeliveries}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-teal-100 to-teal-200 rounded-full dark:from-teal-900 dark:to-teal-800">
                <Store className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livrées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedDeliveries}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Note: {stats.averageRating}⭐</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full dark:from-green-900 dark:to-green-800">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gains totaux</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{stats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ce mois: €{earnings.month.toFixed(2)}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full dark:from-amber-900 dark:to-amber-800">
                <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Relais actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeRelays}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Propositions: {relayProposals.length}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full dark:from-purple-900 dark:to-purple-800">
                <Navigation className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-6 -mb-px space-x-8">
              {[
                { id: 'overview', name: 'Aperçu', icon: TrendingUp },
                { id: 'rides', name: 'Mes Trajets', icon: Route, blocked: !hasSignedContract || isContractExpired },
                { id: 'deliveries', name: 'Livraisons Marchandes', icon: Store, badge: stats.activeDeliveries, blocked: !hasSignedContract || isContractExpired },
                { id: 'relays', name: 'Relais', icon: Navigation, badge: relayProposals.length + stats.activeRelays, blocked: !hasSignedContract || isContractExpired },
                { id: 'earnings', name: 'Gains', icon: DollarSign, blocked: !hasSignedContract || isContractExpired },
                { id: 'contracts', name: 'Contrats', icon: FileText, badge: userContract && (!hasSignedContract || isContractExpired) ? 1 : 0 },
                { id: 'reviews', name: 'Avis', icon: Star, badge: reviews.filter(r => !r.isRead).length },
                { id: 'notifications', name: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.isRead).length },
                { id: 'messages', name: 'Messages', icon: MessageCircle, badge: conversations.filter(c => c.unreadCount > 0).length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={tab.blocked}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : tab.blocked
                      ? 'border-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                  {tab.blocked && <Shield className="w-3 h-3 text-red-500" />}
                  {tab.badge > 0 && (
                    <span className="inline-flex justify-center items-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aperçu de votre activité professionnelle</h3>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-800">
                    <h4 className="flex gap-2 items-center mb-4 font-medium text-gray-900 dark:text-white">
                      <Route className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Trajets récents
                    </h4>
                    {rides.slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {rides.slice(0, 3).map((ride) => (
                          <div key={ride.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{ride.from} → {ride.to}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(ride.departureTime).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ride.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {ride.status === 'ACTIVE' ? 'Actif' : ride.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Aucun trajet récent</p>
                    )}
                  </div>

                  <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100 dark:from-teal-900/20 dark:to-cyan-900/20 dark:border-teal-800">
                    <h4 className="flex gap-2 items-center mb-4 font-medium text-gray-900 dark:text-white">
                      <Store className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      Livraisons marchandes actives
                    </h4>
                    {merchantDeliveries.filter(d => ['CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_TRANSIT'].includes(d.status)).slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {merchantDeliveries.filter(d => ['CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_TRANSIT'].includes(d.status)).slice(0, 3).map((delivery) => (
                          <div key={delivery.id} className="p-3 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex gap-2 items-center mb-1">
                              <Building className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              <p className="font-medium text-gray-900 dark:text-white">{delivery.title}</p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.fromAddress} → {delivery.toAddress}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusConfig(delivery.status).bgColor} ${getStatusConfig(delivery.status).textColor} ${getStatusConfig(delivery.status).darkBg} ${getStatusConfig(delivery.status).darkText}`}>
                                {getStatusConfig(delivery.status).text}
                              </span>
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">€{delivery.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Aucune livraison marchande active</p>
                    )}
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800">
                    <h4 className="flex gap-2 items-center mb-4 font-medium text-gray-900 dark:text-white">
                      <Navigation className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Système de relais
                    </h4>
                    {relayProposals.slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {relayProposals.slice(0, 3).map((proposal) => (
                          <div key={proposal.id} className="p-3 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white">{proposal.packageTitle}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{proposal.pickupLocation} → {proposal.dropoffLocation}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">€{proposal.proposedPrice}</span>
                              <button
                                onClick={() => acceptRelayProposal(proposal.id)}
                                className="px-2 py-1 text-xs font-medium text-white bg-purple-500 rounded transition hover:bg-purple-600"
                              >
                                Accepter
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <Navigation className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">Aucune proposition de relais</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Les propositions apparaîtront ici</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <button
                    onClick={handleCreateRide}
                    className="p-4 text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg transition-all transform hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 shadow-emerald-500/25"
                  >
                    <Plus className="mx-auto mb-2 w-6 h-6" />
                    <p className="font-medium">Créer un trajet</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('deliveries')}
                    className="p-4 text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg transition-all transform hover:from-teal-600 hover:to-teal-700 hover:scale-105 shadow-teal-500/25"
                  >
                    <Store className="mx-auto mb-2 w-6 h-6" />
                    <p className="font-medium">Livraisons marchandes</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('relays')}
                    className="p-4 text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg transition-all transform hover:from-purple-600 hover:to-purple-700 hover:scale-105 shadow-purple-500/25"
                  >
                    <Navigation className="mx-auto mb-2 w-6 h-6" />
                    <p className="font-medium">Gérer relais</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('earnings')}
                    className="p-4 text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-lg transition-all transform hover:from-amber-600 hover:to-amber-700 hover:scale-105 shadow-amber-500/25"
                  >
                    <DollarSign className="mx-auto mb-2 w-6 h-6" />
                    <p className="font-medium">Voir gains</p>
                  </button>
                </div>
              </div>
            )}

            {/* Continuing with other tabs... */}
            {activeTab === 'rides' && (
              <div className="space-y-6">
                {!hasSignedContract || isContractExpired ? (
                  <div className="space-y-6">
                    <BlockedFeature
                      title="Création de trajets bloquée"
                      description={
                        isContractExpired 
                          ? "Votre contrat professionnel a expiré. Vous ne pouvez plus créer de trajets."
                          : "Vous devez signer un contrat professionnel pour créer des trajets."
                      }
                      icon={Route}
                      reason={isContractExpired ? "Contrat expiré" : "Signature de contrat requise"}
                    />
                    <div className="text-center">
                      {!isContractExpired && (
                        <button
                          onClick={() => setShowContractModal(true)}
                          className="px-6 py-3 text-white bg-emerald-600 rounded-lg transition-colors hover:bg-emerald-700"
                        >
                          Signer le contrat maintenant
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Trajets</h3>
                      <button
                        onClick={handleCreateRide}
                        className="flex gap-2 items-center px-4 py-2 font-medium text-white bg-emerald-500 rounded-lg transition hover:bg-emerald-600"
                      >
                        <Plus className="w-4 h-4" />
                        Créer un nouveau trajet
                      </button>
                    </div>

                {rides.length > 0 ? (
                  <div className="space-y-4">
                    {rides.map((ride) => (
                      <div key={ride.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">{ride.from} → {ride.to}</h4>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              Départ: {new Date(ride.departureTime).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              ride.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              ride.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {ride.status === 'ACTIVE' ? 'Actif' :
                               ride.status === 'COMPLETED' ? 'Terminé' : ride.status}
                            </span>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              €{ride.pricePerKm}/km
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Capacité</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{ride.availableSpace} places</p>
                          </div>
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Distance</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{ride.distance} km</p>
                          </div>
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Véhicule</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{ride.vehicleType}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Créé le {new Date(ride.createdAt).toLocaleDateString()}</span>
                            {ride.packages && (
                              <span>{ride.packages.length} colis accepté(s)</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </button>
                            <button
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              <Settings className="w-4 h-4" />
                              Modifier
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Route className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun trajet créé</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Vous n'avez pas encore créé de trajet. Commencez par créer votre premier trajet professionnel.
                    </p>
                    <button
                      onClick={handleCreateRide}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-emerald-500 rounded-lg transition hover:bg-emerald-600"
                    >
                      <Plus className="w-5 h-5" />
                      Créer mon premier trajet
                    </button>
                  </div>
                )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deliveries' && (
              <div className="space-y-6 deliveries-section">
                {!hasSignedContract || isContractExpired ? (
                  <div className="space-y-6">
                    <BlockedFeature
                      title="Livraisons marchandes bloquées"
                      description={
                        isContractExpired 
                          ? "Votre contrat professionnel a expiré. Vous ne pouvez plus effectuer de livraisons marchandes."
                          : "Vous devez signer un contrat professionnel pour effectuer des livraisons marchandes."
                      }
                      icon={Store}
                      reason={isContractExpired ? "Contrat expiré" : "Signature de contrat requise"}
                    />
                    <div className="text-center">
                      {!isContractExpired && (
                        <button
                          onClick={() => setShowContractModal(true)}
                          className="px-6 py-3 text-white bg-emerald-600 rounded-lg transition-colors hover:bg-emerald-700"
                        >
                          Signer le contrat maintenant
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="flex gap-2 items-center text-lg font-semibold text-gray-900 dark:text-white">
                        <Store className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        Livraisons Marchandes
                      </h3>
                      <div className="flex gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Actives: {stats.activeDeliveries} • Terminées: {stats.completedDeliveries}
                        </span>
                      </div>
                    </div>

                    {/* Onglets pour séparer actives et historique */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                      <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex px-6 -mb-px space-x-8">
                          <button
                            onClick={() => setActiveDeliveryTab('active')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                              activeDeliveryTab === 'active'
                                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            Livraisons actives ({stats.activeDeliveries})
                          </button>
                          <button
                            onClick={() => setActiveDeliveryTab('history')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                              activeDeliveryTab === 'history'
                                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            Historique ({stats.completedDeliveries})
                          </button>
                        </nav>
                      </div>

                      <div className="p-6">
                        {activeDeliveryTab === 'active' && (
                          <div>
                            {merchantDeliveries.filter(d => ['CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_TRANSIT'].includes(d.status)).length > 0 ? (
                              <div className="space-y-4">
                                {merchantDeliveries.filter(d => ['CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_TRANSIT'].includes(d.status)).map((delivery) => {
                      const statusConfig = getStatusConfig(delivery.status);
                      return (
                        <div key={delivery.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex gap-3 items-center mb-2">
                                <Building className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{delivery.title}</h4>
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.darkBg} ${statusConfig.darkText}`}>
                                  {statusConfig.text}
                                </span>
                                {delivery.isMultiSegment && (
                                  <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-300">
                                    Segment {delivery.segmentNumber}/{delivery.totalSegments}
                                  </span>
                                )}
                              </div>
                              
                              {/* Indicateur de progression des étapes */}
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progression de la livraison</span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {delivery.status === 'CONFIRMED' || delivery.status === 'ACCEPTED_BY_SENDER' ? '1/3' :
                                     delivery.status === 'ACCEPTED_BY_CARRIER' ? '2/3' :
                                     delivery.status === 'IN_TRANSIT' ? '2/3' :
                                     delivery.status === 'DELIVERED' ? '3/3' : '0/3'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {/* Étape 1: Pris en charge */}
                                  <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      ['CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_TRANSIT', 'DELIVERED'].includes(delivery.status)
                                        ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                    }`}>
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Pris en charge</span>
                                  </div>
                                  
                                  {/* Ligne de progression */}
                                  <div className={`flex-1 h-0.5 ${
                                    ['ACCEPTED_BY_CARRIER', 'IN_TRANSIT', 'DELIVERED'].includes(delivery.status)
                                      ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
                                  }`}></div>
                                  
                                  {/* Étape 2: En transit */}
                                  <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      ['IN_TRANSIT', 'DELIVERED'].includes(delivery.status)
                                        ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                    }`}>
                                      <Truck className="w-4 h-4" />
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">En transit</span>
                                  </div>
                                  
                                  {/* Ligne de progression */}
                                  <div className={`flex-1 h-0.5 ${
                                    delivery.status === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                                  }`}></div>
                                  
                                  {/* Étape 3: Livré */}
                                  <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      delivery.status === 'DELIVERED'
                                        ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                    }`}>
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Livré</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Enlèvement</h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.fromAddress}</p>
                                </div>
                                <div>
                                  <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Livraison</h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.toAddress}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                €{delivery.price}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {delivery.weight} kg
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>Marchand: {delivery.senderName}</span>
                              <span>Accepté le {new Date(delivery.acceptedAt || delivery.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDelivery(delivery)}
                                className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                              >
                                <Eye className="w-4 h-4" />
                                Voir détails
                              </button>
                              
                              {(delivery.status === 'CONFIRMED' || delivery.status === 'ACCEPTED_BY_SENDER') && (
                                <button
                                  onClick={() => updateDeliveryStatus(delivery, 'ACCEPTED_BY_CARRIER')}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Prendre en charge
                                </button>
                              )}
                              
                              {delivery.status === 'ACCEPTED_BY_CARRIER' && (
                                <button
                                  onClick={() => updateDeliveryStatus(delivery, 'IN_TRANSIT')}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                                >
                                  <Truck className="w-4 h-4" />
                                  Démarrer transport
                                </button>
                              )}
                              
                              {delivery.status === 'IN_TRANSIT' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => updateDeliveryStatus(delivery, 'DELIVERED')}
                                    className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Marquer comme livré
                                  </button>
                                  <button
                                    onClick={() => handleCreateRelay(delivery)}
                                    className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                  >
                                    <Navigation className="w-4 h-4" />
                                    Créer relais
                                  </button>
                                </div>
                              )}
                              
                              {delivery.status === 'DELIVERED' && checkIfCarrierCanBeRated(delivery) && !hasCarrierBeenRated(delivery) && (
                                <button 
                                  onClick={() => openRatingModal(delivery)}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                >
                                  <Star className="w-4 h-4" />
                                  Évaluer
                                </button>
                              )}
                              
                              {delivery.status === 'DELIVERED' && hasCarrierBeenRated(delivery) && (
                                <div className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                                  <Star className="w-4 h-4" />
                                  Évalué
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Store className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune livraison marchande</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Les livraisons marchandes que vous acceptez apparaîtront ici.
                    </p>
                    <button
                      onClick={handleCreateRide}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-emerald-500 rounded-lg transition hover:bg-emerald-600"
                    >
                      <Plus className="w-5 h-5" />
                      Créer un trajet pour recevoir des propositions
                    </button>
                  </div>
                            )}
                          </div>
                        )}

                        {activeDeliveryTab === 'history' && (
                          <div>
                            {merchantDeliveries.filter(d => d.status === 'DELIVERED').length > 0 ? (
                              <div className="space-y-4">
                                {merchantDeliveries.filter(d => d.status === 'DELIVERED').map((delivery) => {
                                  const statusConfig = getStatusConfig(delivery.status);
                                  return (
                                    <div key={delivery.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                      <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                          <div className="flex gap-3 items-center mb-2">
                                            <Building className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">{delivery.title}</h4>
                                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.darkBg} ${statusConfig.darkText}`}>
                                              {statusConfig.text}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
                                              Terminé le {new Date(delivery.completedAt || delivery.updatedAt).toLocaleDateString('fr-FR')}
                                            </span>
                                          </div>
                                          
                                          <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                              <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Enlèvement</h5>
                                              <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.fromAddress}</p>
                                            </div>
                                            <div>
                                              <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Livraison</h5>
                                              <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.toAddress}</p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            €{delivery.price}
                                          </p>
                                          <p className="text-sm text-green-500 dark:text-green-400">
                                            ✓ Livré avec succès
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {delivery.weight} kg
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                          <span>Marchand: {delivery.senderName}</span>
                                          <span>Livré le {new Date(delivery.completedAt || delivery.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleViewDelivery(delivery)}
                                            className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                                          >
                                            <Eye className="w-4 h-4" />
                                            Voir détails
                                          </button>
                                          
                                          {checkIfCarrierCanBeRated(delivery) && !hasCarrierBeenRated(delivery) && (
                                            <button 
                                              onClick={() => openRatingModal(delivery)}
                                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                            >
                                              <Star className="w-4 h-4" />
                                              Évaluer
                                            </button>
                                          )}
                                          
                                          {hasCarrierBeenRated(delivery) && (
                                            <div className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                                              <Star className="w-4 h-4" />
                                              Évalué
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-8 text-center">
                                <Store className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune livraison terminée</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                  L'historique de vos livraisons terminées apparaîtra ici.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'relays' && (
              <div className="space-y-6 relay-section">
                {!hasSignedContract || isContractExpired ? (
                  <div className="space-y-6">
                    <BlockedFeature
                      title="Système de relais bloqué"
                      description={
                        isContractExpired 
                          ? "Votre contrat professionnel a expiré. Vous ne pouvez plus gérer les relais."
                          : "Vous devez signer un contrat professionnel pour accéder au système de relais."
                      }
                      icon={Navigation}
                      reason={isContractExpired ? "Contrat expiré" : "Signature de contrat requise"}
                    />
                    <div className="text-center">
                      {!isContractExpired && (
                        <button
                          onClick={() => setShowContractModal(true)}
                          className="px-6 py-3 text-white bg-emerald-600 rounded-lg transition-colors hover:bg-emerald-700"
                        >
                          Signer le contrat maintenant
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Système de Relais</h3>
                      <div className="flex gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Propositions: {relayProposals.length} • Relais actifs: {stats.activeRelays}
                        </span>
                      </div>
                    </div>

                {/* Propositions de relais */}
                {relayProposals.length > 0 && (
                  <div>
                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Propositions de relais</h4>
                    <div className="space-y-4">
                      {relayProposals.map((proposal) => (
                        <div key={proposal.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h5 className="text-lg font-medium text-gray-900 dark:text-white">{proposal.packageTitle}</h5>
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Transporteur actuel: {proposal.currentCarrierName}
                              </p>
                              <div className="grid gap-4 mt-3 md:grid-cols-2">
                                <div>
                                  <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Point de récupération</h6>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{proposal.pickupLocation}</p>
                                </div>
                                <div>
                                  <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Destination finale</h6>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{proposal.dropoffLocation}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                €{proposal.proposedPrice}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {proposal.estimatedDistance} km
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>Code de transfert: {proposal.transferCode}</span>
                              <span>Proposé le {new Date(proposal.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptRelayProposal(proposal.id)}
                                className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Accepter le relais
                              </button>
                              <button
                                className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                <Eye className="w-4 h-4" />
                                Voir détails
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relais actifs */}
                {stats.activeRelays > 0 && (
                  <div>
                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Relais en cours</h4>
                    <div className="space-y-4">
                      {merchantDeliveries.filter(d => ['AWAITING_RELAY', 'RELAY_IN_PROGRESS'].includes(d.status)).map((relay) => {
                        const statusConfig = getStatusConfig(relay.status);
                        return (
                          <div key={relay.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex gap-3 items-center mb-2">
                                  <h5 className="text-lg font-medium text-gray-900 dark:text-white">{relay.title}</h5>
                                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.darkBg} ${statusConfig.darkText}`}>
                                    {statusConfig.text}
                                  </span>
                                  <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-300">
                                    Segment {relay.segmentNumber}/{relay.totalSegments}
                                  </span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Position actuelle</h6>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{relay.currentLocation}</p>
                                  </div>
                                  <div>
                                    <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Destination finale</h6>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{relay.finalDestination}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                  €{relay.price}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {relay.weight} kg
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>Marchand: {relay.senderName}</span>
                                <span>Prochaine étape: {relay.nextLocation}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewDelivery(relay)}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir détails
                                </button>
                                {relay.status === 'RELAY_IN_PROGRESS' && (
                                  <button
                                    onClick={() => handleCreateRelay(relay)}
                                    className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                  >
                                    <Navigation className="w-4 h-4" />
                                    Créer nouveau relais
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {relayProposals.length === 0 && stats.activeRelays === 0 && (
                  <div className="p-8 text-center">
                    <Navigation className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun relais actif</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Les propositions de relais et vos relais actifs apparaîtront ici.
                    </p>
                    <button
                      onClick={handleCreateRide}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                    >
                      <Plus className="w-5 h-5" />
                      Créer un trajet pour recevoir des relais
                    </button>
                  </div>
                )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6 earnings-section">
                {!hasSignedContract || isContractExpired ? (
                  <div className="space-y-6">
                    <BlockedFeature
                      title="Gains professionnels bloqués"
                      description={
                        isContractExpired 
                          ? "Votre contrat professionnel a expiré. Vous ne pouvez plus consulter vos gains professionnels."
                          : "Vous devez signer un contrat professionnel pour accéder aux gains professionnels."
                      }
                      icon={DollarSign}
                      reason={isContractExpired ? "Contrat expiré" : "Signature de contrat requise"}
                    />
                    <div className="text-center">
                      {!isContractExpired && (
                        <button
                          onClick={() => setShowContractModal(true)}
                          className="px-6 py-3 text-white bg-emerald-600 rounded-lg transition-colors hover:bg-emerald-700"
                        >
                          Signer le contrat maintenant
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gains Professionnels</h3>
                    
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="p-6 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gains totaux</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">€{stats.totalEarnings.toFixed(2)}</p>
                      </div>
                      <div className="p-6 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ce mois</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">€{earnings.month.toFixed(2)}</p>
                      </div>
                      <div className="p-6 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Moyenne par livraison</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          €{stats.completedDeliveries > 0 ? (stats.totalEarnings / stats.completedDeliveries).toFixed(2) : '0.00'}
                        </p>
                      </div>
                    </div>

                {/* Historique des gains */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Date
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Type
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Marchand
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Description
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Montant
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {merchantDeliveries.filter(d => d.status === 'DELIVERED').map((delivery) => (
                        <tr key={delivery.id}>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                            {new Date(delivery.completedAt || delivery.updatedAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                              {delivery.isMultiSegment ? 'Relais' : 'Livraison'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <Building className="mr-1 w-4 h-4 text-teal-600 dark:text-teal-400" />
                              {delivery.senderName}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {delivery.title}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            €{delivery.price}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full dark:bg-emerald-900 dark:text-emerald-300">
                              Payé
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des contrats professionnels</h2>
                </div>
                
                {userContract ? (
                  <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{userContract.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{userContract.terms?.substring(0, 100)}...</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          userContract.status === 'SIGNED' && !isContractExpired ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          userContract.status === 'PENDING_SIGNATURE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                          isContractExpired ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {userContract.status === 'SIGNED' && !isContractExpired ? 'Actif' :
                           userContract.status === 'PENDING_SIGNATURE' ? 'En attente de signature' :
                           isContractExpired ? 'Expiré' :
                           userContract.status}
                        </span>
                        {userContract.value && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Rémunération: {userContract.value}€
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Type:</strong> {userContract.endDate ? 'CDD' : 'CDI'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Créé le:</strong> {new Date(userContract.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                        {userContract.startDate && (
                          <p className="text-gray-600 dark:text-gray-400">
                            <strong>Début:</strong> {new Date(userContract.startDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        {userContract.signedAt && (
                          <p className="text-green-600 dark:text-green-400">
                            <strong>Signé le:</strong> {new Date(userContract.signedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <div>
                        {userContract.endDate && (
                          <p className={`${isContractExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            <strong>Fin:</strong> {new Date(userContract.endDate).toLocaleDateString('fr-FR')}
                            {isContractExpired && (
                              <span className="px-2 py-1 ml-2 text-xs font-medium text-red-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-red-300">
                                Expiré
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex mt-4 space-x-3">
                      <button 
                        onClick={() => setShowContractModal(true)}
                        className="flex items-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        <Eye className="mr-1 w-4 h-4" />
                        Voir le contrat
                      </button>
                      {userContract.status === 'PENDING_SIGNATURE' && (
                        <button 
                          onClick={() => setShowContractModal(true)}
                          className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FileText className="mr-1 w-4 h-4" />
                          Signer maintenant
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun contrat</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Aucun contrat professionnel n'a été assigné à votre compte pour le moment.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 reviews-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Avis des Marchands</h3>
                  <div className="flex gap-2 items-center">
                    <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stats.averageRating}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({reviews.length} avis)
                    </span>
                  </div>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex gap-3 items-center mb-2">
                              <div className="flex gap-1 items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                  />
                                ))}
                              </div>
                              <div className="flex gap-1 items-center">
                                <Building className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {review.customerName}
                                </p>
                              </div>
                            </div>
                            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                              <strong>Livraison:</strong> {review.deliveryTitle}
                            </p>
                            <p className="text-gray-900 dark:text-white">
                              {review.comment}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Star className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun avis pour le moment</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Les avis des marchands apparaîtront ici après la completion de vos livraisons.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const unreadNotifications = notifications.filter(n => !n.isRead);
                        for (const notification of unreadNotifications) {
                          await markNotificationAsRead(notification.id);
                        }
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Tout marquer comme lu
                    </button>
                  </div>
                </div>

                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 rounded-lg border transition-colors ${
                          !notification.isRead 
                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
                            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-1 gap-3 items-start">
                            {!notification.isRead && (
                              <div className="mt-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            )}
                            <div className="flex-1">
                              <div className="flex gap-2 items-center mb-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </h4>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  notification.type === 'MATCH_PROPOSED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                  notification.type === 'MATCH_UPDATE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' :
                                  notification.type === 'DELIVERY_ASSIGNED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' :
                                  notification.type === 'RELAY_REQUEST' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                }`}>
                                  {notification.type === 'MATCH_PROPOSED' ? 'Proposition' :
                                   notification.type === 'MATCH_UPDATE' ? 'Accepté' :
                                   notification.type === 'DELIVERY_ASSIGNED' ? 'Livraison' :
                                   notification.type === 'RELAY_REQUEST' ? 'Relais' :
                                   notification.type}
                                </span>
                              </div>
                              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {notification.type === 'MATCH_PROPOSED' && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  setActiveTab('deliveries');
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-emerald-500 rounded-lg transition hover:bg-emerald-600"
                              >
                                Voir proposition
                              </button>
                            )}
                            {notification.type === 'MATCH_UPDATE' && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  setActiveTab('deliveries');
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-emerald-500 rounded-lg transition hover:bg-emerald-600"
                              >
                                Voir livraison
                              </button>
                            )}
                            {notification.type === 'RELAY_REQUEST' && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  setActiveTab('relays');
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                              >
                                Voir relais
                              </button>
                            )}
                            {!notification.isRead && (
                              <button
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="Marquer comme lu"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Clock className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune notification</h3>
                    <p className="text-gray-600 dark:text-gray-400">Vos notifications apparaîtront ici</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const unreadConversations = conversations.filter(c => c.unreadCount > 0);
                        for (const conversation of unreadConversations) {
                          await markConversationAsRead(conversation.partner.id);
                        }
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Tout marquer comme lu
                    </button>
                    <Link
                      href="/messages"
                      className="px-3 py-1 text-sm font-medium text-white bg-emerald-500 rounded-lg transition hover:bg-emerald-600"
                    >
                      Ouvrir la messagerie complète
                    </Link>
                  </div>
                </div>

                <div className="overflow-hidden bg-white rounded-lg shadow-sm dark:bg-gray-800" style={{ height: '500px' }}>
                  <div className="flex h-full">
                    {/* Conversations List */}
                    <div className="flex flex-col w-2/5 border-r border-gray-200 dark:border-gray-700">
                      <div className="p-3 bg-emerald-50 border-b border-gray-200 dark:bg-emerald-900/20 dark:border-gray-700">
                        <div className="flex gap-2 items-center">
                          <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Conversations</h4>
                          {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                            <span className="inline-flex justify-center items-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                              {conversations.filter(c => c.unreadCount > 0).length}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="overflow-y-auto flex-1">
                        {messagesLoading ? (
                          <div className="flex justify-center items-center h-32">
                            <div className="w-6 h-6 rounded-full border-2 border-emerald-400 animate-spin border-t-transparent"></div>
                          </div>
                        ) : conversations.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            <div className="mb-2 text-2xl">💬</div>
                            <p className="text-sm">Aucune conversation</p>
                            <p className="mt-1 text-xs">Les marchands vous contacteront via vos livraisons</p>
                          </div>
                        ) : (
                          conversations.map((conversation) => (
                            <div
                              key={conversation.partner.id}
                              onClick={() => setSelectedConversation(conversation.partner)}
                              className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                                selectedConversation?.id === conversation.partner.id ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : ''
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <div className="flex justify-center items-center w-8 h-8 text-xs font-semibold text-white bg-emerald-500 rounded-full">
                                    {conversation.partner.firstName?.[0]}{conversation.partner.lastName?.[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex gap-1 items-center">
                                      <Building className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                        {conversation.partner.firstName} {conversation.partner.lastName}
                                      </p>
                                    </div>
                                    {conversation.lastMessage && (
                                      <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                                        {conversation.lastMessage.content}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                  {conversation.lastMessage && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      {formatMessageTime(conversation.lastMessage.createdAt)}
                                    </span>
                                  )}
                                  {conversation.unreadCount > 0 && (
                                    <span className="bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                                      {conversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex flex-col flex-1">
                      {selectedConversation ? (
                        <>
                          {/* Chat Header */}
                          <div className="p-3 bg-emerald-50 border-b border-gray-200 dark:bg-emerald-900/20 dark:border-gray-700">
                            <div className="flex items-center space-x-2">
                              <div className="flex justify-center items-center w-8 h-8 text-xs font-semibold text-white bg-emerald-500 rounded-full">
                                {selectedConversation.firstName?.[0]}{selectedConversation.lastName?.[0]}
                              </div>
                              <div>
                                <div className="flex gap-1 items-center">
                                  <Building className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {selectedConversation.firstName} {selectedConversation.lastName}
                                  </h4>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedConversation.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Messages */}
                          <div className="overflow-y-auto flex-1 p-3 space-y-3">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs px-3 py-2 rounded-lg ${
                                    message.senderId === user?.id
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    message.senderId === user?.id ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {formatMessageTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Message Input */}
                          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <form onSubmit={sendMessage} className="flex space-x-2">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Tapez votre message..."
                                className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                disabled={sendingMessage}
                              />
                              <button
                                type="submit"
                                disabled={!newMessage.trim() || sendingMessage}
                                className="flex gap-1 items-center px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-full transition hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                <Send className="w-3 h-3" />
                                {sendingMessage ? 'Envoi...' : 'Envoyer'}
                              </button>
                            </form>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-1 justify-center items-center">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <div className="mb-4 text-4xl">💬</div>
                            <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Sélectionnez une conversation</h4>
                            <p className="text-sm">Choisissez une conversation pour commencer à chatter</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {conversations.length === 0 && (
                  <div className="p-6 text-center bg-gray-50 rounded-lg dark:bg-gray-800">
                    <MessageCircle className="mx-auto mb-3 w-8 h-8 text-gray-400" />
                    <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Pas encore de conversations</h4>
                    <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                      Les conversations avec les marchands apparaîtront ici quand vous accepterez des livraisons.
                    </p>
                    <button
                      onClick={handleCreateRide}
                      className="inline-block px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg transition hover:bg-emerald-600"
                    >
                      Créer un trajet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contract Signature Modal */}
      {showContractModal && userContract && (
        <ContractSignatureModal 
          contract={userContract}
          onClose={() => setShowContractModal(false)}
          onContractSigned={handleContractSigned}
        />
      )}

      {/* Modal RelayManager */}
      {isRelayModalOpen && selectedDelivery && (
        <RelayManager
          isOpen={isRelayModalOpen}
          onClose={() => {
            setIsRelayModalOpen(false);
            setSelectedDelivery(null);
          }}
          packageId={selectedDelivery.id}
          onRelayCreated={() => {
            setIsRelayModalOpen(false);
            setSelectedDelivery(null);
            refreshData();
          }}
        />
      )}

      {/* Modal d'évaluation du livreur */}
      {showRatingModal && selectedPackageForRating && (
        <div className="overflow-y-auto fixed inset-0 z-50 flex justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full dark:bg-gray-800">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Évaluer le livreur
                </h3>
                <button
                  onClick={closeRatingModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedPackageForRating.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPackageForRating.fromAddress} → {selectedPackageForRating.toAddress}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note (obligatoire)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        <Star className="w-full h-full" fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Partagez votre expérience avec ce livreur..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeRatingModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={rating === 0 || submittingRating}
                    className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingRating ? 'Envoi...' : 'Envoyer l\'évaluation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton tutoriel dans l'interface utilisateur */}
      <div className="fixed right-4 bottom-4 z-30">
        <button
          onClick={forceTutorial}
          className="flex gap-2 items-center px-4 py-2 text-white bg-emerald-500 rounded-full shadow-lg transition-all transform hover:bg-emerald-600 hover:scale-105"
          title="Relancer le tutoriel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Guide Pro
        </button>
      </div>

      {/* Composant TutorialOverlay */}
      <TutorialOverlay
        userRole={user?.role}
        onComplete={completeTutorial}
        isVisible={showTutorial}
      />
    </div>
  );
}




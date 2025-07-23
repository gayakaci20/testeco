import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import RoleBasedNavigation from '../../components/RoleBasedNavigation';
import TutorialOverlay from '../../components/TutorialOverlay';
import { useTutorial } from '../../components/useTutorial';
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  Plus,
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Eye,
  Settings,
  Users,
  MapPin,
  Phone,
  Mail,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Download,
  Edit3,
  Trash2,
  MoreHorizontal,
  Shield,
  AlertTriangle,
  ExclamationTriangle,
  Building
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
      console.log('🖊️ Tentative de signature du contrat prestataire:', {
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
              <Shield className="mr-3 w-6 h-6 text-sky-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Signature du Contrat Prestataire Professionnel
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
            <div className="p-4 mb-6 bg-sky-50 rounded-lg dark:bg-sky-900/20">
              <h5 className="mb-2 font-medium text-sky-900 dark:text-sky-100">Conditions de rémunération :</h5>
              <p className="text-lg font-bold text-sky-800 dark:text-sky-200">
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
              id="agreeToProviderContract"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mr-3 w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
              disabled={isContractExpired}
            />
            <label htmlFor="agreeToProviderContract" className="text-sm text-gray-700 dark:text-gray-300">
              J'ai lu et j'accepte les termes et conditions de ce contrat professionnel. 
              Je comprends que cette signature est légalement contraignante et me permet d'exercer en tant que prestataire professionnel.
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
              className="flex-1 px-4 py-2 text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
              : `Vous devez signer le contrat professionnel "${contract.title}" pour accéder aux fonctionnalités prestataire professionnel.`
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

export default function SpecializedProviderDashboard({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Tutoriel
  const { showTutorial, completeTutorial, forceTutorial } = useTutorial(user?.role);
  
  // Contract state
  const [contracts, setContracts] = useState([]);
  const [userContract, setUserContract] = useState(null);
  const [hasSignedContract, setHasSignedContract] = useState(false);
  const [isContractExpired, setIsContractExpired] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  
  // Main state
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [earnings, setEarnings] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('week'); // week, month
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [availabilitySettings, setAvailabilitySettings] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SERVICE_PROVIDER' && user.role !== 'PROVIDER'))) {
      router.push('/login');
      return;
    }

    // Rediriger les prestataires non-professionnels vers le dashboard standard
    if (user && ((user.role === 'SERVICE_PROVIDER' && user.userType !== 'PROFESSIONAL') || 
                 (user.role === 'PROVIDER' && user.userType !== 'PROFESSIONAL'))) {
      router.replace('/dashboard/provider');
      return;
    }

    // Accepter les utilisateurs PROVIDER professionnels ou SERVICE_PROVIDER professionnels
    if (user && ((user.role === 'PROVIDER' && user.userType === 'PROFESSIONAL') || 
                 (user.role === 'SERVICE_PROVIDER' && user.userType === 'PROFESSIONAL'))) {
      fetchDashboardData();
      fetchUserContract();
    }
  }, [user, loading, router]);

  // Effet séparé pour gérer le message de succès
  useEffect(() => {
    // Vérifier si un service vient d'être créé
    if (router.query.serviceCreated && user) {
      setShowSuccessMessage(true);
      // Rafraîchir les données du dashboard
      fetchDashboardData();
      // Effacer le paramètre de l'URL après 5 secondes
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.replace('/dashboard/proprovider', undefined, { shallow: true });
      }, 5000);
    }
  }, [router.query.serviceCreated, router, user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch specialized service provider data
      const response = await fetch('/api/dashboard/specialized-provider', {
        headers: {
          'x-user-id': user.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
        setServices(data.services || []);
        setClients(data.clients || []);
        setEarnings(data.earnings || { today: 0, week: 0, month: 0, total: 0 });
        setAvailabilitySettings(data.availability || {});
        setInvoices(data.invoices || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserContract = async () => {
    try {
      console.log('📞 Récupération des contrats pour le prestataire professionnel:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        userType: user.userType
      });

      // Les prestataires de services sont traités comme des merchants dans la logique des contrats
      const response = await fetch(`/api/contracts?merchantId=${user.id}`, {
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
        
        // Filtrer les contrats pour ce prestataire (merchantId correspond à l'ID de l'utilisateur)
        const userContracts = contractsData.filter(contract => contract.merchantId === user.id);
        console.log('📊 Contrats filtrés pour le prestataire:', userContracts);
        
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
          console.log('❌ Aucun contrat trouvé pour ce prestataire');
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

  const handleContractSigned = () => {
    setHasSignedContract(true);
    setIsContractExpired(false);
    fetchUserContract();
    fetchDashboardData();
  };

  const handleCreateService = () => {
    router.push('/services/create');
  };

  const handleAddAppointment = async (appointmentData) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        fetchDashboardData();
        setShowAddAppointment(false);
        alert('Rendez-vous créé avec succès!');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const generateInvoice = async (appointmentId) => {
    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId })
      });

      if (response.ok) {
        fetchDashboardData();
        alert('Facture générée avec succès!');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  };

  const getCalendarDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay()); // Start of week
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledAt);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return !hasSignedContract || isContractExpired ? (
          <div className="space-y-6">
            <BlockedFeature
              title="Calendrier des rendez-vous bloqué"
              description={
                isContractExpired 
                  ? "Votre contrat professionnel a expiré. Vous ne pouvez plus gérer vos rendez-vous."
                  : "Vous devez signer un contrat professionnel pour accéder au calendrier des rendez-vous."
              }
              icon={Calendar}
              reason={isContractExpired ? "Contrat expiré" : "Signature de contrat requise"}
            />
            <div className="text-center">
              {!isContractExpired && (
                <button
                  onClick={() => setShowContractModal(true)}
                  className="px-6 py-3 text-white bg-sky-600 rounded-lg transition-colors hover:bg-sky-700"
                >
                  Signer le contrat maintenant
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier des rendez-vous</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAddAppointment(true)}
                  className="flex items-center px-4 py-2 text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Nouveau RDV
                </button>
                <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-2 text-sm ${calendarView === 'week' ? 'bg-sky-500 text-white' : 'text-gray-600'}`}
                  >
                    Semaine
                  </button>
                  <button
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-2 text-sm ${calendarView === 'month' ? 'bg-sky-500 text-white' : 'text-gray-600'}`}
                  >
                    Mois
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(selectedDate.getDate() - 7);
                  setSelectedDate(newDate);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(selectedDate.getDate() + 7);
                  setSelectedDate(newDate);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekly Calendar */}
            <div className="overflow-hidden bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
                {getCalendarDays().map((day, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg font-semibold ${
                          day.toDateString() === new Date().toDateString() 
                            ? 'text-sky-600' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {day.getDate()}
                        </div>
                      </div>
                    </div>
                    <div className="p-2 min-h-48">
                      {getAppointmentsForDay(day).map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`mb-2 p-2 rounded text-sm cursor-pointer hover:opacity-80 ${
                            appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                          onClick={() => router.push(`/appointments/${appointment.id}`)}
                        >
                          <div className="font-medium">{formatTime(appointment.scheduledAt)}</div>
                          <div className="text-xs">{appointment.clientName}</div>
                          <div className="text-xs">{appointment.serviceName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Rendez-vous du jour
              </h3>
              <div className="space-y-3">
                {getAppointmentsForDay(new Date()).map((appointment) => (
                  <div key={appointment.id} className="flex justify-between items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="flex justify-center items-center w-12 h-12 bg-sky-100 rounded-full dark:bg-sky-900">
                        <User className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{appointment.clientName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.serviceName}</p>
                        <p className="text-sm text-gray-500">{formatTime(appointment.scheduledAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status}
                      </span>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'services':
        return !hasSignedContract || isContractExpired ? (
          <div className="space-y-6">
            <BlockedFeature
              title="Gestion des services bloquée"
              description={
                isContractExpired 
                  ? "Votre contrat professionnel a expiré. Vous ne pouvez plus gérer vos services."
                  : "Vous devez signer un contrat professionnel pour gérer vos services spécialisés."
              }
              icon={Settings}
              reason={isContractExpired ? "Contrat expiré" : "Signature de contrat requise"}
            />
            <div className="text-center">
              {!isContractExpired && (
                <button
                  onClick={() => setShowContractModal(true)}
                  className="px-6 py-3 text-white bg-sky-600 rounded-lg transition-colors hover:bg-sky-700"
                >
                  Signer le contrat maintenant
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mes services spécialisés</h2>
              <button 
                onClick={handleCreateService}
                className="flex items-center px-4 py-2 text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
              >
                <Plus className="mr-2 w-4 h-4" />
                Nouveau service
              </button>
            </div>

            {services.length > 0 ? (
              <div className="grid gap-6">
                {services.map((service) => (
                  <div key={service.id} className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">{service.description}</p>
                        <div className="flex items-center mt-3 space-x-4">
                          <span className="text-lg font-bold text-sky-600">€{service.price}</span>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-gray-600">{service.rating || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {service.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {service.bookingsCount || 0} réservations
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-lg dark:bg-gray-800">
                <Settings className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun service spécialisé</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  Vous n'avez pas encore créé de service spécialisé. Commencez par créer votre premier service professionnel.
                </p>
                <button
                  onClick={handleCreateService}
                  className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
                >
                  <Plus className="w-5 h-5" />
                  Créer mon premier service
                </button>
              </div>
            )}
          </div>
        );

      case 'clients':
        return !hasSignedContract || isContractExpired ? (
          <div className="space-y-6">
            <BlockedFeature
              title="Gestion des clients bloquée"
              description={
                isContractExpired 
                  ? "Votre contrat professionnel a expiré. Vous ne pouvez plus gérer vos clients."
                  : "Vous devez signer un contrat professionnel pour accéder à la gestion des clients."
              }
              icon={Users}
              reason={isContractExpired ? "Contrat expiré" : "Signature de contrat requise"}
            />
            <div className="text-center">
              {!isContractExpired && (
                <button
                  onClick={() => setShowContractModal(true)}
                  className="px-6 py-3 text-white bg-sky-600 rounded-lg transition-colors hover:bg-sky-700"
                >
                  Signer le contrat maintenant
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des clients</h2>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    className="py-2 pr-4 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <button className="flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Filter className="mr-2 w-4 h-4" />
                  Filtres
                </button>
              </div>
            </div>

            <div className="overflow-hidden bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Client
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Dernière visite
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Total dépensé
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex justify-center items-center w-10 h-10 bg-sky-100 rounded-full">
                              <User className="w-5 h-5 text-sky-600" />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                              <div className="text-sm text-gray-500">Client depuis {client.memberSince}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900 dark:text-white">{client.email}</div>
                          <div className="text-sm text-gray-500">{client.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {client.lastVisit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">€{client.totalSpent}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button className="text-sky-600 hover:text-sky-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button className="text-blue-600 hover:text-blue-900">
                              <Mail className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'invoices':
        return !hasSignedContract || isContractExpired ? (
          <div className="space-y-6">
            <BlockedFeature
              title="Facturation professionnelle bloquée"
              description={
                isContractExpired 
                  ? "Votre contrat professionnel a expiré. Vous ne pouvez plus gérer vos factures."
                  : "Vous devez signer un contrat professionnel pour accéder à la facturation automatique."
              }
              icon={FileText}
              reason={isContractExpired ? "Contrat expiré" : "Signature de contrat requise"}
            />
            <div className="text-center">
              {!isContractExpired && (
                <button
                  onClick={() => setShowContractModal(true)}
                  className="px-6 py-3 text-white bg-sky-600 rounded-lg transition-colors hover:bg-sky-700"
                >
                  Signer le contrat maintenant
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Facturation automatique</h2>
              <button className="flex items-center px-4 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600">
                <Download className="mr-2 w-4 h-4" />
                Exporter
              </button>
            </div>

            {/* Earnings Summary */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Aujourd'hui</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">€{earnings.today || '0.00'}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cette semaine</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">€{earnings.week || '0.00'}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ce mois</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">€{earnings.month || '0.00'}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">€{earnings.total || '0.00'}</p>
                  </div>
                  <Package className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="overflow-hidden bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Facture
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Client
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Service
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Date
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">#{invoice.number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900 dark:text-white">{invoice.clientName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900 dark:text-white">{invoice.serviceName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">€{invoice.amount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button className="text-sky-600 hover:text-sky-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'contracts':
        return (
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
                        Conditions: {userContract.value}€
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
                    className="flex items-center text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Prestataire Spécialisé Professionnel - ecodeli</title>
        <meta name="description" content="Gérez vos services spécialisés avec calendrier et facturation professionnelle" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header avec RoleBasedNavigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                <Building className="inline mr-2 w-8 h-8 text-sky-600" />
                Services Spécialisés Pro
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Prestataire professionnel - Gérez vos rendez-vous et facturation
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateService}
                className="flex items-center gap-2 px-6 py-3 font-medium text-white transition rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105 shadow-lg shadow-green-500/25"
              >
                <Plus className="w-4 h-4" />
                Créer un service
              </button>
              <button
                onClick={() => setShowAddAppointment(true)}
                className="flex items-center gap-2 px-6 py-3 font-medium text-white transition rounded-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 transform hover:scale-105 shadow-lg shadow-sky-500/25"
              >
                <Plus className="w-4 h-4" />
                Nouveau RDV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Message de succès */}
        {showSuccessMessage && (
          <div className="mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center">
                <CheckCircle className="mr-3 w-5 h-5 text-green-400" />
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Service créé avec succès !
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Votre service spécialisé a été enregistré et est maintenant disponible pour les clients.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contract Warning Banner */}
        {userContract && (!hasSignedContract || isContractExpired) && (
          <ContractWarningBanner 
            contract={userContract} 
            onSignContract={() => setShowContractModal(true)}
          />
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gains aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{earnings.today || '0.00'}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">RDV cette semaine</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{earnings.week || '0.00'}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gains ce mois</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{earnings.month || '0.00'}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total gains</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{earnings.total || '0.00'}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900">
                <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-6 -mb-px space-x-8">
              {[
                { id: 'calendar', label: 'Calendrier', icon: Calendar, blocked: !hasSignedContract || isContractExpired },
                { id: 'services', label: 'Services', icon: Settings, blocked: !hasSignedContract || isContractExpired },
                { id: 'clients', label: 'Clients', icon: Users, blocked: !hasSignedContract || isContractExpired },
                { id: 'invoices', label: 'Facturation', icon: FileText, blocked: !hasSignedContract || isContractExpired },
                { id: 'contracts', label: 'Contrats', icon: Shield, badge: userContract && (!hasSignedContract || isContractExpired) ? 1 : 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={tab.blocked}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                      : tab.blocked
                      ? 'border-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
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
            {renderTabContent()}
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

      {/* Bouton tutoriel dans l'interface utilisateur */}
      <div className="fixed bottom-4 right-4 z-30">
        <button
          onClick={forceTutorial}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all transform hover:scale-105"
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
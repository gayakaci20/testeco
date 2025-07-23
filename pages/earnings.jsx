import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Clock, 
  Download,
  Eye,
  EyeOff,
  Banknote,
  Edit2,
  Check,
  X,
  AlertCircle,
  Info,
  RefreshCw,
  FileText,
  Star,
  Award,
  Activity
} from 'lucide-react';

export default function Earnings({ isDarkMode, toggleDarkMode }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState(null);
  const [bankingInfo, setBankingInfo] = useState(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [editingBanking, setEditingBanking] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolder: '',
    iban: '',
    bic: '',
    bankName: '',
    address: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Vérifier si l'utilisateur a le droit d'accéder aux earnings
        const allowedRoles = ['CARRIER', 'MERCHANT', 'PROVIDER', 'SERVICE_PROVIDER'];
        if (!allowedRoles.includes(userData.role)) {
          router.push('/dashboard');
          return;
        }
        
        await fetchEarningsData(userData.id, userData.role);
        await fetchBankingInfo(userData.id);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchEarningsData = async (userId, userRole) => {
    try {
      const response = await fetch(`/api/earnings?role=${userRole}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setEarningsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch earnings data:', error);
    }
  };

  const fetchBankingInfo = async (userId) => {
    try {
      const response = await fetch('/api/banking-info', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setBankingInfo(data);
        if (data) {
          setBankForm({
            accountHolder: data.accountHolder || '',
            iban: data.iban || '',
            bic: data.bic || '',
            bankName: data.bankName || '',
            address: data.address || ''
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch banking info:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchEarningsData(user.id, user.role),
      fetchBankingInfo(user.id)
    ]);
    setLoading(false);
  };

  const handleBankFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/banking-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(bankForm)
      });

      if (response.ok) {
        const data = await response.json();
        setBankingInfo(data);
        setEditingBanking(false);
        alert('Coordonnées bancaires mises à jour avec succès!');
      } else {
        alert('Erreur lors de la mise à jour des coordonnées bancaires');
      }
    } catch (error) {
      console.error('Failed to update banking info:', error);
      alert('Erreur lors de la mise à jour des coordonnées bancaires');
    }
  };

  const getPaymentScheduleText = (userRole) => {
    switch (userRole) {
      case 'CARRIER':
        return 'Les paiements sont effectués chaque vendredi pour les livraisons terminées dans la semaine.';
      case 'MERCHANT':
        return 'Les paiements sont effectués le 15 et le 30 de chaque mois pour les commandes livrées.';
      case 'PROVIDER':
      case 'SERVICE_PROVIDER':
        return 'Les paiements sont effectués dans les 5 jours ouvrables après la fin du service.';
      default:
        return 'Les paiements sont effectués selon les conditions de votre contrat.';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'CARRIER': return 'Transporteur';
      case 'MERCHANT': return 'Marchand';
      case 'PROVIDER': return 'Prestataire';
      case 'SERVICE_PROVIDER': return 'Prestataire de services';
      default: return role;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const maskIban = (iban) => {
    if (!iban) return '';
    return iban.substring(0, 4) + '*'.repeat(iban.length - 8) + iban.substring(iban.length - 4);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement de vos gains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Mes Gains - ecodeli</title>
        <meta name="description" content="Gérez vos gains et informations bancaires" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header avec RoleBasedNavigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mes Gains
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Tableau de bord des gains pour {getRoleDisplayName(user?.role)}
              </p>
            </div>
            <button
              onClick={refreshData}
              className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-green-600 hover:to-green-700 shadow-green-500/25"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Earnings Overview Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total des gains</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(earningsData?.totalEarnings || 0)}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full dark:from-green-900 dark:to-green-800">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ce mois</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(earningsData?.monthlyEarnings || 0)}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full dark:from-blue-900 dark:to-blue-800">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(earningsData?.pendingEarnings || 0)}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full dark:from-orange-900 dark:to-orange-800">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prochain paiement</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {earningsData?.nextPaymentDate || 'À déterminer'}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full dark:from-purple-900 dark:to-purple-800">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Earnings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="flex gap-2 items-center text-lg font-medium text-gray-900 dark:text-white">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                Gains récents
              </h3>
            </div>
            <div className="p-6">
              {earningsData?.recentEarnings?.length > 0 ? (
                <div className="space-y-4">
                  {earningsData.recentEarnings.map((earning, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{earning.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{earning.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(earning.amount)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{earning.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Activity className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">Aucun gain récent</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="flex gap-2 items-center text-lg font-medium text-gray-900 dark:text-white">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Calendrier des paiements
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-start mb-4 space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getPaymentScheduleText(user?.role)}
                </p>
              </div>
              
              {earningsData?.upcomingPayments?.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Paiements à venir</h4>
                  {earningsData.upcomingPayments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg dark:from-blue-900/20 dark:to-indigo-900/20">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{payment.date}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{payment.description}</p>
                      </div>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Calendar className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">Aucun paiement programmé</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="flex gap-2 items-center text-lg font-medium text-gray-900 dark:text-white">
                <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />
                Coordonnées bancaires
              </h3>
              <button
                onClick={() => setEditingBanking(!editingBanking)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-md"
              >
                <Edit2 className="mr-2 w-4 h-4" />
                {editingBanking ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {editingBanking ? (
              <form onSubmit={handleBankFormSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Titulaire du compte
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountHolder}
                      onChange={(e) => setBankForm({...bankForm, accountHolder: e.target.value})}
                      className="px-4 py-3 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom de la banque
                    </label>
                    <input
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                      className="px-4 py-3 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      IBAN
                    </label>
                    <input
                      type="text"
                      value={bankForm.iban}
                      onChange={(e) => setBankForm({...bankForm, iban: e.target.value})}
                      className="px-4 py-3 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                      placeholder="FR14 2004 1010 0505 0001 3M02 606"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      BIC/SWIFT
                    </label>
                    <input
                      type="text"
                      value={bankForm.bic}
                      onChange={(e) => setBankForm({...bankForm, bic: e.target.value})}
                      className="px-4 py-3 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                      placeholder="BNPAFRPP"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adresse de la banque
                  </label>
                  <textarea
                    value={bankForm.address}
                    onChange={(e) => setBankForm({...bankForm, address: e.target.value})}
                    rows={3}
                    className="px-4 py-3 w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                    placeholder="Adresse complète de la banque"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingBanking(false)}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-200 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm transition-all hover:from-green-600 hover:to-green-700 hover:shadow-md"
                  >
                    Sauvegarder
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {bankingInfo ? (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Titulaire du compte</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{bankingInfo.accountHolder}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Banque</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{bankingInfo.bankName}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">IBAN</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                            {showBankDetails ? bankingInfo.iban : maskIban(bankingInfo.iban)}
                          </p>
                          <button
                            onClick={() => setShowBankDetails(!showBankDetails)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                          >
                            {showBankDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">BIC</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white font-mono">{bankingInfo.bic}</p>
                      </div>
                    </div>
                    {bankingInfo.address && (
                      <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse de la banque</p>
                        <p className="mt-1 text-gray-900 dark:text-white">{bankingInfo.address}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center dark:from-green-900 dark:to-green-800">
                      <Banknote className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune coordonnée bancaire</h3>
                    <p className="mb-6 text-gray-500 dark:text-gray-400">
                      Ajoutez vos coordonnées bancaires pour recevoir vos paiements
                    </p>
                    <button
                      onClick={() => setEditingBanking(true)}
                      className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg shadow-sm transition-all hover:from-sky-600 hover:to-sky-700 hover:shadow-md"
                    >
                      <Banknote className="mr-2 w-5 h-5" />
                      Ajouter mes coordonnées bancaires
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="flex gap-2 items-center text-lg font-medium text-gray-900 dark:text-white">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Exporter les données
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <button className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-sm transition-all hover:from-red-600 hover:to-red-700 hover:shadow-md">
                <Download className="mr-2 w-4 h-4" />
                Exporter en PDF
              </button>
              <button className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm transition-all hover:from-green-600 hover:to-green-700 hover:shadow-md">
                <Download className="mr-2 w-4 h-4" />
                Exporter en Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
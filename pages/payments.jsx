import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  DollarSign,
  CreditCard,
  FileText,
  Calendar,
  Download,
  Eye,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Settings,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Target,
  Package,
  Truck,
  Users,
  Store
} from 'lucide-react';

export default function PaymentsPage({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchPaymentData();
    }
  }, [user, loading, router]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter, dateRange]);

  const fetchPaymentData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all payment related data
      const [transactionsRes, invoicesRes, methodsRes] = await Promise.all([
        fetch('/api/payments', {
          headers: { 'x-user-id': user?.id || 'demo-user-id' }
        }),
        fetch('/api/invoices', {
          headers: { 'x-user-id': user?.id || 'demo-user-id' }
        }),
        fetch('/api/payment-methods', {
          headers: { 'x-user-id': user?.id || 'demo-user-id' }
        })
      ]);

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data);
        calculateAnalytics(data);
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data);
      }

      if (methodsRes.ok) {
        const data = await methodsRes.json();
        setPaymentMethods(data);
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données de paiement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = (transactionData) => {
    const now = new Date();
    const thisMonth = transactionData.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    });

    const lastMonth = transactionData.filter(t => {
      const transactionDate = new Date(t.createdAt);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return transactionDate.getMonth() === lastMonth.getMonth() && 
             transactionDate.getFullYear() === lastMonth.getFullYear();
    });

    const completedTransactions = transactionData.filter(t => t.status === 'COMPLETED');
    const totalIncome = completedTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = completedTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthIncome = thisMonth
      .filter(t => t.status === 'COMPLETED' && t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastMonthIncome = lastMonth
      .filter(t => t.status === 'COMPLETED' && t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeGrowth = lastMonthIncome > 0 
      ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1)
      : 0;

    setAnalytics({
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      thisMonthIncome,
      lastMonthIncome,
      incomeGrowth: parseFloat(incomeGrowth),
      totalTransactions: transactionData.length,
      pendingTransactions: transactionData.filter(t => t.status === 'PENDING').length,
      completedTransactions: completedTransactions.length,
      failedTransactions: transactionData.filter(t => t.status === 'FAILED').length
    });
  };

  const filterTransactions = () => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      
      let matchesDate = true;
      if (dateRange !== 'all') {
        const transactionDate = new Date(transaction.createdAt);
        const now = new Date();
        
        switch (dateRange) {
          case 'today':
            matchesDate = transactionDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            matchesDate = transactionDate >= weekAgo;
            break;
          case 'month':
            matchesDate = transactionDate.getMonth() === now.getMonth() && 
                         transactionDate.getFullYear() === now.getFullYear();
            break;
          case 'year':
            matchesDate = transactionDate.getFullYear() === now.getFullYear();
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredTransactions(filtered);
  };

  const handleAddPaymentMethod = async (methodData) => {
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user-id'
        },
        body: JSON.stringify(methodData)
      });

      if (response.ok) {
        fetchPaymentData();
        setShowAddPaymentMethod(false);
        alert('Méthode de paiement ajoutée avec succès!');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la méthode de paiement:', error);
      alert('Erreur lors de l\'ajout de la méthode de paiement');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'FAILED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'FAILED': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTransactionIcon = (type, category) => {
    if (type === 'INCOME') {
      return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    } else {
      switch (category) {
        case 'DELIVERY': return <Package className="w-5 h-5 text-blue-500" />;
        case 'TRANSPORT': return <Truck className="w-5 h-5 text-purple-500" />;
        case 'SERVICE': return <Users className="w-5 h-5 text-orange-500" />;
        case 'PURCHASE': return <Store className="w-5 h-5 text-pink-500" />;
        default: return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      }
    }
  };

  const formatAmount = (amount, type) => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
    
    return type === 'INCOME' ? `+${formatted}` : `-${formatted}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des données de paiement...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transactions':
        return (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une transaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="COMPLETED">Complété</option>
                <option value="PENDING">En attente</option>
                <option value="FAILED">Échoué</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Toute période</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="mx-auto w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune transaction trouvée
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Vos transactions apparaîtront ici une fois que vous aurez effectué des paiements.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {getTransactionIcon(transaction.type, transaction.category)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.description}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.reference && `Réf: ${transaction.reference} • `}
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${transaction.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatAmount(transaction.amount, transaction.type)}
                            </p>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(transaction.status)}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {transaction.status}
                              </span>
                            </div>
                          </div>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'invoices':
        return (
          <div className="space-y-6">
            {/* Invoices Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Factures</h2>
              <button className="flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle facture
              </button>
            </div>

            {/* Invoices List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune facture
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Vos factures apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Facture #{invoice.number}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(invoice.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                              <Eye className="w-4 h-4 text-gray-400" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                              <Download className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'methods':
        return (
          <div className="space-y-6">
            {/* Payment Methods Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Méthodes de paiement</h2>
              <button 
                onClick={() => setShowAddPaymentMethod(true)}
                className="flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une méthode
              </button>
            </div>

            {/* Payment Methods List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {method.type === 'card' ? 'Carte bancaire' : method.type}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {method.lastFour && `•••• ${method.lastFour}`}
                          {method.expiryDate && ` • Exp: ${method.expiryDate}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Par défaut
                        </span>
                      )}
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                        <Settings className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {paymentMethods.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <CreditCard className="mx-auto w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune méthode de paiement
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ajoutez une méthode de paiement pour faciliter vos transactions.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Évolution des revenus
                </h3>
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="mx-auto w-16 h-16 mb-4" />
                    <p>Graphique des revenus</p>
                    <p className="text-sm">(Intégration à venir)</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Répartition par catégorie
                </h3>
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <PieChart className="mx-auto w-16 h-16 mb-4" />
                    <p>Graphique circulaire</p>
                    <p className="text-sm">(Intégration à venir)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Résumé des performances
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                    {analytics.completedTransactions || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transactions réussies</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {((analytics.completedTransactions || 0) / (analytics.totalTransactions || 1) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Taux de réussite</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    €{(analytics.totalIncome || 0) / (analytics.completedTransactions || 1).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Montant moyen</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Paiements - ecodeli</title>
        <meta name="description" content="Gérez vos paiements, factures et méthodes de paiement" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Global Navigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des Paiements
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Suivez vos transactions, factures et méthodes de paiement
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Solde net</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(analytics.netBalance || 0)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-sky-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {analytics.incomeGrowth >= 0 ? (
                <TrendingUp className="mr-1 w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="mr-1 w-4 h-4 text-red-600" />
              )}
              <span className={analytics.incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(analytics.incomeGrowth || 0)}% ce mois
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenus totaux</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(analytics.totalIncome || 0)}
                </p>
              </div>
              <ArrowDownLeft className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dépenses totales</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(analytics.totalExpenses || 0)}
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.totalTransactions || 0}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="mr-1 w-4 h-4 text-green-500" />
              {analytics.completedTransactions || 0} réussies
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {[
              { key: 'transactions', label: 'Transactions', icon: Receipt },
              { key: 'invoices', label: 'Factures', icon: FileText },
              { key: 'methods', label: 'Méthodes de paiement', icon: CreditCard },
              { key: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </main>

      {/* Add Payment Method Modal */}
      {showAddPaymentMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Ajouter une méthode de paiement
              </h2>
              <button
                onClick={() => setShowAddPaymentMethod(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              // Handle form submission
              handleAddPaymentMethod({
                type: 'card',
                lastFour: '1234',
                expiryDate: '12/25',
                isDefault: false
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de paiement
                </label>
                <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="card">Carte bancaire</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank">Virement bancaire</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentMethod(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
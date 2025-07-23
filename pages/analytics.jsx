import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  DollarSign,
  Package,
  Truck,
  Users,
  Star,
  Clock,
  Target,
  PieChart,
  Activity,
  Zap,
  Eye,
  Store,
  Wrench,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export default function AnalyticsPage({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [analyticsData, setAnalyticsData] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, loading, router, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`, {
        headers: {
          'x-user-id': user?.id || 'demo-user-id',
          'x-user-role': user?.role || user?.userType || 'CUSTOMER'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeMetrics = () => {
    const userRole = user?.role || user?.userType || 'CUSTOMER';
    
    switch (userRole) {
      case 'CARRIER':
        return {
          title: 'Analytics Transporteur',
          description: 'Suivez vos performances de livraison et revenus',
          metrics: [
            {
              key: 'deliveries',
              label: 'Livraisons',
              value: analyticsData.totalDeliveries || 0,
              change: analyticsData.deliveriesChange || 0,
              icon: Package,
              color: 'blue'
            },
            {
              key: 'earnings',
              label: 'Revenus',
              value: `€${(analyticsData.totalEarnings || 0).toFixed(2)}`,
              change: analyticsData.earningsChange || 0,
              icon: DollarSign,
              color: 'green'
            },
            {
              key: 'rating',
              label: 'Note moyenne',
              value: (analyticsData.averageRating || 0).toFixed(1),
              change: analyticsData.ratingChange || 0,
              icon: Star,
              color: 'yellow'
            },
            {
              key: 'efficiency',
              label: 'Efficacité',
              value: `${(analyticsData.efficiencyRate || 0).toFixed(1)}%`,
              change: analyticsData.efficiencyChange || 0,
              icon: Target,
              color: 'purple'
            }
          ]
        };

      case 'MERCHANT':
        return {
          title: 'Analytics Marchand',
          description: 'Analysez vos ventes et performances business',
          metrics: [
            {
              key: 'sales',
              label: 'Ventes',
              value: `€${(analyticsData.totalSales || 0).toFixed(2)}`,
              change: analyticsData.salesChange || 0,
              icon: DollarSign,
              color: 'green'
            },
            {
              key: 'orders',
              label: 'Commandes',
              value: analyticsData.totalOrders || 0,
              change: analyticsData.ordersChange || 0,
              icon: Package,
              color: 'blue'
            },
            {
              key: 'customers',
              label: 'Clients',
              value: analyticsData.totalCustomers || 0,
              change: analyticsData.customersChange || 0,
              icon: Users,
              color: 'purple'
            },
            {
              key: 'conversion',
              label: 'Conversion',
              value: `${(analyticsData.conversionRate || 0).toFixed(1)}%`,
              change: analyticsData.conversionChange || 0,
              icon: Target,
              color: 'orange'
            }
          ]
        };

      case 'SERVICE_PROVIDER':
        return {
          title: 'Analytics Prestataire',
          description: 'Optimisez vos services et revenus',
          metrics: [
            {
              key: 'bookings',
              label: 'Réservations',
              value: analyticsData.totalBookings || 0,
              change: analyticsData.bookingsChange || 0,
              icon: Calendar,
              color: 'blue'
            },
            {
              key: 'revenue',
              label: 'Chiffre d\'affaires',
              value: `€${(analyticsData.totalRevenue || 0).toFixed(2)}`,
              change: analyticsData.revenueChange || 0,
              icon: DollarSign,
              color: 'green'
            },
            {
              key: 'satisfaction',
              label: 'Satisfaction client',
              value: `${(analyticsData.satisfactionRate || 0).toFixed(1)}%`,
              change: analyticsData.satisfactionChange || 0,
              icon: Star,
              color: 'yellow'
            },
            {
              key: 'utilization',
              label: 'Taux d\'occupation',
              value: `${(analyticsData.utilizationRate || 0).toFixed(1)}%`,
              change: analyticsData.utilizationChange || 0,
              icon: Clock,
              color: 'purple'
            }
          ]
        };

      case 'CUSTOMER':
      default:
        return {
          title: 'Analytics Client',
          description: 'Suivez vos dépenses et utilisation des services',
          metrics: [
            {
              key: 'shipments',
              label: 'Envois',
              value: analyticsData.totalShipments || 0,
              change: analyticsData.shipmentsChange || 0,
              icon: Package,
              color: 'blue'
            },
            {
              key: 'spending',
              label: 'Dépenses',
              value: `€${(analyticsData.totalSpending || 0).toFixed(2)}`,
              change: analyticsData.spendingChange || 0,
              icon: DollarSign,
              color: 'red'
            },
            {
              key: 'services',
              label: 'Services utilisés',
              value: analyticsData.servicesUsed || 0,
              change: analyticsData.servicesChange || 0,
              icon: Wrench,
              color: 'orange'
            },
            {
              key: 'savings',
              label: 'Économies',
              value: `€${(analyticsData.totalSavings || 0).toFixed(2)}`,
              change: analyticsData.savingsChange || 0,
              icon: Target,
              color: 'green'
            }
          ]
        };
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
      green: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
      red: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300',
      yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
      purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
      orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300'
    };
    return colors[color] || colors.blue;
  };

  const formatPercentage = (value) => {
    const num = parseFloat(value) || 0;
    return Math.abs(num).toFixed(1);
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  const userMetrics = getUserTypeMetrics();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Analytics - ecodeli</title>
        <meta name="description" content="Analysez vos performances et statistiques" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Global Navigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {userMetrics.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {userMetrics.description}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </button>
            <button className="flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {userMetrics.metrics.map((metric) => (
            <div key={metric.key} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(metric.color)}`}>
                  <metric.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center text-sm">
                  {metric.change >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(metric.change)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {metric.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue/Performance Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Évolution des performances
              </h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="revenue">Revenus</option>
                <option value="volume">Volume</option>
                <option value="efficiency">Efficacité</option>
              </select>
            </div>
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <BarChart3 className="mx-auto w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Graphique des performances</p>
                <p className="text-sm">(Intégration Chart.js à venir)</p>
              </div>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Répartition par catégorie
              </h3>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <PieChart className="mx-auto w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Graphique circulaire</p>
                <p className="text-sm">(Intégration Chart.js à venir)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Meilleures performances
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Meilleur jour', value: 'Mardi', metric: '+24%' },
                { label: 'Meilleure heure', value: '14h-16h', metric: '+18%' },
                { label: 'Top catégorie', value: 'Livraisons', metric: '45%' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.value}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {item.metric}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Activité récente
            </h3>
            <div className="space-y-4">
              {[
                { action: 'Nouvelle commande', time: 'Il y a 2h', status: 'success' },
                { action: 'Paiement reçu', time: 'Il y a 4h', status: 'success' },
                { action: 'Livraison terminée', time: 'Il y a 6h', status: 'completed' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' : 
                    activity.status === 'completed' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions rapides
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-sm font-medium">Rapport détaillé</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5" />
                  <span className="text-sm font-medium">Exporter données</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5" />
                  <span className="text-sm font-medium">Définir objectifs</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Analytics Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Données détaillées
              </h3>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                  <Filter className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Période</th>
                    <th className="px-6 py-3">Revenus</th>
                    <th className="px-6 py-3">Volume</th>
                    <th className="px-6 py-3">Croissance</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { period: 'Semaine 1', revenue: '€1,250', volume: '45', growth: '+12%', status: 'up' },
                    { period: 'Semaine 2', revenue: '€1,180', volume: '42', growth: '-5%', status: 'down' },
                    { period: 'Semaine 3', revenue: '€1,420', volume: '52', growth: '+20%', status: 'up' },
                    { period: 'Semaine 4', revenue: '€1,380', volume: '48', growth: '+8%', status: 'up' }
                  ].map((row, index) => (
                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {row.period}
                      </td>
                      <td className="px-6 py-4">{row.revenue}</td>
                      <td className="px-6 py-4">{row.volume}</td>
                      <td className={`px-6 py-4 ${row.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center">
                          {row.status === 'up' ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {row.growth}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {row.status === 'up' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
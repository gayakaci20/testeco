'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Search, Filter, Eye, Download, RefreshCw, CheckCircle, XCircle, AlertCircle, DollarSign, TrendingUp, FileText, Calendar } from 'lucide-react';

interface Payment {
  id: string;
  userId: string;
  matchId?: string;
  amount: number;
  currency?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod: 'CARD' | 'STRIPE' | 'BANK_TRANSFER' | 'PAYPAL';
  transactionId?: string;
  description: string;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
  match?: {
    id: string;
    package?: {
      id: string;
      title: string;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
    ride?: {
      id: string;
      startLocation: string;
      endLocation: string;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  };
}

interface Invoice {
  id: string;
  paymentId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  pdfUrl?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      console.log('Fetching payments from API...');
      const response = await fetch('/api/payments?admin=true');
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Received data:', data);
        console.log('Number of payments:', data.length);
        setPayments(data);
      } else {
        console.error('Failed to fetch payments:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`);
      if (response.ok) {
        const paymentDetails = await response.json();
        setSelectedPayment(paymentDetails);
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: Payment['status']) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': selectedPayment ? selectedPayment.userId : paymentId
        },
        body: JSON.stringify({
          id: paymentId,
          status: newStatus,
          userId: selectedPayment ? selectedPayment.userId : undefined
        })
      });

      if (response.ok) {
        // Refresh payments list
        fetchPayments();
        // Update selected payment
        if (selectedPayment) {
          setSelectedPayment({...selectedPayment, status: newStatus});
        }
        alert('Statut mis à jour avec succès');
      } else {
        alert('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const processRefund = async () => {
    if (!selectedPayment || !refundAmount) return;

    try {
      console.log('Processing refund for payment:', selectedPayment.id);
      console.log('Refund amount:', refundAmount);
      console.log('Refund reason:', refundReason);
      
      const response = await fetch('/api/payments?admin=true', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'admin'
        },
        body: JSON.stringify({
          id: selectedPayment.id,
          status: 'REFUNDED',
          refundAmount: parseFloat(refundAmount),
          refundReason: refundReason || 'Admin refund'
        })
      });

      console.log('Refund response status:', response.status);
      console.log('Refund response headers:', response.headers);
      
      if (response.ok) {
        const updatedPayment = await response.json();
        console.log('Refund successful, updated payment:', updatedPayment);
        
        // Update the payments list immediately
        setPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.id === selectedPayment.id 
              ? {
                  ...payment,
                  status: 'REFUNDED' as const,
                  refundAmount: parseFloat(refundAmount),
                  refundReason: refundReason || 'Admin refund'
                }
              : payment
          )
        );

        // Update selected payment
        setSelectedPayment({
          ...selectedPayment,
          status: 'REFUNDED',
          refundAmount: parseFloat(refundAmount),
          refundReason: refundReason || 'Admin refund'
        });

        // Close modal and reset form
        setShowRefundModal(false);
        setRefundAmount('');
        setRefundReason('');
        
        alert('Remboursement traité avec succès');
        
        // Also refresh the full list from server to ensure consistency
        await fetchPayments();
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${response.status} - ${response.statusText}` };
        }
        
        console.error('Refund failed:', errorData);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        
        alert(`Erreur lors du traitement du remboursement: ${errorData.message || errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert(`Erreur lors du traitement du remboursement: ${error as string || 'Erreur de connexion'}`);
    }
  };

  const generateInvoice = async (payment: Payment) => {
    try {
      const { default: jsPDF } = await import('jspdf');

      const doc = new jsPDF();

      // Invoice header
      doc.setFontSize(18);
      doc.text('Facture EcoDeli', 20, 20);

      doc.setFontSize(12);
      doc.text(`ID Paiement: ${payment.id}`, 20, 30);
      doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString('fr-FR')}`, 20, 38);
      doc.text(`Montant: ${formatCurrency(payment.amount, payment.currency || 'EUR')}`, 20, 46);
      doc.text(`Méthode: ${payment.paymentMethod}`, 20, 54);
      doc.text(`Statut: ${payment.status}`, 20, 62);

      // Save the PDF
      doc.save(`facture-${payment.id}.pdf`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Erreur lors de la génération de la facture');
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedPayment(null);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    
    const today = new Date();
    const paymentDate = new Date(payment.createdAt);
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'today' && paymentDate.toDateString() === today.toDateString()) ||
      (dateFilter === 'week' && paymentDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && paymentDate >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));
    
    const matchesSearch = 
      (payment.match?.package?.user?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.match?.package?.user?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.match?.package?.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.match?.ride?.user?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.match?.ride?.user?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.match?.ride?.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.transactionId && payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesMethod && matchesDate && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'CARD':
        return 'bg-blue-100 text-blue-800';
      case 'BANK_TRANSFER':
        return 'bg-purple-100 text-purple-800';
      case 'PAYPAL':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency?: string) => {
    // Vérifier que currency est une chaîne valide, sinon utiliser EUR par défaut
    const validCurrency = currency && typeof currency === 'string' && currency.trim() !== '' ? currency.trim() : 'EUR';
    
    // Vérifier que le montant est un nombre valide
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: validCurrency
      }).format(validAmount);
    } catch (error) {
      console.warn('Error formatting currency:', error, 'amount:', amount, 'currency:', currency);
      // En cas d'erreur (devise invalide), retourner le montant avec EUR
      try {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(validAmount);
      } catch (fallbackError) {
        // Si même EUR échoue, retourner un format simple
        return `${validAmount.toFixed(2)} €`;
      }
    }
  };

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-600 animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalPayments = payments.length;
  const completedPayments = payments.filter(p => p.status === 'COMPLETED').length;
  const pendingPayments = payments.filter(p => p.status === 'PENDING').length;
  const refundedPayments = payments.filter(p => p.status === 'REFUNDED').length;
  const totalAmount = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const averageAmount = completedPayments > 0 ? totalAmount / completedPayments : 0;
  const refundedAmount = payments
    .filter(p => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + (p.refundAmount || p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CreditCard className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paiements</h1>
              <p className="mt-1 text-gray-600">Gestion des transactions et remboursements</p>
            </div>
          </div>
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 font-medium text-white bg-gray-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-gray-700 hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paiements</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalPayments}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-emerald-600">{completedPayments}</span>
            <span className="ml-1 text-gray-500">complétés</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant Total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">{formatCurrency(averageAmount)}</span>
            <span className="ml-1 text-gray-500">moyenne</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{pendingPayments}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-yellow-600">
              {formatCurrency(payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0))}
            </span>
            <span className="ml-1 text-gray-500">en attente</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Remboursements</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{refundedPayments}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-red-600">{formatCurrency(refundedAmount)}</span>
            <span className="ml-1 text-gray-500">remboursés</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par ID transaction, utilisateur, ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="PROCESSING">En cours</option>
              <option value="COMPLETED">Complété</option>
              <option value="FAILED">Échoué</option>
              <option value="REFUNDED">Remboursé</option>
              <option value="CANCELLED">Annulé</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Toutes les méthodes</option>
              <option value="CARD">Carte</option>
              <option value="STRIPE">Stripe</option>
              <option value="BANK_TRANSFER">Virement</option>
              <option value="PAYPAL">PayPal</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Paiements ({filteredPayments.length})
          </h2>
        </div>
        
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-500">Aucun paiement trouvé</p>
            <p className="text-sm text-gray-400">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <CreditCard className="w-4 h-4" />
                      <span>Transaction</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Méthode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transactionId || payment.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-48">
                          {payment.description}
                        </div>
                        {payment.match && (
                          <div className="text-xs text-gray-400">
                            Match: {payment.match.package?.title || payment.match.ride?.startLocation}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      {payment.refundAmount && (
                        <div className="text-sm text-red-600">
                          Remboursé: {formatCurrency(payment.refundAmount, payment.currency)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status === 'PENDING' ? 'En attente' :
                         payment.status === 'PROCESSING' ? 'En cours' :
                         payment.status === 'COMPLETED' ? 'Complété' :
                         payment.status === 'FAILED' ? 'Échoué' :
                         payment.status === 'REFUNDED' ? 'Remboursé' :
                         payment.status === 'CANCELLED' ? 'Annulé' : payment.status}
                      </span>
                      {payment.failureReason && (
                        <div className="text-xs text-red-600 mt-1">{payment.failureReason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(payment.paymentMethod)}`}>
                        {payment.paymentMethod === 'CARD' ? 'Carte' :
                         payment.paymentMethod === 'STRIPE' ? 'Stripe' :
                         payment.paymentMethod === 'BANK_TRANSFER' ? 'Virement' :
                         payment.paymentMethod === 'PAYPAL' ? 'PayPal' : payment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(payment.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => fetchPaymentDetails(payment.id)}
                          className="text-emerald-600 hover:text-emerald-900 transition-colors duration-150"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === 'COMPLETED' && (
                          <button
                            onClick={() => generateInvoice(payment)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                            title="Générer facture"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {isDetailsModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Détails du Paiement</h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Informations du Paiement</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ID Transaction:</span>
                      <span className="text-sm font-medium font-mono">{selectedPayment.transactionId || selectedPayment.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Montant:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Statut:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(selectedPayment.status)}`}>
                        {selectedPayment.status === 'PENDING' ? 'En attente' :
                         selectedPayment.status === 'PROCESSING' ? 'En cours' :
                         selectedPayment.status === 'COMPLETED' ? 'Complété' :
                         selectedPayment.status === 'FAILED' ? 'Échoué' :
                         selectedPayment.status === 'REFUNDED' ? 'Remboursé' :
                         selectedPayment.status === 'CANCELLED' ? 'Annulé' : selectedPayment.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Méthode:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getMethodColor(selectedPayment.paymentMethod)}`}>
                        {selectedPayment.paymentMethod === 'CARD' ? 'Carte' :
                         selectedPayment.paymentMethod === 'STRIPE' ? 'Stripe' :
                         selectedPayment.paymentMethod === 'BANK_TRANSFER' ? 'Virement' :
                         selectedPayment.paymentMethod === 'PAYPAL' ? 'PayPal' : selectedPayment.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Créé le:</span>
                      <span className="text-sm font-medium">{formatDate(selectedPayment.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mis à jour:</span>
                      <span className="text-sm font-medium">{formatDate(selectedPayment.updatedAt)}</span>
                    </div>
                    {selectedPayment.refundAmount && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Montant remboursé:</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(selectedPayment.refundAmount, selectedPayment.currency)}
                          </span>
                        </div>
                        {selectedPayment.refundReason && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Raison:</span>
                            <span className="text-sm font-medium">{selectedPayment.refundReason}</span>
                          </div>
                        )}
                      </>
                    )}
                    {selectedPayment.failureReason && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Raison d'échec:</span>
                        <span className="text-sm font-medium text-red-600">{selectedPayment.failureReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedPayment.description}</p>
              </div>

              {/* Match Information */}
              {selectedPayment.match && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Informations du Match</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedPayment.match.package && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Colis:</span>
                          <span className="text-sm font-medium">{selectedPayment.match.package.description}</span>
                        </div>
                        {selectedPayment.match.package.user && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Expéditeur:</span>
                            <span className="text-sm font-medium">
                              {selectedPayment.match.package.user.firstName} {selectedPayment.match.package.user.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedPayment.match.ride && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trajet:</span>
                          <span className="text-sm font-medium">
                            {selectedPayment.match.ride.startLocation} → {selectedPayment.match.ride.endLocation}
                          </span>
                        </div>
                        {selectedPayment.match.ride.user && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Transporteur:</span>
                            <span className="text-sm font-medium">
                              {selectedPayment.match.ride.user.firstName} {selectedPayment.match.ride.user.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  {selectedPayment.status === 'COMPLETED' && !selectedPayment.refundAmount && (
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      Rembourser
                    </button>
                  )}
                  {selectedPayment.status === 'COMPLETED' && (
                    <button
                      onClick={() => generateInvoice(selectedPayment)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Générer Facture
                    </button>
                  )}
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Remboursement</h2>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Paiement original:</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à rembourser
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedPayment.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={`Max: ${selectedPayment.amount}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du remboursement
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                  placeholder="Expliquez la raison du remboursement..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={processRefund}
                  disabled={!refundAmount || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > selectedPayment.amount}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Rembourser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
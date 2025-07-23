'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ArrowLeft, CreditCard, AlertCircle, CheckCircle2, Calendar, Euro } from 'lucide-react';

interface Refund {
  id: string;
  amount: number;
  currency?: string;
  refundAmount: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
  match?: {
    package?: {
      description: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
    ride?: {
      startLocation: string;
      endLocation: string;
    };
  };
}

const formatCurrency = (amount: number, currency: string = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('fr-FR'),
    time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  };
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRefunds: 0,
    totalAmount: 0,
    thisMonth: 0
  });

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments?admin=true');
      
      if (response.ok) {
        const data = await response.json();
        const refunded = data.filter((p: any) => p.status === 'REFUNDED');
        
        // Calculate stats
        const totalAmount = refunded.reduce((sum: number, r: any) => sum + (r.refundAmount || 0), 0);
        const thisMonth = refunded.filter((r: any) => {
          const refundDate = new Date(r.updatedAt);
          const now = new Date();
          return refundDate.getMonth() === now.getMonth() && refundDate.getFullYear() === now.getFullYear();
        }).length;
        
        setStats({
          totalRefunds: refunded.length,
          totalAmount,
          thisMonth
        });
        
        setRefunds(refunded);
      } else {
        console.error('API request failed:', response.status);
      }
    } catch (err) {
      console.error('Error fetching refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-32 h-32 rounded-full border-b-2 border-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <a 
                href="/payments" 
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-black bg-white rounded-lg border transition-all duration-200 border-slate-200 hover:bg-gray-50 hover:border-slate-300"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Retour aux paiements
              </a>
              <div>
                <h1 className="flex items-center text-3xl font-bold text-black">
                  <CreditCard className="mr-3 w-8 h-8 text-red-500" />
                  Remboursements
                </h1>
                <p className="mt-1 text-black">Gestion et suivi des remboursements</p>
              </div>
            </div>
            
            <button
              onClick={() => fetchRefunds()}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg transition-all duration-200 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-xl border shadow-sm border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-black">Total des remboursements</p>
                <p className="mt-1 text-2xl font-bold text-black">{stats.totalRefunds}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-xl border shadow-sm border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-black">Montant total remboursé</p>
                <p className="mt-1 text-2xl font-bold text-black">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Euro className="w-6 h-6 text-orange-900" />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-xl border shadow-sm border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-black">Ce mois-ci</p>
                <p className="mt-1 text-2xl font-bold text-black">{stats.thisMonth}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {refunds.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border shadow-sm border-slate-200">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-full border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Aucun remboursement</h3>
                <p className="mt-1 text-black">Aucun remboursement n'a été effectué pour le moment.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200">
            <div className="px-6 py-4 bg-white border-b border-slate-200">
              <h2 className="text-lg font-semibold text-black">
                Liste des remboursements ({refunds.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Client
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Montant original
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Montant remboursé
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Raison
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-black uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {refunds.map((refund) => {
                    const createdDate = formatDate(refund.createdAt);
                    const updatedDate = formatDate(refund.updatedAt);
                    
                    return (
                      <tr key={refund.id} className="transition-colors duration-150 hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="font-mono text-sm font-medium text-black">
                              {refund.id.slice(0, 8)}...
                            </div>
                            {refund.transactionId && (
                              <div className="font-mono text-xs text-black">
                                {refund.transactionId}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-black">
                              {refund.match?.package?.user ? 
                                `${refund.match.package.user.firstName} ${refund.match.package.user.lastName}` : 
                                'N/A'
                              }
                            </div>
                            <div className="text-xs text-black">
                              {refund.match?.package?.user?.email || 'Email non disponible'}
                            </div>
                            {refund.match?.package?.description && (
                              <div className="mt-1 text-xs text-black">
                                📦 {refund.match.package.description}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-black">
                            {formatCurrency(refund.amount, refund.currency)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-bold text-red-600">
                              -{formatCurrency(refund.refundAmount, refund.currency)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="max-w-xs text-sm text-black">
                            {refund.refundReason ? (
                              <div className="px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex items-start space-x-2">
                                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-amber-800">{refund.refundReason}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="italic text-black">Aucune raison spécifiée</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <div className="text-sm text-black">
                              {updatedDate.date}
                            </div>
                            <div className="text-xs text-black">
                              {updatedDate.time}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, TrendingUp, CheckCircle, Clock, AlertCircle, Search, Filter, RefreshCw, Plus, Download, Eye, Trash2, Users, Calendar } from 'lucide-react';

interface Contract {
  id: string;
  title: string;
  description: string | null;
  terms: string;
  value: number | null;
  currency: string;
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  startDate: string | null;
  endDate: string | null;
  signedAt: string | null;
  createdAt: string;
  merchant?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    name: string | null;
    userType: 'INDIVIDUAL' | 'PROFESSIONAL';
    companyName: string | null;
    companyFirstName: string | null;
    companyLastName: string | null;
    address: string | null;
    phoneNumber: string | null;
  } | null;
  carrier?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    name: string | null;
    userType: 'INDIVIDUAL' | 'PROFESSIONAL';
    companyName: string | null;
    companyFirstName: string | null;
    companyLastName: string | null;
    address: string | null;
    phoneNumber: string | null;
  } | null;
  documents: Array<{
    id: string;
    type: string;
    title: string;
    fileName: string;
    filePath: string;
    createdAt: string;
  }>;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  name: string | null;
  userType: 'INDIVIDUAL' | 'PROFESSIONAL';
  companyName: string | null;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form state for creating contracts
  const [formData, setFormData] = useState({
    userType: 'merchant' as 'merchant' | 'carrier',
    merchantId: '',
    carrierId: '',
    title: '',
    description: '',
    terms: '',
    value: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchContracts();
    fetchProfessionalUsers();
  }, [statusFilter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/contracts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      
      const data = await response.json();
      setContracts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionalUsers = async () => {
    try {
      // Fetch both merchants and carriers who are professional
      const [merchantsResponse, carriersResponse] = await Promise.all([
        fetch('/api/users?userType=PROFESSIONAL&role=MERCHANT'),
        fetch('/api/users?userType=PROFESSIONAL&role=CARRIER')
      ]);

      const merchants = merchantsResponse.ok ? await merchantsResponse.json() : [];
      const carriers = carriersResponse.ok ? await carriersResponse.json() : [];
      
      // Combine and mark user types
      const allUsers = [
        ...merchants.map((user: User) => ({ ...user, contractType: 'merchant' })),
        ...carriers.map((user: User) => ({ ...user, contractType: 'carrier' }))
      ];
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching professional users:', error);
    }
  };

  const createContract = async () => {
    try {
      const contractData = {
        ...formData,
        // Map terms to content as required by API
        content: formData.terms,
        value: formData.value ? parseFloat(formData.value) : null,
        // Only include merchantId or carrierId based on userType
        merchantId: formData.userType === 'merchant' ? formData.merchantId : undefined,
        carrierId: formData.userType === 'carrier' ? formData.carrierId : undefined
      };

      // Remove the unused ID field
      if (formData.userType === 'merchant') {
        delete contractData.carrierId;
      } else {
        delete contractData.merchantId;
      }

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (response.ok) {
        fetchContracts();
        setShowCreateModal(false);
        setFormData({
          userType: 'merchant',
          merchantId: '',
          carrierId: '',
          title: '',
          description: '',
          terms: '',
          value: '',
          startDate: '',
          endDate: ''
        });
        alert('Contrat créé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la création du contrat');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Erreur lors de la création du contrat');
    }
  };

  const updateContractStatus = async (contractId: string, newStatus: string) => {
    try {
      const updateData: any = { id: contractId, status: newStatus };
      
      if (newStatus === 'SIGNED') {
        updateData.signedAt = new Date().toISOString();
      }

      const response = await fetch('/api/contracts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchContracts();
        alert(`Statut du contrat mis à jour: ${newStatus}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const generatePDF = async (contractId: string) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          type: 'CONTRACT'
        }),
      });

      if (response.ok) {
        const document = await response.json();
        fetchContracts(); // Refresh to show new document
        alert('PDF généré avec succès');
        
        // Open PDF in new tab
        window.open(document.filePath, '_blank');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const deleteContract = async (contractId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) return;

    try {
      const response = await fetch(`/api/contracts?id=${contractId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContracts();
        alert('Contrat supprimé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Brouillon' },
      PENDING_SIGNATURE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Attente Signature' },
      SIGNED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Signé' },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Actif' },
      EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expiré' },
      TERMINATED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Terminé' },
    };
    
    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getUserName = (user: any) => {
    if (!user) return 'Utilisateur non défini';
    if (user.companyName) return user.companyName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.name || user.email || 'Nom non disponible';
  };

  const getContractUser = (contract: Contract) => {
    return contract.merchant || contract.carrier;
  };

  const getContractUserType = (contract: Contract) => {
    if (contract.merchant) return 'Marchand';
    if (contract.carrier) return 'Transporteur';
    return 'Type inconnu';
  };

  const filteredContracts = contracts.filter(contract => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const user = getContractUser(contract);
    return (
      contract.title.toLowerCase().includes(searchLower) ||
      contract.id.toLowerCase().includes(searchLower) ||
      getUserName(user).toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const pendingContracts = contracts.filter(c => c.status === 'PENDING_SIGNATURE').length;
  const signedContracts = contracts.filter(c => c.status === 'SIGNED').length;
  const totalValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r to-gray-50 rounded-xl border from-slate-50 border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-slate-100">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Contrats</h1>
              <p className="mt-1 text-gray-600">Administrez tous les contrats et accords commerciaux</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchContracts}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 font-medium text-white bg-gray-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-gray-700 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 font-medium text-white rounded-lg shadow-sm transition-all duration-200 bg-slate-600 hover:bg-slate-700 hover:shadow-md"
            >
              <Plus className="mr-2 w-5 h-5" />
              Nouveau Contrat
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contrats</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{contracts.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="mr-1 w-4 h-4 text-green-500" />
            <span className="font-medium text-green-600">+8%</span>
            <span className="ml-1 text-gray-500">ce mois</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Actifs</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{activeContracts}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">{contracts.length > 0 ? Math.round((activeContracts / contracts.length) * 100) : 0}%</span>
            <span className="ml-1 text-gray-500">des contrats</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">{pendingContracts}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-500">Nécessitent signature</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{totalValue.toFixed(0)}€</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-blue-600">{signedContracts}</span>
            <span className="ml-1 text-gray-500">signés</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Search className="inline mr-1 w-4 h-4" />
              Rechercher
            </label>
            <input 
              type="text" 
              placeholder="Rechercher par titre, ID ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Filter className="inline mr-1 w-4 h-4" />
              Statut
            </label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PENDING_SIGNATURE">En Attente Signature</option>
              <option value="SIGNED">Signé</option>
              <option value="ACTIVE">Actif</option>
              <option value="EXPIRED">Expiré</option>
              <option value="TERMINATED">Terminé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="p-12 bg-white rounded-xl border shadow-sm">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-4 animate-spin border-slate-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">Chargement des contrats...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-center">
            <AlertCircle className="mr-2 w-5 h-5 text-red-400" />
            <p className="text-red-800">Erreur lors du chargement: {error}</p>
          </div>
        </div>
      )}

      {/* Contracts Table */}
      {!loading && !error && (
        <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des Contrats ({filteredContracts.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <FileText className="inline mr-1 w-4 h-4" />
                    Contrat
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <Users className="inline mr-1 w-4 h-4" />
                    Client
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Valeur
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <Calendar className="inline mr-1 w-4 h-4" />
                    Dates
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FileText className="mb-4 w-12 h-12 text-gray-400" />
                        <p className="text-lg font-medium text-gray-500">Aucun contrat trouvé</p>
                        <p className="text-sm text-gray-400">Créez votre premier contrat ou modifiez vos critères de recherche</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id} className="transition-colors duration-150 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">{contract.title}</div>
                          <div className="max-w-xs text-xs text-gray-500 truncate">{contract.description}</div>
                          <div className="mt-1 font-mono text-xs text-gray-400">ID: {contract.id.slice(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">{getUserName(getContractUser(contract))}</div>
                          <div className="text-xs text-gray-500">{getContractUser(contract)?.email || 'Email non disponible'}</div>
                          <div className="text-xs text-blue-600">
                            {getContractUser(contract)?.userType === 'PROFESSIONAL' ? 'Professionnel' : 'Particulier'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {getContractUserType(contract)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contract.value ? (
                          <div className="text-sm font-medium text-gray-900">{contract.value}€</div>
                        ) : (
                          <span className="text-sm text-gray-400">Non défini</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs text-gray-500">
                          <div>Créé: {format(new Date(contract.createdAt), 'dd/MM/yyyy')}</div>
                          {contract.startDate && (
                            <div>Début: {format(new Date(contract.startDate), 'dd/MM/yyyy')}</div>
                          )}
                          {contract.endDate && (
                            <div>Fin: {format(new Date(contract.endDate), 'dd/MM/yyyy')}</div>
                          )}
                                          {contract.signedAt && (
                  <div className="text-green-600">Signé: {format(new Date(contract.signedAt), 'dd/MM/yyyy')}</div>
                )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowDetailsModal(true);
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-md transition-colors duration-150 hover:bg-blue-200"
                          >
                            <Eye className="mr-1 w-3 h-3" />
                            Voir
                          </button>
                          <button
                            onClick={() => generatePDF(contract.id)}
                            className="inline-flex items-center px-2 py-1 text-xs text-green-700 bg-green-100 rounded-md transition-colors duration-150 hover:bg-green-200"
                          >
                            <Download className="mr-1 w-3 h-3" />
                            PDF
                          </button>
                          {contract.status === 'DRAFT' && (
                            <button
                              onClick={() => updateContractStatus(contract.id, 'PENDING_SIGNATURE')}
                              className="inline-flex items-center px-2 py-1 text-xs text-indigo-700 bg-indigo-100 rounded-md transition-colors duration-150 hover:bg-indigo-200"
                            >
                              <svg className="mr-1 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                              Envoyer
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteContract(contract.id)}
                            className="inline-flex items-center px-2 py-1 text-xs text-red-700 bg-red-100 rounded-md transition-colors duration-150 hover:bg-red-200"
                          >
                            <Trash2 className="mr-1 w-3 h-3" />
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredContracts.length > 0 && (
            <div className="flex justify-between items-center px-6 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-700">
                <span className="font-medium">{filteredContracts.length}</span>
                <span className="ml-1">contrat{filteredContracts.length > 1 ? 's' : ''} trouvé{filteredContracts.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm text-gray-700 bg-white rounded-md border border-gray-300 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50">
                  Précédent
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">Page 1</span>
                <button className="px-3 py-1 text-sm text-gray-700 bg-white rounded-md border border-gray-300 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Créer un Nouveau Contrat</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 transition-colors duration-150 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Type de Contrat</label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    userType: e.target.value as 'merchant' | 'carrier',
                    merchantId: '',
                    carrierId: ''
                  })}
                  className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                >
                  <option value="merchant">Contrat Marchand</option>
                  <option value="carrier">Contrat Transporteur</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  {formData.userType === 'merchant' ? 'Marchand Professionnel' : 'Transporteur Professionnel'}
                </label>
                <select
                  value={formData.userType === 'merchant' ? formData.merchantId : formData.carrierId}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    [formData.userType === 'merchant' ? 'merchantId' : 'carrierId']: e.target.value 
                  })}
                  className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                >
                  <option value="">
                    {formData.userType === 'merchant' ? 'Sélectionner un marchand...' : 'Sélectionner un transporteur...'}
                  </option>
                  {users
                    .filter((user: any) => user.contractType === formData.userType)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {getUserName(user)} - {user.email}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Titre du Contrat</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Ex: Contrat de service de livraison"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Description détaillée du contrat..."
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Termes et Conditions</label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows={6}
                  className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Détaillez les termes et conditions du contrat..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Valeur (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date de Début</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date de Fin</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 space-x-3 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 rounded-lg border border-gray-300 transition-colors duration-150 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={createContract}
                className="px-6 py-2 text-white rounded-lg transition-colors duration-150 bg-slate-600 hover:bg-slate-700"
              >
                Créer le Contrat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {showDetailsModal && selectedContract && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedContract.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">ID: {selectedContract.id}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 transition-colors duration-150 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Informations du Contrat</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Statut:</span>
                      <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                    </div>
                    {selectedContract.value && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Valeur:</span>
                        <div className="text-lg font-semibold text-gray-900">{selectedContract.value}€</div>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Créé le:</span>
                      <div className="text-sm text-gray-900">{format(new Date(selectedContract.createdAt), 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                    {selectedContract.startDate && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Date de début:</span>
                        <div className="text-sm text-gray-900">{format(new Date(selectedContract.startDate), 'dd/MM/yyyy')}</div>
                      </div>
                    )}
                    {selectedContract.endDate && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Date de fin:</span>
                        <div className="text-sm text-gray-900">{format(new Date(selectedContract.endDate), 'dd/MM/yyyy')}</div>
                      </div>
                    )}
                    {selectedContract.signedAt && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Signé le:</span>
                        <div className="text-sm font-medium text-green-600">{format(new Date(selectedContract.signedAt), 'dd/MM/yyyy HH:mm')}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900">{getContractUserType(selectedContract)}</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Nom:</span>
                      <div className="text-sm text-gray-900">{getUserName(getContractUser(selectedContract))}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email:</span>
                      <div className="text-sm text-gray-900">{getContractUser(selectedContract)?.email || 'Email non disponible'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type:</span>
                      <div className="text-sm text-gray-900">
                        {getContractUser(selectedContract)?.userType === 'PROFESSIONAL' ? 'Professionnel' : 'Particulier'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Rôle:</span>
                      <div className="text-sm text-gray-900">{getContractUserType(selectedContract)}</div>
                    </div>
                    {getContractUser(selectedContract)?.address && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Adresse:</span>
                        <div className="text-sm text-gray-900">{getContractUser(selectedContract)?.address}</div>
                      </div>
                    )}
                    {getContractUser(selectedContract)?.phoneNumber && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Téléphone:</span>
                        <div className="text-sm text-gray-900">{getContractUser(selectedContract)?.phoneNumber}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedContract.description && (
                <div className="mt-6">
                  <h3 className="mb-2 text-lg font-medium text-gray-900">Description</h3>
                  <p className="p-4 text-sm text-gray-700 bg-gray-50 rounded-lg">{selectedContract.description}</p>
                </div>
              )}

              <div className="mt-6">
                <h3 className="mb-2 text-lg font-medium text-gray-900">Termes et Conditions</h3>
                <div className="p-4 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg">
                  {selectedContract.terms}
                </div>
              </div>

              {selectedContract.documents.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">Documents Associés</h3>
                  <div className="space-y-2">
                    {selectedContract.documents.map((doc) => (
                      <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="mr-3 w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                            <div className="text-xs text-gray-500">{doc.fileName}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(doc.filePath, '_blank')}
                          className="inline-flex items-center px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md transition-colors duration-150 hover:bg-blue-200"
                        >
                          <Download className="mr-1 w-3 h-3" />
                          Télécharger
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between px-6 py-4 border-t border-gray-200">
              <div className="flex space-x-3">
                {selectedContract.status === 'DRAFT' && (
                  <button
                    onClick={() => {
                      updateContractStatus(selectedContract.id, 'PENDING_SIGNATURE');
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 text-white bg-yellow-600 rounded-lg transition-colors duration-150 hover:bg-yellow-700"
                  >
                    Envoyer pour Signature
                  </button>
                )}
                {selectedContract.status === 'PENDING_SIGNATURE' && (
                  <button
                    onClick={() => {
                      updateContractStatus(selectedContract.id, 'SIGNED');
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg transition-colors duration-150 hover:bg-blue-700"
                  >
                    Marquer comme Signé
                  </button>
                )}
                {selectedContract.status === 'SIGNED' && (
                  <button
                    onClick={() => {
                      updateContractStatus(selectedContract.id, 'ACTIVE');
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg transition-colors duration-150 hover:bg-green-700"
                  >
                    Activer le Contrat
                  </button>
                )}
                <button
                  onClick={() => generatePDF(selectedContract.id)}
                  className="px-4 py-2 text-white bg-gray-600 rounded-lg transition-colors duration-150 hover:bg-gray-700"
                >
                  Générer PDF
                </button>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-700 rounded-lg border border-gray-300 transition-colors duration-150 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
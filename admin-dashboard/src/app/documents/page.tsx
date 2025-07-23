'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, TrendingUp, Users, Download, Eye, Trash2, Search, Filter, RefreshCw, File, FileCheck, AlertCircle, HardDrive } from 'lucide-react';

interface Document {
  id: string;
  type: 'CONTRACT' | 'INVOICE' | 'RECEIPT' | 'REPORT' | 'OTHER';
  title: string;
  description: string | null;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    name: string | null;
    userType: 'INDIVIDUAL' | 'PROFESSIONAL';
    companyName: string | null;
  };
  contract: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      
      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      
      const data = await response.json();
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDocuments();
        alert('Document supprimé avec succès');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
      CONTRACT: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Contrat', icon: FileText },
      INVOICE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Facture', icon: FileCheck },
      RECEIPT: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Reçu', icon: File },
      REPORT: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Rapport', icon: FileText },
      OTHER: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Autre', icon: File },
    };
    
    const config = typeConfig[type] || typeConfig.OTHER;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getUserName = (user: any) => {
    if (user.companyName) return user.companyName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.name || user.email;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(document => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      document.title.toLowerCase().includes(searchLower) ||
      document.fileName.toLowerCase().includes(searchLower) ||
      getUserName(document.user).toLowerCase().includes(searchLower) ||
      (document.contract?.title || '').toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const contractDocs = documents.filter(d => d.type === 'CONTRACT').length;
  const invoiceDocs = documents.filter(d => d.type === 'INVOICE').length;
  const totalSize = documents.reduce((sum, d) => sum + d.fileSize, 0);
  const publicDocs = documents.filter(d => d.isPublic).length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Documents</h1>
              <p className="text-gray-600 mt-1">Administrez tous les documents et fichiers de la plateforme</p>
            </div>
          </div>
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{documents.length}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+22%</span>
            <span className="text-gray-500 ml-1">ce mois</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contrats</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{contractDocs}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-blue-600 font-medium">{documents.length > 0 ? Math.round((contractDocs / documents.length) * 100) : 0}%</span>
            <span className="text-gray-500 ml-1">des documents</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Factures</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{invoiceDocs}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <File className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-green-600 font-medium">Facturation</span>
            <span className="text-gray-500 ml-1">active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Espace Utilisé</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{formatFileSize(totalSize)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <HardDrive className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-purple-600 font-medium">{publicDocs}</span>
            <span className="text-gray-500 ml-1">publics</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Rechercher
            </label>
            <input 
              type="text" 
              placeholder="Rechercher par titre, fichier ou utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Type
            </label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Tous les types</option>
              <option value="CONTRACT">Contrats</option>
              <option value="INVOICE">Factures</option>
              <option value="RECEIPT">Reçus</option>
              <option value="REPORT">Rapports</option>
              <option value="OTHER">Autres</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="bg-white rounded-xl border shadow-sm p-12">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Chargement des documents...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">Erreur lors du chargement: {error}</p>
          </div>
        </div>
      )}
      
      {/* Documents Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des Documents ({filteredDocuments.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Users className="w-4 h-4 inline mr-1" />
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrat lié
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taille
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">Aucun document trouvé</p>
                        <p className="text-gray-400 text-sm">Essayez de modifier vos critères de recherche</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">{document.title}</div>
                          <div className="text-xs text-gray-500">{document.fileName}</div>
                          {document.description && (
                            <div className="text-xs text-gray-400 truncate max-w-xs mt-1">{document.description}</div>
                          )}
                          {document.isPublic && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1 w-fit">
                              Public
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">{getUserName(document.user)}</div>
                          <div className="text-xs text-gray-500">{document.user.email}</div>
                          <div className="text-xs text-blue-600">
                            {document.user.userType === 'PROFESSIONAL' ? 'Professionnel' : 'Particulier'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(document.type)}
                      </td>
                      <td className="px-6 py-4">
                        {document.contract ? (
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">{document.contract.title}</div>
                            <div className="text-xs text-gray-500">ID: {document.contract.id.slice(0, 8)}...</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Aucun</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatFileSize(document.fileSize)}</div>
                        <div className="text-xs text-gray-500">{document.mimeType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(document.createdAt), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(document.createdAt), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(document.filePath, '_blank')}
                            className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-150"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </button>
                          <button
                            onClick={() => {
                              const link = window.document.createElement('a');
                              link.href = document.filePath;
                              link.download = document.fileName;
                              link.click();
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-150"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            DL
                          </button>
                          <button
                            onClick={() => deleteDocument(document.id)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-150"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
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
          {filteredDocuments.length > 0 && (
            <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-700">
                <span className="font-medium">{filteredDocuments.length}</span>
                <span className="ml-1">document{filteredDocuments.length > 1 ? 's' : ''} trouvé{filteredDocuments.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150">
                  Précédent
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">Page 1</span>
                <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
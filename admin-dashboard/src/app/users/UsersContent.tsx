'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Role, UserType } from '@/generated/prisma';
import EditUserModal from '../../components/EditUserModal';
import ExportCSVButton from '@/components/ExportCSVButton';
import { Search, Filter, Car, Truck, Bike, Bus, Users, Mail, Phone, MapPin, Calendar, AlertCircle, CheckCircle, Clock, Edit, Trash2, RefreshCw } from 'lucide-react';

interface BankingInfo {
  id: string;
  accountHolder: string;
  iban: string;
  bic: string;
  bankName: string;
  address: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: Role;
  userType: UserType;
  companyName: string | null;
  companyFirstName: string | null;
  companyLastName: string | null;
  vehicleType: string | null;
  isVerified: boolean;
  createdAt: string;
  phoneNumber?: string | null;
  address?: string | null;
  bankingInfo?: BankingInfo | null;
}

// Fonction utilitaire pour tronquer le texte
function truncateText(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function UsersContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // New filter for user type
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for user details modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Helper function to format role display
  const formatRole = (role: Role) => {
    switch (role) {
      case 'CUSTOMER':
        return 'Customer';
      case 'CARRIER':
        return 'Carrier';
      case 'MERCHANT':
        return 'Merchant';
      case 'PROVIDER':
        return 'Provider';
      case 'SERVICE_PROVIDER':
        return 'Service Provider';
      case 'ADMIN':
        return 'Admin';
      default:
        return role;
    }
  };

  // Helper function to get role color classes
  const getRoleColorClasses = (role: Role) => {
    switch (role) {
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800';
      case 'CARRIER':
        return 'bg-green-100 text-green-800';
      case 'MERCHANT':
        return 'bg-purple-100 text-purple-800';
      case 'PROVIDER':
        return 'bg-orange-100 text-orange-800';
      case 'SERVICE_PROVIDER':
        return 'bg-cyan-100 text-cyan-800';
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format user type
  const formatUserType = (userType: UserType) => {
    switch (userType) {
      case 'INDIVIDUAL':
        return 'Individuel';
      case 'PROFESSIONAL':
        return 'Professionnel';
      default:
        return userType;
    }
  };

  // Helper function to get display name
  const getDisplayName = (user: User) => {
    if (user.userType === 'PROFESSIONAL' && user.companyName) {
      return user.companyName;
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-';
  };

  // Helper function to format IBAN (mask it for security)
  const maskIban = (iban: string) => {
    if (!iban) return '';
    return iban.substring(0, 4) + '*'.repeat(iban.length - 8) + iban.substring(iban.length - 4);
  };

  // Fonction pour obtenir l'icône du type de véhicule
  const getVehicleIcon = (vehicleType: string | null) => {
    if (!vehicleType) return <Car className="w-4 h-4 text-gray-400" />;
    
    switch (vehicleType.toLowerCase()) {
      case 'car':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'truck':
        return <Truck className="w-4 h-4 text-green-500" />;
      case 'van':
        return <Car className="w-4 h-4 text-purple-500" />;
      case 'motorcycle':
        return <Bike className="w-4 h-4 text-orange-500" />;
      case 'bus':
        return <Bus className="w-4 h-4 text-red-500" />;
      default:
        return <Car className="w-4 h-4 text-gray-500" />;
    }
  };

  // Fonction pour formater le nom du type de véhicule
  const formatVehicleType = (vehicleType: string | null) => {
    if (!vehicleType) return 'Non spécifié';
    
    const vehicleNames = {
      car: 'Voiture',
      truck: 'Camion',
      van: 'Fourgonnette',
      motorcycle: 'Moto',
      bus: 'Bus'
    };
    
    return vehicleNames[vehicleType.toLowerCase() as keyof typeof vehicleNames] || vehicleType;
  };

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // State for delete confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // State for delete error modal
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [deleteError, setDeleteError] = useState<{message: string, details: any} | null>(null);
  const [isForceDeleting, setIsForceDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (updatedUserData: Partial<User>) => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleTryDelete = async () => {
    if (!deletingUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: false }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setDeleteError({
          message: errorData.error || 'Failed to delete user',
          details: errorData.details || null
        });
        setShowDeleteError(true);
      } else {
        setIsDeleteConfirmOpen(false);
        setDeletingUser(null);
        setDeleteError(null);
        setShowDeleteError(false);
        await fetchUsers();
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setDeleteError({
        message: err instanceof Error ? err.message : 'Could not delete user',
        details: err
      });
      setShowDeleteError(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Handle different types of errors
        if (response.status === 400 && responseData.details) {
          // User has associated data - show error modal instead of throwing
          setDeleteError({
            message: responseData.error,
            details: responseData.details
          });
          setIsDeleteConfirmOpen(false);
          setShowDeleteError(true);
          return;
        } else {
          throw new Error(responseData.error || 'Erreur lors de la suppression de l\'utilisateur');
        }
      }
      
      // Success
      setIsDeleteConfirmOpen(false);
      setDeletingUser(null);
      await fetchUsers(); // Re-fetch to see changes
      
      // Show success message
      alert('✅ Utilisateur supprimé avec succès !');
      
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err instanceof Error ? err.message : 'Impossible de supprimer l\'utilisateur');
      setIsDeleteConfirmOpen(false);
      setDeletingUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDeletingUser(null);
  };

  const handleCloseDeleteError = () => {
    setShowDeleteError(false);
    setDeleteError(null);
    setDeletingUser(null);
  };

  const handleViewUserData = (dataType: string) => {
    if (!deletingUser) return;
    
    // Navigate to the appropriate page to view user's data
    const userId = deletingUser.id;
    let targetPage = '';
    
    switch (dataType) {
      case 'packages':
        targetPage = `/packages?userId=${userId}`;
        break;
      case 'rides':
        targetPage = `/rides?userId=${userId}`;
        break;
      case 'payments':
        targetPage = `/payments?userId=${userId}`;
        break;
      case 'contracts':
        targetPage = `/contracts?userId=${userId}`;
        break;
      case 'bookings':
        targetPage = `/bookings?userId=${userId}`;
        break;
      default:
        return;
    }
    
    // Open in new tab
    window.open(targetPage, '_blank');
  };

  const handleForceDelete = async () => {
    if (!deletingUser) return;
    
    setIsForceDeleting(true);
    try {
      console.log('Attempting force delete for user:', deletingUser.id);
      const response = await fetch(`/api/users/${deletingUser.id}?force=true`, {
        method: 'DELETE',
      });
      
      console.log('Response status:', response.status);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('Response data:', responseData);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Erreur de communication avec le serveur');
      }
      
      if (!response.ok) {
        console.error('API Error:', responseData);
        const errorMessage = responseData.error || responseData.details || 'Erreur lors de la suppression forcée';
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
      
      // Success
      setShowDeleteError(false);
      setDeleteError(null);
      setDeletingUser(null);
      await fetchUsers(); // Re-fetch to see changes
      
      // Show success message
      alert('✅ Utilisateur et toutes ses données supprimés avec succès !');
      
    } catch (err) {
      console.error('Force delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Impossible de supprimer l\'utilisateur';
      setError(errorMessage);
    } finally {
      setIsForceDeleting(false);
    }
  };

  const handleResendVerification = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}/resend-verification`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de l\'envoi');
      alert('Email de vérification envoyé ✅');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      getDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.includes(searchTerm));
    
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesVerified = verifiedFilter === '' || 
      (verifiedFilter === 'verified' && user.isVerified) ||
      (verifiedFilter === 'unverified' && !user.isVerified);
    const matchesStatus = statusFilter === '' || user.userType === statusFilter;
    
    return matchesSearch && matchesRole && matchesVerified && matchesStatus;
  });

  const getStatusBadge = (isVerified: boolean) => {
    return isVerified ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="mr-1 w-3 h-3" />
        Vérifié
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="mr-1 w-3 h-3" />
        En attente
      </span>
    );
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
        <div className="flex items-center">
          <AlertCircle className="mr-2 w-5 h-5 text-red-400" />
          <p className="text-red-800">Erreur lors du chargement: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters Section - Same design as rides */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Search className="inline mr-1 w-4 h-4" />
              Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, email ou téléphone..."
              className="px-4 py-2 w-full rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              <Filter className="inline mr-1 w-4 h-4" />
              Rôle
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Tous les rôles</option>
              <option value="CUSTOMER">🔵 Client</option>
              <option value="CARRIER">🟢 Transporteur</option>
              <option value="MERCHANT">🟣 Marchand</option>
              <option value="PROVIDER">🟠 Prestataire</option>
              <option value="SERVICE_PROVIDER">🔵 Service Provider</option>
              <option value="ADMIN">🔴 Admin</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Statut
            </label>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="verified">Vérifié</option>
              <option value="unverified">En attente</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Tous les types</option>
              <option value="INDIVIDUAL">Individuel</option>
              <option value="PROFESSIONAL">Professionnel</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 font-medium text-white bg-indigo-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-4 border-purple-600 animate-spin border-t-transparent"></div>
            <p className="mt-2 text-gray-500">Chargement des utilisateurs...</p>
          </div>
        </div>
      )}

      {/* Table Header */}
      {!loading && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Liste des Utilisateurs ({filteredUsers.length})
              </h2>
              <div className="flex items-center mt-2 space-x-2 text-xs">
                <span className="text-gray-500">Rôles:</span>
                <span className="inline-flex items-center px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">Client</span>
                <span className="inline-flex items-center px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">Transporteur</span>
                <span className="inline-flex items-center px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded-full">Marchand</span>
                <span className="inline-flex items-center px-2 py-1 text-xs text-orange-800 bg-orange-100 rounded-full">Prestataire</span>
                <span className="inline-flex items-center px-2 py-1 text-xs text-red-800 bg-red-100 rounded-full">Admin</span>
              </div>
            </div>
            <ExportCSVButton data={filteredUsers} />
          </div>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Users className="inline mr-1 w-4 h-4" />
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Mail className="inline mr-1 w-4 h-4" />
                  Contact
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Rôle & Type
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Car className="inline mr-1 w-4 h-4" />
                  Véhicule
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  <Calendar className="inline mr-1 w-4 h-4" />
                  Inscription
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="mb-4 w-12 h-12 text-gray-400" />
                      <p className="text-lg font-medium text-gray-500">Aucun utilisateur trouvé</p>
                      <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors duration-150 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {getDisplayName(user)}
                        </div>
                        <div className="mt-1 font-mono text-xs text-gray-400">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                        {user.userType === 'PROFESSIONAL' && user.companyFirstName && user.companyLastName && (
                          <div className="mt-1 text-xs text-gray-500">
                            Contact: {user.companyFirstName} {user.companyLastName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <Mail className="mr-1 w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-900">{user.email}</span>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center">
                            <Phone className="mr-1 w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{user.phoneNumber}</span>
                          </div>
                        )}
                        {user.address && (
                          <div className="flex items-center">
                            <MapPin className="mr-1 w-3 h-3 text-gray-400" />
                            <span className="max-w-xs text-xs text-gray-500 truncate">
                              {truncateText(user.address, 25)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColorClasses(user.role)}`}>
                          {formatRole(user.role)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatUserType(user.userType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getVehicleIcon(user.vehicleType)}
                        <span className="text-sm text-gray-600">
                          {formatVehicleType(user.vehicleType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isVerified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(user.createdAt), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md transition-colors duration-150 hover:bg-blue-200"
                        >
                          <Edit className="mr-1 w-3 h-3" />
                          Modifier
                        </button>
                        {!user.isVerified && (
                          <button
                            onClick={() => handleResendVerification(user)}
                            className="inline-flex items-center px-3 py-1 text-xs text-green-700 bg-green-100 rounded-md transition-colors duration-150 hover:bg-green-200"
                          >
                            <RefreshCw className="mr-1 w-3 h-3" />
                            Renvoyer
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="inline-flex items-center px-3 py-1 text-xs text-red-700 bg-red-100 rounded-md transition-colors duration-150 hover:bg-red-200"
                        >
                          <Trash2 className="mr-1 w-3 h-3" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && (
        <div className="flex justify-between items-center px-6 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            <span className="font-medium">{filteredUsers.length}</span>
            <span className="ml-1">utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}</span>
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

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
          user={editingUser}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && deletingUser && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="p-6 mx-4 max-w-md bg-white rounded-xl shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
            <p className="mb-6 text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{getDisplayName(deletingUser)}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Error Modal */}
      {showDeleteError && deleteError && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="p-6 mx-4 max-w-lg bg-white rounded-xl shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-red-600">Impossible de supprimer l'utilisateur</h3>
            <p className="mb-4 text-sm text-gray-600">{deleteError.message}</p>
            
            {deleteError.details && (
              <div className="p-3 mb-4 bg-yellow-50 rounded-lg">
                <p className="mb-2 text-sm font-medium text-yellow-800">Données associées :</p>
                <ul className="space-y-1 text-xs text-yellow-700">
                  {Object.entries(deleteError.details).map(([key, count]) => (
                    <li key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span className="font-medium">{count as number}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseDeleteError}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
              <button
                onClick={handleForceDelete}
                disabled={isForceDeleting}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isForceDeleting ? 'Suppression...' : 'Forcer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
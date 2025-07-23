import Image from "next/image";
import { PrismaClient, BookingStatus, ContractStatus } from '@/generated/prisma';
import { format } from 'date-fns';
import Link from "next/link";
import { Poppins } from 'next/font/google';
import { Users, Package, Car, Briefcase, Calendar, FileText, CreditCard, Box, TrendingUp, Activity, BarChart3, DollarSign, Clock, CheckCircle, AlertCircle, Home as HomeIcon, Store } from 'lucide-react';

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
})
const prisma = new PrismaClient();

// Force dynamic rendering for admin dashboard
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Core data
  const users = await prisma.user.findMany();
  const packages = await prisma.package.findMany();
  const rides = await prisma.ride.findMany();
  const matches = await prisma.match.findMany({
    include: {
      package: true,
      ride: true,
    },
  });

  // Business data
  const services = await prisma.service.findMany({
    include: {
      provider: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  const bookings = await prisma.booking.findMany({
    include: {
      service: true,
      customer: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  const contracts = await prisma.contract.findMany({
    include: {
      merchant: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  const storageBoxes = await prisma.storageBox.findMany();
  const boxRentals = await prisma.boxRental.findMany({
    include: {
      box: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  const payments = await prisma.payment.findMany();
  const documents = await prisma.document.findMany();

  // Fetch subscriptions data using admin Prisma client
  let subscriptionsData = { total: 0, active: 0, revenue: 0 };
  try {
    const subscriptions = await prisma.subscription.findMany();
    const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'ACTIVE');
    const totalSubsRevenue = activeSubscriptions.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
    
    subscriptionsData = {
      total: subscriptions.length,
      active: activeSubscriptions.length,
      revenue: totalSubsRevenue
    };
  } catch (error) {
    console.log('Could not fetch subscriptions data:', error);
  }

  // Calculate metrics
  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const activeBookingStatuses: BookingStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'];
  const activeServiceBookings = bookings.filter(b => activeBookingStatuses.includes(b.status)).length;
  const activeBoxRentals = boxRentals.filter(r => r.isActive).length;
  const activeBookings = activeServiceBookings + activeBoxRentals;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
  const activeContracts = contracts.filter(c => c.status === 'SIGNED').length;
  const occupiedBoxes = storageBoxes.filter(b => b.isOccupied).length;

  // User role distribution
  const usersByRole = users.reduce((acc, user) => {
    acc[user.role as string] = (acc[user.role as string] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <HomeIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
            <p className="mt-1 text-gray-600">Vue d'ensemble de votre plateforme EcoDeli</p>
          </div>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs Totaux</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="font-medium text-green-600">
                {usersByRole.CUSTOMER || 0} clients
              </span>
            </div>
            <Link 
              href="/users" 
              className="px-3 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full transition-colors hover:bg-purple-200"
            >
              Voir tout
            </Link>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Services Actifs</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{services.filter(s => s.isActive).length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2 text-sm">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="font-medium text-green-600">
                {services.length} total
              </span>
            </div>
            <Link 
              href="/services" 
              className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full transition-colors hover:bg-green-200"
            >
              Gérer
            </Link>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">€{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-emerald-600">
                {payments.filter(p => p.status === 'COMPLETED').length} paiements
              </span>
            </div>
            <Link 
              href="/payments" 
              className="px-3 py-1 text-xs font-medium text-emerald-800 bg-emerald-100 rounded-full transition-colors hover:bg-emerald-200"
            >
              Détails
            </Link>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Réservations Actives</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{activeBookings}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-orange-600">
                {activeServiceBookings} services, {activeBoxRentals} stockage
              </span>
            </div>
            <Link 
              href="/bookings" 
              className="px-3 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full transition-colors hover:bg-orange-200"
            >
              Voir
            </Link>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Abonnés Actifs</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{subscriptionsData.active}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="w-4 h-4 text-purple-500" />
              <span className="font-medium text-purple-600">
                €{subscriptionsData.revenue.toFixed(2)} revenus
              </span>
            </div>
            <Link 
              href="/subscriptions" 
              className="px-3 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full transition-colors hover:bg-purple-200"
            >
              Gérer
            </Link>
          </div>
        </div>
      </div>
      
      {/* Business Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Colis</h3>
              <div className="mt-1 text-2xl font-bold text-gray-900">{packages.length}</div>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Colis totaux</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Trajets</h3>
              <div className="mt-1 text-2xl font-bold text-gray-900">{rides.length}</div>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Trajets disponibles</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Contrats</h3>
              <div className="mt-1 text-2xl font-bold text-gray-900">{activeContracts}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Contrats actifs</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Boîtes de Stockage</h3>
              <div className="mt-1 text-2xl font-bold text-gray-900">{occupiedBoxes}/{storageBoxes.length}</div>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Box className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Occupées/Total</p>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Documents</h3>
              <div className="mt-1 text-2xl font-bold text-gray-900">{documents.length}</div>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Documents générés</p>
        </div>
      </div>
      
      {/* User Role Distribution & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Distribution des Utilisateurs</h2>
            <div className="p-2 bg-gray-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries(usersByRole).map(([role, count]) => {
              const percentage = (count / users.length) * 100;
              const roleColors = {
                ADMIN: 'bg-red-500',
                CUSTOMER: 'bg-blue-500',
                CARRIER: 'bg-green-500',
                SERVICE_PROVIDER: 'bg-purple-500',
                MERCHANT: 'bg-orange-500'
              };
              const roleLabels = {
                ADMIN: 'Administrateurs',
                CUSTOMER: 'Clients',
                CARRIER: 'Transporteurs',
                SERVICE_PROVIDER: 'Prestataires',
                MERCHANT: 'Marchands'
              };
              
              return (
                <div key={role} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {roleLabels[role as keyof typeof roleLabels] || role}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${roleColors[role as keyof typeof roleColors] || 'bg-gray-500'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Activité Récente</h2>
            <div className="p-2 bg-gray-50 rounded-lg">
              <Activity className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {bookings.filter(b => b.status === 'COMPLETED').length} réservations complétées
                </p>
                <p className="text-xs text-gray-500">Aujourd'hui</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {users.length} utilisateurs inscrits
                </p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {payments.filter(p => p.status === 'COMPLETED').length} paiements traités
                </p>
                <p className="text-xs text-gray-500">Ce mois</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {bookings.filter(b => b.status === 'PENDING').length} réservations en attente
                </p>
                <p className="text-xs text-gray-500">Nécessitent une attention</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 bg-white rounded-xl border shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">Actions Rapides</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <Link 
            href="/users" 
            className="flex flex-col items-center p-4 text-center rounded-lg transition-all duration-200 hover:bg-purple-50 hover:scale-105"
          >
            <div className="p-3 mb-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Utilisateurs</span>
          </Link>
          
          <Link 
            href="/merchants" 
            className="flex flex-col items-center p-4 text-center rounded-lg transition-all duration-200 hover:bg-pink-50 hover:scale-105"
          >
            <div className="p-3 mb-2 bg-pink-100 rounded-lg">
              <Store className="w-6 h-6 text-pink-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Marchands</span>
          </Link>
          
          <Link 
            href="/packages" 
            className="flex flex-col items-center p-4 text-center rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105"
          >
            <div className="p-3 mb-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Colis</span>
          </Link>
          
          <Link 
            href="/rides" 
            className="flex flex-col items-center p-4 text-center rounded-lg transition-all duration-200 hover:bg-green-50 hover:scale-105"
          >
            <div className="p-3 mb-2 bg-green-100 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Trajets</span>
          </Link>
          
          <Link 
            href="/services" 
            className="flex flex-col items-center p-4 text-center rounded-lg transition-all duration-200 hover:bg-orange-50 hover:scale-105"
          >
            <div className="p-3 mb-2 bg-orange-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Services</span>
          </Link>
          
          <Link 
            href="/bookings" 
            className="flex flex-col items-center p-4 text-center rounded-lg transition-all duration-200 hover:bg-indigo-50 hover:scale-105"
          >
            <div className="p-3 mb-2 bg-indigo-100 rounded-lg">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Réservations</span>
          </Link>
          
          <Link 
            href="/payments" 
            className="flex flex-col items-center p-4 text-center rounded-lg transition-all duration-200 hover:bg-emerald-50 hover:scale-105"
          >
            <div className="p-3 mb-2 bg-emerald-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Paiements</span>
          </Link>

          <Link 
            href="/subscriptions" 
            className="flex flex-col items-center p-4 text-center rounded-lg transition-all duration-200 hover:bg-purple-50 hover:scale-105"
          >
            <div className="p-3 mb-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Abonnements</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Sun, Moon, User, Menu, X, Settings, LogOut, ChevronRight, BarChart3, Package, Truck, Store, Wrench, Calendar, MapPin, Storage, MessageSquare, Bell, DollarSign, Users, FileText, ShoppingCart } from 'lucide-react'
import { getRoleSpecificDashboardUrl, getDashboardTitle } from './RoleBasedNavigation'

export default function Header({ 
  user, 
  isDarkMode, 
  toggleDarkMode, 
  logout, 
  unreadCount = 0,
  currentPage = null 
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const userRole = user.role || user.userType || 'CUSTOMER' || 'CARRIER' || 'PROVIDER' || 'SERVICE_PROVIDER' || 'SPECIALIZED_PROVIDER' || 'MERCHANT';
  // Fonction locale pour obtenir les éléments de navigation
  const getNavigationItems = () => {
    if (!user) return [];

    const roleSpecificItems = {
      // Navigation pour les Clients/Particuliers
      CUSTOMER: [
        { href: '/dashboard/customer', label: 'Dashboard', icon: BarChart3 },
        { href: '/exp', label: 'Envoyer', icon: Package },
        { href: '/trajet', label: 'Trajets', icon: Truck },
        { href: '/services/browse', label: 'Services', icon: Wrench },
        { href: '/storage/browse', label: 'Stockage', icon: Storage },
        { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
        { href: '/notifications', label: 'Notifications', icon: Bell }
      ],

      // Navigation pour les Transporteurs
      CARRIER: [
        { href: '/dashboard/carrier', label: 'Dashboard', icon: BarChart3 },
        { href: '/rides', label: 'Mes trajets', icon: Truck },
        { href: '/trajet', label: 'Trouver colis', icon: Package },
        { href: '/matches', label: 'Correspondances', icon: MapPin },
        { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
        { href: '/notifications', label: 'Notifications', icon: Bell }
      ],

      // Navigation pour les Transporteurs Professionnels
      CARRIER_PRO: [
        { href: '/dashboard/procarrier', label: 'Dashboard Pro', icon: BarChart3 },
        { href: '/rides', label: 'Mes trajets', icon: Truck },
        { href: '/trajet', label: 'Trouver colis B2B', icon: Package },
        { href: '/matches', label: 'Correspondances', icon: MapPin },
        { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
        { href: '/notifications', label: 'Notifications', icon: Bell }
      ],

      // Navigation pour les Marchands
      MERCHANT: [
        { href: '/dashboard/merchant', label: 'Dashboard', icon: BarChart3 },
        { href: '/products', label: 'Produits', icon: Package },
        { href: '/orders', label: 'Commandes', icon: ShoppingCart },
        { href: '/shipments', label: 'Expéditions', icon: Truck },
        { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
        { href: '/notifications', label: 'Notifications', icon: Bell }
      ],

      // Navigation pour les Prestataires
      PROVIDER: [
        { href: '/dashboard/provider', label: 'Dashboard', icon: BarChart3 },
        { href: '/services/manage', label: 'Mes services', icon: Wrench },
        { href: '/bookings', label: 'Réservations', icon: Calendar },
        { href: '/clients', label: 'Clients', icon: Users },
        { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
        { href: '/notifications', label: 'Notifications', icon: Bell }
      ],

      // Navigation pour les Prestataires de Services
      SERVICE_PROVIDER: [
        { href: '/dashboard/provider', label: 'Dashboard', icon: BarChart3 },
        { href: '/services/manage', label: 'Mes services', icon: Wrench },
        { href: '/bookings', label: 'Réservations', icon: Calendar },
        { href: '/clients', label: 'Clients', icon: Users },
        { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
        { href: '/notifications', label: 'Notifications', icon: Bell }
      ],

      // Navigation pour les Prestataires Spécialisés (pour compatibilité)
      SPECIALIZED_PROVIDER: [
        { href: '/dashboard/specialized-provider', label: 'Dashboard', icon: BarChart3 },
        { href: '/calendar', label: 'Calendrier', icon: Calendar },
        { href: '/services/specialized', label: 'Services', icon: Wrench },
        { href: '/clients/manage', label: 'Clients', icon: Users },
        { href: '/invoices', label: 'Facturation', icon: FileText },
        { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadCount },
        { href: '/notifications', label: 'Notifications', icon: Bell }
      ]
    };

    // Déterminer le rôle de l'utilisateur
    const userRole = user.role || user.userType || 'CUSTOMER';
    
    // Vérifier si c'est un transporteur professionnel
    if (userRole === 'CARRIER' && user.userType === 'PROFESSIONAL') {
      return roleSpecificItems.CARRIER_PRO;
    }
    
    // Retourner les éléments spécifiques au rôle
    return roleSpecificItems[userRole] || roleSpecificItems.CUSTOMER;
  };

  const navigationItems = getNavigationItems();
  
  // Get core navigation items for desktop (first 4-5 items)
  const desktopNavItems = navigationItems.slice(0, 5).filter(item => 
    item.href !== currentPage && // Don't show current page in nav
    ['/dashboard', '/messages', '/matches', '/notifications', '/payments'].includes(item.href)
  )

  return (
    <header className="flex relative flex-shrink-0 justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <Link href="/" className="flex gap-2 items-center"> 
        <Image 
          src="/LOGO_.png"
          alt="Logo Ecodeli"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <span className="text-2xl font-bold text-black dark:text-white">ecodeli</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden gap-6 items-center md:flex">
        <Link href="/" className="hover:text-sky-500 dark:hover:text-sky-400">
          Accueil
        </Link>
        {desktopNavItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-2 hover:text-sky-500 dark:hover:text-sky-400 ${
                currentPage === item.href ? 'text-sky-500 dark:text-sky-400' : ''
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {item.label}
              {item.badge && item.badge > 0 && (
                <span className="px-2 py-1 text-xs text-white bg-red-500 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Desktop Buttons */}
      <div className="hidden gap-4 items-center md:flex">
        {/* Dashboard Button */}
        {userRole && (
          <Link
            href={getRoleSpecificDashboardUrl(user)}
            className="inline-flex gap-2 items-center px-3 py-2 mr-2 text-sm font-medium text-white bg-sky-500 rounded-full transition-all duration-200 hover:bg-sky-600 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            title={getDashboardTitle(user)}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Mon Dashboard</span>
          </Link>
        )}
        
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
          ) : (
            <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
          )}
        </button>
        
        {user && (
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-sky-400 text-white font-medium px-5 py-2 rounded-full hover:bg-sky-500 transition flex items-center justify-center w-[60px] h-[40px]"
              aria-label="Ouvrir le menu utilisateur"
            >
              <User className="w-6 h-6" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 z-50 py-2 mt-2 w-64 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                  <p className="text-xs text-sky-600 dark:text-sky-400">
                    {user.userType || user.role || 'CLIENT'}
                  </p>
                </div>

                {/* Navigation Items */}
                <div className="py-2">
                  {navigationItems.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          currentPage === item.href 
                            ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' 
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <div className="flex gap-3 items-center">
                          <IconComponent className="w-4 h-4" />
                          {item.label}
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="px-2 py-1 text-xs text-white bg-red-500 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )
                  })}
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/profile"
                    className="flex gap-3 items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </Link>
                  <button
                    onClick={async () => {
                      await logout()
                      setIsDropdownOpen(false)
                    }}
                    className="flex gap-3 items-center px-4 py-2 w-full text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button 
        className="p-2 md:hidden"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? (
          <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        ) : (
          <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        )}
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 left-0 top-full z-50 p-6 mt-2 bg-white shadow-lg dark:bg-gray-800 md:hidden">
          {/* Dashboard Button for Mobile */}
          {user && (
            <div className="mb-4">
              <Link
                href={getRoleSpecificDashboardUrl(user)}
                className="inline-flex gap-2 justify-center items-center px-4 py-2 w-full text-base font-medium text-white bg-sky-500 rounded-full transition-all duration-200 hover:bg-sky-600 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                title={getDashboardTitle(user)}
                onClick={() => setIsMenuOpen(false)}
              >
                <BarChart3 className="w-5 h-5" />
                Mon Dashboard
              </Link>
            </div>
          )}
          
          <nav className="flex flex-col gap-4">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between hover:text-sky-500 dark:hover:text-sky-400 ${
                    currentPage === item.href 
                      ? 'text-sky-500 dark:text-sky-400' 
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex gap-3 items-center">
                    <IconComponent className="w-4 h-4" />
                    {item.label}
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-1 text-xs text-white bg-red-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
} 
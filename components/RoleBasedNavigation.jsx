import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sun,
  Moon,
  User,
  Menu,
  X,
  LogOut,
  ChevronRight,
  MessageCircle,
  Bell,
  Globe
} from 'lucide-react';

const RoleBasedNavigation = ({ isDarkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) {
    return (
      <header className="flex sticky top-0 z-50 justify-between items-center p-6 border-b border-gray-200 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 dark:border-gray-800">
        {/* Logo */}
        <div className="flex gap-2 items-center">
          <Link href="/" className="flex gap-2 items-center">
            <Image src="/LOGO_.png" alt="Logo Ecodeli" width={32} height={32} className="w-8 h-8" />
            <span className="text-2xl font-bold text-black dark:text-white">ecodeli</span>
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden gap-8 font-medium text-gray-800 md:flex dark:text-gray-200">
          <Link href="/" className="hover:text-sky-500 dark:hover:text-sky-400">{t('home')}</Link>
          <Link href="/services/browse" className="hover:text-sky-500 dark:hover:text-sky-400">{t('services')}</Link>
          <Link href="/storage/browse" className="hover:text-sky-500 dark:hover:text-sky-400">{t('storage')}</Link>
          <Link href="/trajet" className="hover:text-sky-500 dark:hover:text-sky-400">{t('rides')}</Link>
          <Link href="/login" className="hover:text-sky-500 dark:hover:text-sky-400">{t('login')}</Link>
          <Link href="/register" className="hover:text-sky-500 dark:hover:text-sky-400">{t('register')}</Link>
        </nav>
        {/* Desktop Buttons */}
        <div className="hidden gap-4 items-center md:flex">
          <button 
            onClick={toggleLanguage} 
            className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" 
            aria-label={t('toggleLanguage')}
          >
            <Globe className="w-5 h-5 text-gray-800 dark:text-gray-200" />
          </button>
          <button onClick={toggleDarkMode} className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t.toggleDarkMode}>
            {isDarkMode ? <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" /> : <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />}
          </button>
        </div>
        {/* Mobile Menu Button */}
        <button className="p-2 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-6 h-6 text-gray-800 dark:text-gray-200" /> : <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />}
        </button>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 left-0 top-full z-50 p-6 mt-2 bg-white shadow-lg dark:bg-gray-800 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="hover:text-sky-500 dark:hover:text-sky-400">{t('home')}</Link>
              <Link href="/services/browse" className="hover:text-sky-500 dark:hover:text-sky-400">{t('services')}</Link>
              <Link href="/storage/browse" className="hover:text-sky-500 dark:hover:text-sky-400">{t('storage')}</Link>
              <Link href="/trajet" className="hover:text-sky-500 dark:hover:text-sky-400">{t('rides')}</Link>
              <Link href="/login" className="hover:text-sky-500 dark:hover:text-sky-400">{t('login')}</Link>
              <Link href="/register" className="hover:text-sky-500 dark:hover:text-sky-400">{t('register')}</Link>
              <hr className="border-gray-200 dark:border-gray-700" />
              <button
                onClick={toggleLanguage}
                className="flex gap-2 items-center text-left text-gray-800 dark:text-gray-200 hover:text-sky-500 dark:hover:text-sky-400"
              >
                <Globe className="w-4 h-4" />
                {language === 'fr' ? 'English' : 'Français'}
              </button>
            </nav>
          </div>
        )}
      </header>
    );
  }

  const getNavigationItems = () => {
    const roleSpecificItems = {
      // Navigation pour les Clients/Particuliers
      CUSTOMER: [
        { href: '/dashboard/customer', label: t('dashboard') },
        { href: '/courses', label: t('courses') },
        { href: '/exp', label: t('send') },
        { href: '/trajet', label: t('rides') },
        { href: '/services/browse', label: t('services') },
        { href: '/storage/browse', label: t('storage') },
        { href: '/delivery-tracking', label: t('tracking') }
      ],

      // Navigation pour les Transporteurs
      CARRIER: [
        { href: '/dashboard/carrier', label: t('dashboard') },
        { href: '/trajet', label: t('findPackages') },
        { href: '/matches', label: t('matches') },
        { href: '/carrier-update', label: t('Mes Livraisons') },
        { href: '/earnings', label: t('earnings') }
      ],

      // Navigation pour les Transporteurs Professionnels
      CARRIER_PRO: [
        { href: '/dashboard/procarrier', label: t('dashboardPro') },
        { href: '/trajet', label: t('findPackages') },
        { href: '/matches', label: t('matches') },
        { href: '/carrier-update', label: t('Mes Livraisons') },
        { href: '/earnings', label: t('earnings') }
      ],

      // Navigation pour les Marchands
      MERCHANT: [
        { href: '/dashboard/merchant', label: t('dashboard') },
        { href: '/products', label: t('products') },
        { href: '/orders', label: t('orders') },
        { href: '/shipments', label: t('shipments') },
        { href: '/earnings', label: t('earnings') },
        { href: '/analytics', label: t('analytics') }
      ],

      // Navigation pour les Prestataires
      PROVIDER: [
        { href: '/dashboard/provider', label: t('dashboard') },
        { href: '/services/manage', label: t('myServices') },
        { href: '/bookings', label: t('bookings') },
        { href: '/clients', label: t('clients') },
        { href: '/earnings', label: t('earnings') }
      ],

      // Navigation pour les Prestataires de Services
      SERVICE_PROVIDER: [
        { href: '/dashboard/provider', label: t('dashboard') },
        { href: '/services/manage', label: t('myServices') },
        { href: '/bookings', label: t('bookings') },
        { href: '/clients', label: t('clients') },
        { href: '/earnings', label: t('earnings') }
      ],

      // Navigation pour les Prestataires Spécialisés
      SPECIALIZED_PROVIDER: [
        { href: '/dashboard/specialized-provider', label: t('dashboard') },
        { href: '/calendar', label: t('calendar') },
        { href: '/services/specialized', label: t('specializedServices') },
        { href: '/clients/manage', label: t('manageClients') },
        { href: '/invoices', label: t('invoices') }
      ]
    };

    const userRole = user.role || user.userType || 'CUSTOMER';
    
    // Vérifier si c'est un transporteur professionnel
    if (userRole === 'CARRIER' && user.userType === 'PROFESSIONAL') {
      return roleSpecificItems.CARRIER_PRO;
    }
    
    return roleSpecificItems[userRole] || roleSpecificItems.CUSTOMER;
  };

  const navigationItems = getNavigationItems();

  const getRoleDisplayName = () => {
    const roleNames = {
      CUSTOMER: t('client'),
      CARRIER: t('carrier'), 
      MERCHANT: t('merchant'),
      PROVIDER: t('provider'),
      SERVICE_PROVIDER: t('serviceProvider'),
      SPECIALIZED_PROVIDER: t('specializedProvider'),
      ADMIN: t('admin')
    };
    
    const userRole = user.role || user.userType || 'CUSTOMER';
    
    // Vérifier si c'est un transporteur professionnel
    if (userRole === 'CARRIER' && user.userType === 'PROFESSIONAL') {
      return t('carrierPro');
    }
    
    return roleNames[userRole] || t('user');
  };

  return (
    <header className="flex sticky top-0 z-50 justify-between items-center p-6 border-b border-gray-200 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 dark:border-gray-800">
      {/* Logo */}
      <div className="flex gap-2 items-center w-1/4">
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
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden justify-center w-2/4 font-medium text-gray-800 md:flex dark:text-gray-200">
        <div className="flex gap-8">
          {navigationItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="hover:text-sky-500 dark:hover:text-sky-400"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Buttons */}
      <div className="hidden gap-4 justify-end items-center w-1/4 md:flex">
        <Link 
          href="/messages"
          className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t('messages')}
        >
          <MessageCircle className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        </Link>
        <Link 
          href="/notifications"
          className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t('notifications')}
        >
          <Bell className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        </Link>
        <button 
          onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} 
          className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" 
          aria-label={t.toggleLanguage}
        >
          <Globe className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        </button>
                  <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t('toggleDarkMode')}
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
              className="flex justify-center items-center px-5 py-2 w-[60px] h-[40px] font-medium text-white bg-sky-400 rounded-full transition hover:bg-sky-500"
              aria-label={t('openUserMenu')}
              aria-haspopup="true"
            >
              <User className="w-6 h-6" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 z-50 py-2 mt-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                {user.userType === 'PROFESSIONAL' ? (
                  <>
                    {user.companyName && (
                      <p className="text-sm font-bold text-black dark:text-white">
                        {user.companyName}
                      </p>
                    )}
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.companyFirstName || user.firstName} {user.companyLastName || user.lastName}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
                <span className="inline-block px-2 py-1 mt-1 text-xs text-sky-600 bg-sky-100 rounded-full dark:bg-sky-900 dark:text-sky-300">
                  {getRoleDisplayName()}
                </span>
              </div>

                <div className="py-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ))}
                  <Link
                    href="/messages"
                    className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>{t('messages')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>{t('notifications')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/profile"
                    className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>{t('myProfile')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      setIsDropdownOpen(false);
                    }}
                    className="flex justify-between items-center px-4 py-2 w-full text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <span>{t('logout')}</span>
                    <LogOut className="w-4 h-4" />
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
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              className="text-gray-800 dark:text-gray-200 hover:text-sky-500 dark:hover:text-sky-400"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('home')}
            </Link>
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-800 dark:text-gray-200 hover:text-sky-500 dark:hover:text-sky-400"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/messages"
              className="text-gray-800 dark:text-gray-200 hover:text-sky-500 dark:hover:text-sky-400"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('messages')}
            </Link>
            <Link
              href="/notifications"
              className="text-gray-800 dark:text-gray-200 hover:text-sky-500 dark:hover:text-sky-400"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('notifications')}
            </Link>
            <hr className="border-gray-200 dark:border-gray-700" />
            <button
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="flex gap-2 items-center text-left text-gray-800 dark:text-gray-200 hover:text-sky-500 dark:hover:text-sky-400"
            >
              <Globe className="w-4 h-4" />
              {language === 'fr' ? 'English' : 'Français'}
            </button>
            <Link
              href="/profile"
              className="text-gray-800 dark:text-gray-200 hover:text-sky-500 dark:hover:text-sky-400"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('myProfile')}
            </Link>
            <button
              onClick={async () => {
                await logout();
                setIsMenuOpen(false);
              }}
              className="flex gap-2 items-center text-left text-gray-800 dark:text-gray-200 hover:text-sky-500 dark:hover:text-sky-400"
            >
              <LogOut className="w-4 h-4" />
              {t('logout')}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default RoleBasedNavigation;

// Utility functions for dashboard routing
export const getRoleSpecificDashboardUrl = (user) => {
  const userRole = user.role || user.userType || 'CUSTOMER';
  
  const dashboardUrls = {
    CUSTOMER: '/dashboard/customer',
    CARRIER: '/dashboard/carrier',
    MERCHANT: '/dashboard/merchant',
    PROVIDER: '/dashboard/provider',
    SERVICE_PROVIDER: '/dashboard/provider',
    SPECIALIZED_PROVIDER: '/dashboard/specialized-provider',
    ADMIN: '/admin-dashboard'
  };
  
  // Vérifier si c'est un transporteur professionnel
  if (userRole === 'CARRIER' && user.userType === 'PROFESSIONAL') {
    return '/dashboard/procarrier';
  }

  // Vérifier si c'est un prestataire professionnel
  if (userRole === 'PROVIDER' && user.userType === 'PROFESSIONAL') {
    return '/dashboard/proprovider';
  }
  
  return dashboardUrls[userRole] || '/dashboard/customer';
};

export const getDashboardTitle = (user, t) => {
  if (!t) {
    // Fallback en cas de t non fourni
    return 'Dashboard';
  }
  
  const userRole = user.role || user.userType || 'CUSTOMER';
  
  const dashboardTitles = {
    CUSTOMER: t('clientDashboard'),
    CARRIER: t('carrierDashboard'),
    MERCHANT: t('merchantDashboard'),
    PROVIDER: t('providerDashboard'),
    SERVICE_PROVIDER: t('serviceProviderDashboard'),
    SPECIALIZED_PROVIDER: t('specializedProviderDashboard'),
    ADMIN: t('adminDashboard')
  };
  
  // Vérifier si c'est un transporteur professionnel
  if (userRole === 'CARRIER' && user.userType === 'PROFESSIONAL') {
    return t('carrierProDashboard');
  }
  
  return dashboardTitles[userRole] || t('dashboard');
}; 
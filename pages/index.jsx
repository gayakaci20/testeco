import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/TranslationContext'
import RoleBasedNavigation from '../components/RoleBasedNavigation'

import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X, 
  Plus, 
  Users, 
  Check, 
  DollarSign, 
  Heart, 
  Shield, 
  Zap, 
  Eye, 
  Star,
  Twitter,
  Facebook,
  Instagram,
  Package,
  Truck,
  Store,
  Wrench,
  Calendar,
  ArrowRight,
  MapPin,
  Clock,
  BadgeCheck,
  BarChart3
} from 'lucide-react'

export default function Home({ isDarkMode, toggleDarkMode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { user, loading, logout } = useAuth()
  const { t } = useTranslation()

  const userTypeCards = [
    {
      title: t('individualClient'),
      description: t('individualClientDesc'),
      icon: Package,
      features: [t('packageSending'), t('homeServices'), t('realTimeTracking')],
      color: "bg-blue-500",
      link: "/register?type=customer"
    },
    {
      title: t('professionalCarrier'),
      description: t('professionalCarrierDesc'),
      icon: Truck,
      features: [t('routeProposals'), t('deliveryManagement'), t('flexibleEarnings')],
      color: "bg-green-500",
      link: "/register?type=carrier"
    },
    {
      title: t('merchantSeller'),
      description: t('merchantSellerDesc'),
      icon: Store,
      features: [t('productSales'), t('shippingManagement'), t('businessAnalytics')],
      color: "bg-purple-500",
      link: "/register?type=merchant"
    },
    {
      title: t('serviceProvider'),
      description: t('serviceProviderDesc'),
      icon: Wrench,
      features: [t('variousServices'), t('bookingCalendar'), t('automaticBilling')],
      color: "bg-orange-500",
      link: "/register?type=service_provider"
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>ecodeli - Plateforme Écologique Multi-Services</title>
        <meta name="description" content="Livraison écologique, services à domicile et marketplace intégrée" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Global navigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Hero Section */}
      <section className="overflow-hidden relative py-20">
        <div className="container px-6 mx-auto">
          <div className="grid gap-12 items-center mx-auto max-w-7xl md:grid-cols-2">
            {/* Texte côté gauche */}
            <div className="text-center md:text-left">
              <h1 className="mb-6 text-5xl font-bold text-gray-900 md:text-6xl dark:text-white">
                {t('welcomeTitle')} <span className="text-sky-400">{t('welcomeSubtitle')}</span> {t('welcomeMultiServices')}
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
                {t('welcomeDescription')}
              </p>
              <div className="flex flex-col gap-4 justify-center md:justify-start sm:flex-row">
                <Link 
                  href="/register"
                  className="flex justify-center items-center px-8 py-4 font-semibold text-white bg-sky-400 rounded-full transition hover:bg-sky-500"
                >
                  {t('getStarted')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link 
                  href="/services/browse"
                  className="px-8 py-4 font-semibold text-center text-sky-400 rounded-full border-2 border-sky-400 transition hover:bg-sky-50 dark:hover:bg-sky-900/20"
                >
                  {t('learnMore')}
                </Link>
              </div>
            </div>

            {/* Illustration pin */}
            <div className="flex justify-center mt-10 md:justify-end md:mt-0">
              <Image
                src="/pin.png"
                alt="Illustration Ecodeli"
                width={450}
                height={450}
                className="w-full max-w-sm h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* User Type Cards */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container px-6 mx-auto">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              Choisissez votre profil
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
              Des interfaces dédiées pour chaque type d'utilisateur
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {userTypeCards.map((card, index) => (
              <div key={index} className="overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-300 dark:bg-gray-800 hover:shadow-xl group">
                <div className={`${card.color} p-6 text-white`}>
                  <card.icon className="mb-4 w-12 h-12" />
                  <h3 className="mb-2 text-xl font-bold">{card.title}</h3>
                  <p className="text-sm opacity-90">{card.description}</p>
                </div>
                <div className="p-6">
                  <ul className="mb-6 space-y-3">
                    {card.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-600 dark:text-gray-300">
                        <Check className="flex-shrink-0 mr-3 w-5 h-5 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href={card.link}
                    className="block py-3 font-semibold text-center text-gray-800 bg-gray-100 rounded-lg transition dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/20"
                  >
                    Commencer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container px-6 mx-auto">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              Pourquoi choisir EcoDeli ?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full dark:bg-green-900/20">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Écologique</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Optimisation des trajets et impact environnemental réduit
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-blue-100 rounded-full dark:bg-blue-900/20">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Rapide</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Livraisons optimisées et services disponibles rapidement
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-purple-100 rounded-full dark:bg-purple-900/20">
                <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Humain</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Support de proximité et communauté bienveillante
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-2 text-4xl font-bold text-sky-500">10k+</div>
              <div className="text-gray-600 dark:text-gray-300">Utilisateurs actifs</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-green-500">50k+</div>
              <div className="text-gray-600 dark:text-gray-300">Colis livrés</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-purple-500">500+</div>
              <div className="text-gray-600 dark:text-gray-300">Services disponibles</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-orange-500">95%</div>
              <div className="text-gray-600 dark:text-gray-300">Satisfaction client</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white bg-gradient-to-r from-sky-400 to-blue-600">
        <div className="container px-6 mx-auto text-center">
          <h2 className="mb-6 text-4xl font-bold">
            Prêt à rejoindre la révolution écologique ?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
            Créez votre compte et découvrez tous nos services
          </p>
          <Link 
            href="/register"
            className="inline-flex items-center px-8 py-4 font-semibold text-sky-600 bg-white rounded-full transition hover:bg-gray-100"
          >
            Créer un compte gratuit
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 text-white bg-gray-900">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="flex gap-2 items-center mb-6">
                <Image 
                  src="/LOGO_.png"
                  alt="Logo Ecodeli"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-2xl font-bold">ecodeli</span>
              </div>
              <p className="mb-6 text-gray-400">
                La plateforme écologique qui connecte les utilisateurs pour un transport durable et des services de proximité.
              </p>
              <div className="flex space-x-4">
                <Facebook className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white" />
                <Twitter className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white" />
                <Instagram className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white" />
              </div>
            </div>

            <div>
              <h3 className="mb-6 text-lg font-semibold">Services</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/services/browse" className="hover:text-white">Découvrir les services</Link></li>
                <li><Link href="/trajet" className="hover:text-white">Voir les trajets</Link></li>
                <li><Link href="/storage/browse" className="hover:text-white">Stockage</Link></li>
                <li><Link href="/exp" className="hover:text-white">Expédier un colis</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-lg font-semibold">Compte</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/login" className="hover:text-white">Se connecter</Link></li>
                <li><Link href="/register" className="hover:text-white">Créer un compte</Link></li>
                <li><Link href="/profile" className="hover:text-white">Mon profil</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-lg font-semibold">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white">Centre d'aide</a></li>
                <li><a href="mailto:contact@ecodeli.com" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-12 text-center text-gray-400 border-t border-gray-800">
            <p>&copy; 2025 ecodeli. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 
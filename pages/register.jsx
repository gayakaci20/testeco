import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react' // Importer useState et useEffect
import { useRouter } from 'next/router' // Importer useRouter pour la redirection
import { useTranslation } from '../contexts/TranslationContext' // Importer le contexte de traduction
import { Sun, Moon } from 'lucide-react'

// Ajout d'une fonction utilitaire pour évaluer la robustesse du mot de passe
const evaluatePasswordStrength = (password, t) => {
  let score = 0
  if (password.length >= 6) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (password.length >= 12) score++
  // Limiter le score à 4
  if (score > 4) score = 4
  const labels = [t('veryWeak'), t('weak'), t('medium'), t('strong'), t('veryStrong')]
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-lime-500', 'bg-green-500']
  return { score, label: labels[score], color: colors[score] }
}

export default function Register({ isDarkMode, toggleDarkMode }) {
  const router = useRouter(); // Initialiser useRouter
  const { t } = useTranslation(); // Utiliser le contexte de traduction
  // États pour les champs du formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'INDIVIDUAL', // INDIVIDUAL ou PROFESSIONAL 
    role: 'CUSTOMER', // CUSTOMER, CARRIER, MERCHANT, PROVIDER, SERVICE_PROVIDER
    // Champs pour les professionnels
    companyName: '',
    companyFirstName: '',
    companyLastName: '',
    terms: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // État pour la robustesse du mot de passe
  const [passwordStrength, setPasswordStrength] = useState(evaluatePasswordStrength('', t));

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Mettre à jour l'indicateur de robustesse lorsqu'on saisit le mot de passe
    if (name === 'password') {
      setPasswordStrength(evaluatePasswordStrength(value, t));
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation simple côté client
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordMismatch'));
      setIsLoading(false);
      return;
    }
    // Vérifier la robustesse minimale du mot de passe (au moins « Moyen »)
    if (passwordStrength.score < 2) {
      setError(t('passwordTooWeak'));
      setIsLoading(false);
      return;
    }
    if (!formData.terms) {
      setError(t('mustAcceptTerms'));
      setIsLoading(false);
      return;
    }
    // Validation conditionnelle selon le type d'utilisateur
    if (formData.userType === 'INDIVIDUAL') {
      if (!formData.firstName || !formData.lastName) {
        setError(t('fillFirstLastName'));
        setIsLoading(false);
        return;
      }
    } else if (formData.userType === 'PROFESSIONAL') {
      if (!formData.companyName || !formData.companyFirstName || !formData.companyLastName) {
        setError(t('fillCompanyFields'));
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          userType: formData.userType, // Envoyer le vrai userType (INDIVIDUAL/PROFESSIONAL)
          role: formData.role,
          // Champs professionnels
          companyName: formData.companyName,
          companyFirstName: formData.companyFirstName,
          companyLastName: formData.companyLastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue lors de l\'inscription.');
      }

      // Inscription réussie, rediriger vers la page de connexion
      console.log('Inscription réussie:', data);
      router.push('/login'); // Redirection vers la page de connexion

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Définir les rôles disponibles avec leurs descriptions
  const allRoleOptions = [
    {
      value: 'CUSTOMER',
      label: t('customerRole'),
      description: t('customerRoleDesc'),
      userTypes: ['INDIVIDUAL']
    },
    {
      value: 'CARRIER',
      label: t('carrierRole'),
      description: t('carrierRoleDesc'),
      userTypes: ['INDIVIDUAL', 'PROFESSIONAL']
    },
    {
      value: 'MERCHANT',
      label: t('merchantRole'),
      description: t('merchantRoleDesc'),
      userTypes: ['PROFESSIONAL']
    },
    {
      value: 'PROVIDER',
      label: t('providerRole'),
      description: t('providerRoleDesc'),
      userTypes: ['INDIVIDUAL']
    },
    {
      value: 'PROVIDER',
      label: t('serviceProviderRole'),
      description: t('serviceProviderRoleDesc'),
      userTypes: ['PROFESSIONAL']
    }
  ];

  // Filtrer les rôles selon le type d'utilisateur sélectionné
  const roleOptions = allRoleOptions.filter(role => 
    role.userTypes.includes(formData.userType)
  );

  // Réinitialiser le rôle si celui sélectionné n'est plus disponible
  useEffect(() => {
    const availableRoles = allRoleOptions.filter(role => 
      role.userTypes.includes(formData.userType)
    );
    const isCurrentRoleAvailable = availableRoles.some(role => role.value === formData.role);
    if (!isCurrentRoleAvailable && availableRoles.length > 0) {
      setFormData(prevData => ({
        ...prevData,
        role: availableRoles[0].value // Sélectionner le premier rôle disponible
      }));
    }
  }, [formData.userType, allRoleOptions, formData.role]); // Se déclenche quand userType change

  return (
    <div className="flex flex-col justify-center items-center px-4 py-12 min-h-screen bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Head>
        <title>{t('register')} - ecodeli</title>
        <meta name="description" content={t('registerDescription')} />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <div className="p-8 w-full max-w-2xl bg-white rounded-lg shadow-md dark:bg-gray-800">
        {/* Logo */}
        <div className="flex justify-between items-center mb-6">
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
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={t('toggleDarkMode')}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            ) : (
              <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            )}
          </button>
        </div>

        {/* Titre */}
        <h1 className="mb-2 text-3xl font-bold text-center text-gray-900 dark:text-white">
          {t('registerTitle')}
        </h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">
          {t('registerSubtitle')}
        </p>

        {/* Affichage des erreurs */}
        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 rounded border border-red-400 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form className="space-y-6" onSubmit={handleSubmit}> {/* Ajouter onSubmit */} 
          {/* Section Type d'utilisateur */}
          <div>
            <label className="block mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
              {t('iAm')}
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="userType"
                    value="INDIVIDUAL"
                    checked={formData.userType === 'INDIVIDUAL'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.userType === 'INDIVIDUAL' 
                      ? 'border-sky-500 bg-sky-500' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}>
                    {formData.userType === 'INDIVIDUAL' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-base font-medium text-gray-900 dark:text-gray-300">{t('individual')}</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="userType"
                    value="PROFESSIONAL"
                    checked={formData.userType === 'PROFESSIONAL'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.userType === 'PROFESSIONAL' 
                      ? 'border-sky-500 bg-sky-500' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}>
                    {formData.userType === 'PROFESSIONAL' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-base font-medium text-gray-900 dark:text-gray-300">{t('professional')}</span>
              </label>
            </div>
          </div>

          {/* Section Profil avec les nouveaux rôles */}
          <div>
            <label className="block mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
              {t('myProfile')}
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roleOptions.map((option) => (
                <label key={option.value} className="flex flex-col p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 group">
                  <div className="flex items-center mb-2">
                    <div className="relative">
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={formData.role === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.role === option.value 
                          ? 'border-sky-500 bg-sky-500' 
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                      }`}>
                        {formData.role === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <span className="ml-3 text-base font-medium text-gray-900 dark:text-gray-300">
                      {option.label}
                    </span>
                  </div>
                  <p className="ml-8 text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* Champs Prénom et Nom - Affichés seulement pour les particuliers */}
          {formData.userType === 'INDIVIDUAL' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('firstName')}
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={formData.firstName} // Lier la valeur à l'état
                onChange={handleChange} // Gérer les changements
                  className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
                <label htmlFor="lastName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('lastName')}
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={formData.lastName} // Lier la valeur à l'état
                onChange={handleChange} // Gérer les changements
                  className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          )}

          {/* Section Informations société - Affichée seulement pour les professionnels */}
          {formData.userType === 'PROFESSIONAL' && (
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
              <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                {t('companyInformation')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="companyName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t('companyName')}
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Ex : Legris SARL"
                    required={formData.userType === 'PROFESSIONAL'}
                    value={formData.companyName}
                    onChange={handleChange}
                    className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-600">
                  <h4 className="mb-3 text-base font-medium text-gray-700 dark:text-gray-200">
                    {t('companyManager')}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="companyFirstName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t('firstName')}
                      </label>
                      <input
                        id="companyFirstName"
                        name="companyFirstName"
                        type="text"
                        required={formData.userType === 'PROFESSIONAL'}
                        value={formData.companyFirstName}
                        onChange={handleChange}
                        className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="companyLastName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        {t('lastName')}
                      </label>
                      <input
                        id="companyLastName"
                        name="companyLastName"
                        type="text"
                        required={formData.userType === 'PROFESSIONAL'}
                        value={formData.companyLastName}
                        onChange={handleChange}
                        className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('phone')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              // required // Le téléphone est optionnel dans le schéma Prisma
              value={formData.phone} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
            {/* Indicateur de robustesse du mot de passe */}
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{t('passwordStrength')} : {passwordStrength.label}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded dark:bg-gray-600">
                <div
                  className={`h-2 rounded ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.score * 25}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              checked={formData.terms} // Lier la valeur à l'état
              onChange={handleChange} // Gérer les changements
              className="w-4 h-4 text-sky-500 rounded border-gray-300 focus:ring-sky-500 dark:border-gray-600"
            />
            <label htmlFor="terms" className="block ml-2 text-sm text-gray-700 dark:text-gray-200">
              {t('iAcceptThe')}{' '}
              <Link href="/terms" className="text-sky-400 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
                {t('termsOfUse')}
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading} // Désactiver pendant le chargement
            className="flex justify-center px-4 py-3 w-full text-sm font-medium text-white bg-sky-400 rounded-full border border-transparent shadow-sm transition-colors hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('creatingAccount') : t('createAccount')}
          </button>

          <div className="text-sm text-center text-gray-600 dark:text-gray-300">
            {t('alreadyHaveAccount')}{' '}
            <Link 
              href="/login"
              className="font-medium text-sky-400 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
            >
              {t('loginLink')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
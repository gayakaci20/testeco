import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Copy,
  ArrowLeft,
  Info
} from 'lucide-react';

export default function PaymentTestHelp() {
  const [copiedCard, setCopiedCard] = useState('');

  const testCards = [
    {
      number: '4242424242424242',
      type: 'Visa',
      description: 'Paiement réussi',
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      number: '4000000000000002',
      type: 'Visa',
      description: 'Carte refusée',
      icon: XCircle,
      color: 'text-red-500'
    },
    {
      number: '4000000000000069',
      type: 'Visa',
      description: 'Carte expirée',
      icon: XCircle,
      color: 'text-orange-500'
    },
    {
      number: '4000000000000127',
      type: 'Visa',
      description: 'CVV incorrect',
      icon: XCircle,
      color: 'text-orange-500'
    }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCard(text);
    setTimeout(() => setCopiedCard(''), 2000);
  };

  const formatCardNumber = (number) => {
    return number.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Guide de test des paiements - EcoDeli</title>
        <meta name="description" content="Comment tester les paiements avec des cartes de test" />
      </Head>

      <div className="px-6 py-8 mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Guide de test des paiements
          </h1>
        </div>

        {/* Introduction */}
        <div className="p-6 mb-8 bg-blue-50 rounded-lg dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-500 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                À propos des tests de paiement
              </h2>
              <p className="text-blue-800 dark:text-blue-200">
                EcoDeli utilise Stripe pour traiter les paiements. En mode test, vous pouvez utiliser des numéros de carte spéciaux 
                pour simuler différents scénarios de paiement sans effectuer de vrais achats.
              </p>
            </div>
          </div>
        </div>

        {/* Test Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Cartes de test disponibles
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {testCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {card.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${card.color}`} />
                      <span className={`text-sm ${card.color}`}>
                        {card.description}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <code className="px-3 py-2 bg-gray-100 rounded font-mono text-sm dark:bg-gray-700">
                      {formatCardNumber(card.number)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(card.number)}
                      className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedCard === card.number ? 'Copié!' : 'Copier'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Comment tester un paiement
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center dark:bg-sky-900">
                <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Choisissez une boîte de stockage
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Allez dans la section "Stockage" et sélectionnez une boîte à louer.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center dark:bg-sky-900">
                <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Remplissez le formulaire de réservation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choisissez vos dates de location et remplissez vos informations.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center dark:bg-sky-900">
                <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Utilisez une carte de test
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Sur la page de paiement, utilisez <code className="px-1 bg-gray-100 rounded dark:bg-gray-700">4242 4242 4242 4242</code> comme numéro de carte.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center dark:bg-sky-900">
                <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Complétez les autres champs
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Utilisez n'importe quelle date d'expiration future (ex: 12/25), n'importe quel CVV (ex: 123), et un nom valide.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
            ⚠️ Important à savoir
          </h3>
          <ul className="space-y-2 text-yellow-700 dark:text-yellow-300">
            <li>• Ces cartes ne fonctionnent qu'en mode test - aucun vrai paiement n'est effectué</li>
            <li>• Toute autre carte que celles listées ci-dessus sera simulée comme réussie</li>
            <li>• En production, seules les vraies cartes fonctionneront</li>
            <li>• Les notifications et confirmations fonctionnent normalement même en test</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Link href="/storage/browse">
            <button className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
              Tester maintenant
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
              Retour au dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 
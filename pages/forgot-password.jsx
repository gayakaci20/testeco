import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ForgotPassword({ isDarkMode, toggleDarkMode }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la demande.');
      }

      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 py-12 min-h-screen bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Head>
        <title>Mot de passe oublié - ecodeli</title>
        <meta name="description" content="Réinitialisez votre mot de passe ecodeli" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex gap-2 items-center">
            <Image src="/LOGO_.png" alt="Logo Ecodeli" width={32} height={32} className="w-8 h-8" />
            <span className="text-2xl font-bold text-black dark:text-white">ecodeli</span>
          </Link>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" /> : <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />}
          </button>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-center text-gray-900 dark:text-white">Mot de passe oublié ?</h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>

        {message && (
          <div className="p-3 mb-4 text-green-700 bg-green-100 rounded border border-green-400 dark:bg-green-900 dark:border-green-700 dark:text-green-200">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 rounded border border-red-400 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex justify-center px-4 py-3 w-full text-sm font-medium text-white bg-sky-400 rounded-full border border-transparent shadow-sm transition-colors hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>
        </form>
      </div>
    </div>
  );
} 
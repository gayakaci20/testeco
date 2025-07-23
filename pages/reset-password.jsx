import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ResetPassword({ isDarkMode, toggleDarkMode }) {
  const router = useRouter();
  const { token, email } = router.query;

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: formData.newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la réinitialisation.');
      }

      setMessage('Mot de passe mis à jour avec succès. Vous pouvez vous connecter.');
      // Optionally redirect after a delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Wait for query ready
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (router.isReady) setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex flex-col justify-center items-center px-4 py-12 min-h-screen bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <Head>
        <title>Nouveau mot de passe - ecodeli</title>
        <meta name="description" content="Choisissez un nouveau mot de passe ecodeli" />
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

        <h1 className="mb-2 text-3xl font-bold text-center text-gray-900 dark:text-white">Nouveau mot de passe</h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">Choisissez votre nouveau mot de passe.</p>

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
            <label htmlFor="newPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Nouveau mot de passe
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              value={formData.newPassword}
              onChange={handleChange}
              className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="block px-3 py-2 w-full placeholder-gray-400 text-gray-900 bg-white rounded-lg border border-gray-300 shadow-sm appearance-none dark:border-gray-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex justify-center px-4 py-3 w-full text-sm font-medium text-white bg-sky-400 rounded-full border border-transparent shadow-sm transition-colors hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
} 
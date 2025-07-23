import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// Liste des routes protégées qui nécessitent une authentification
const protectedRoutes = [
  '/profile',
  '/dashboard',
  '/settings',
];

// Liste des routes publiques d'authentification
const authRoutes = [
  '/login',
  '/register',
];

// Fonction pour obtenir le token avec support des sessions multiples
function getSessionToken(request) {
  const sessionId = request.cookies.get('session_id')?.value;
  
  if (sessionId) {
    // Essayer de récupérer le token avec l'ID de session
    const sessionToken = request.cookies.get(`auth_token_${sessionId}`)?.value;
    if (sessionToken) {
      return { token: sessionToken, sessionId };
    }
  }
  
  // Fallback vers l'ancien système
  const fallbackToken = request.cookies.get('auth_token')?.value || request.cookies.get('token')?.value;
  return { token: fallbackToken, sessionId: null };
}

export async function middleware(request) {
  // Récupérer le token avec support des sessions multiples
  const { token, sessionId } = getSessionToken(request);
  const { pathname } = request.nextUrl;
  
  // Log pour debug des sessions multiples
  if (sessionId) {
    console.log('🆔 Middleware session:', { sessionId: sessionId.substring(0, 20) + '...', pathname });
  }
  
  // Vérifier si la route actuelle est protégée
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Vérifier si la route actuelle est une route d'authentification
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Si c'est une route protégée et qu'il n'y a pas de token valide, rediriger vers la connexion
  if (isProtectedRoute) {
    if (!token) {
      console.log('🔒 Middleware: No token found, redirecting to login');
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Vérifier la validité du token
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      console.log('❌ Middleware: Token verification failed. This could be due to:');
      console.log('   - Different JWT_SECRET between environments');
      console.log('   - Expired token');
      console.log('   - Corrupted token');
      console.log('   - Token format: ', token?.substring(0, 50) + '...');
      
      // Nettoyer le cookie invalide et rediriger
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
    
    console.log('✅ Middleware: Token verified for user:', decodedToken.email);
  }
  
  // Si l'utilisateur est déjà connecté et essaie d'accéder à une page d'authentification,
  // le rediriger vers le tableau de bord approprié selon son rôle
  if (isAuthRoute && token) {
    const decodedToken = await verifyToken(token);
    if (decodedToken) {
      // Mapping des rôles vers leurs tableaux de bord spécifiques
      const roleRoutes = {
        'ADMIN': '/admin-dashboard',
        'CARRIER': '/dashboard/carrier',
        'CUSTOMER': '/dashboard/customer', 
        'MERCHANT': '/dashboard/merchant',
        'SERVICE_PROVIDER': '/dashboard/provider',
        'PROVIDER': '/dashboard/provider',
        'SPECIALIZED_PROVIDER': '/dashboard/specialized-provider'
      };
      
      // Utiliser le même ordre que dans RoleBasedNavigation: role d'abord, puis userType
      const userRole = decodedToken.role || decodedToken.userType || 'CUSTOMER';
      let redirectPath = roleRoutes[userRole] || '/dashboard/customer'; // Par défaut vers customer
      
      // Vérifier si c'est un transporteur professionnel
      if ((decodedToken.role === 'CARRIER' || decodedToken.userType === 'CARRIER') && decodedToken.userType === 'PROFESSIONAL') {
        redirectPath = '/dashboard/procarrier';
      }

      // Vérifier si c'est un prestataire professionnel
      if ((decodedToken.role === 'PROVIDER' || decodedToken.userType === 'PROVIDER') && decodedToken.userType === 'PROFESSIONAL') {
        redirectPath = '/dashboard/proprovider';
      }
      
      console.log('🔄 Middleware redirect: User role:', userRole, 'Redirect to:', redirectPath);
      
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.next();
}

// Configurer les chemins sur lesquels le middleware doit s'exécuter
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
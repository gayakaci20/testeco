import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assurez-vous que ce chemin vers prisma est correct depuis cet emplacement
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// IMPORTANT : Chargez TOUJOURS les secrets depuis les variables d'environnement
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  // Vérification que JWT_SECRET est bien chargé (essentiel pour la sécurité)
  if (!JWT_SECRET) {
    console.error("Erreur critique: JWT_SECRET n'est pas défini dans les variables d'environnement.");
    // Ne donnez pas trop d'infos à l'attaquant, mais loguez-le côté serveur.
    return NextResponse.json({ error: 'Configuration serveur incorrecte.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe sont requis.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email) },
      // IMPORTANT : Votre configuration NextAuth.js originale vérifiait `role: 'ADMIN'`.
      // Décidez si ce login mobile doit AUSSI être réservé aux admins.
      // Si oui, et si votre modèle User a un champ 'role', décommentez la ligne ci-dessous :
      // where: { email: String(email), role: 'ADMIN' },
    });

    if (!user || !user.password) {
      // Message générique pour ne pas indiquer si l'email existe ou non
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }

    // Les identifiants sont valides, générer un JWT
    const tokenPayload = {
      userId: user.id, // Ou simplement 'id' si c'est ce que vous préférez dans le token
      email: user.email,
      role: user.role, // Assurez-vous que user.role existe dans votre modèle Prisma User
      name: `${user.firstName} ${user.lastName}`, // Adaptez si les noms de champs sont différents
      // Ajoutez d'autres données utilisateur nécessaires dans le payload du token
    };

    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET, // Utilisation du secret chargé depuis process.env
      { expiresIn: '7d' } // Durée de validité du token (ajustable)
    );

    // Renvoyer le token ET les informations utilisateur de base (recommandé)
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`, // Adaptez si besoin
        role: user.role,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur de login API:', error); // Loguez l'erreur détaillée côté serveur
    // Message d'erreur générique pour le client
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}

// Optionnel : Vous pouvez ajouter un handler GET pour cette route si vous voulez
// indiquer qu'elle existe mais n'accepte que POST pour le login.
// export async function GET(request: NextRequest) {
//   return NextResponse.json({ message: "Utilisez la méthode POST pour vous connecter." }, { status: 405 });
// }
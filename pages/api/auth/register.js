import bcryptjs from 'bcryptjs';
import { prisma, ensureConnected } from '../../../lib/prisma';
import { randomBytes } from 'crypto';
import EmailSMSNotificationService from '../../../lib/email-sms-notifications.js';

export default async function handler(req, res) {
  // Assurer que la réponse est toujours du JSON
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password, 
      role = 'CUSTOMER', 
      userType = 'INDIVIDUAL',
      companyName,
      companyFirstName,
      companyLastName
    } = req.body;

    // Validation simple
    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez fournir l\'email et le mot de passe.' });
    }

    // Validation conditionnelle selon le type d'utilisateur
    if (userType === 'INDIVIDUAL' && (!firstName || !lastName)) {
      return res.status(400).json({ message: 'Veuillez fournir le prénom et le nom.' });
    }

    if (userType === 'PROFESSIONAL' && (!companyName || !companyFirstName || !companyLastName)) {
      return res.status(400).json({ message: 'Veuillez fournir toutes les informations de la société.' });
    }

    // Validate role
    const validRoles = ['CUSTOMER', 'CARRIER', 'MERCHANT', 'PROVIDER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Rôle utilisateur invalide. Rôles valides: ' + validRoles.join(', ') 
      });
    }

    // Validate userType
    const validUserTypes = ['INDIVIDUAL', 'PROFESSIONAL'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ 
        message: 'Type utilisateur invalide. Types valides: ' + validUserTypes.join(', ') 
      });
    }

    // Ensure database connection
    await ensureConnected();

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create verification token
    const verificationToken = randomBytes(32).toString('hex');

    // Prepare user data based on userType
    let userData = {
      email,
      password: hashedPassword,
      role,
      userType,
      isVerified: false,
      verificationToken,
      ...(phone && { phoneNumber: phone })
    };

    // Add specific fields based on userType
    if (userType === 'INDIVIDUAL') {
      userData.firstName = firstName;
      userData.lastName = lastName;
    } else if (userType === 'PROFESSIONAL') {
      userData.companyName = companyName;
      userData.companyFirstName = companyFirstName;
      userData.companyLastName = companyLastName;
    }

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: userData
    });

    // Send verification email
    try {
      const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL || req.headers.origin || 'https://www.ecodeli.pro';
      const verificationUrl = `${origin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

      await EmailSMSNotificationService.sendEmail(user.email, 'EMAIL_VERIFICATION', {
        firstName: user.firstName || user.companyFirstName || 'utilisateur',
        verificationUrl,
      });

      console.log('Email de vérification envoyé à:', user.email);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de vérification:', emailError);
      // Don't fail registration if email fails
    }

    // Retourner l'utilisateur créé (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      message: 'Utilisateur créé avec succès. Vérifiez votre email pour activer votre compte.',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
    }

    return res.status(500).json({ 
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur interne est survenue'
    });
  }
}
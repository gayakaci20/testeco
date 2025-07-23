import { verifyToken } from '../../../lib/auth'
import { prisma, ensureConnected } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  // Assurer que la réponse est toujours du JSON
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    // Debug: Log que nous entrons dans l'API
    console.log('🚀 Profile API called');

    // Ensure database connection is established first
    try {
      await ensureConnected();
      console.log('✅ Database connected');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return res.status(500).json({ 
        message: 'Erreur de connexion à la base de données',
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
      });
    }

    // Get token from cookies (essayer les deux noms de cookies)
    const token = req.cookies.token || req.cookies.auth_token;

    if (!token) {
      console.log('❌ No auth token found in cookies');
      return res.status(401).json({ message: 'Non autorisé - Token manquant' });
    }

    console.log('🔍 Token found, verifying...');
    
    // Verify token using the same method as generateToken
    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (tokenError) {
      console.error('❌ Token verification error:', tokenError);
      return res.status(401).json({ message: 'Non autorisé - Token invalide' });
    }
    
    if (!decoded || !decoded.id) {
      console.log('❌ Token verification failed');
      return res.status(401).json({ message: 'Non autorisé - Token invalide' });
    }
    
    console.log('✅ Token verified for user:', decoded.id);

    // Debug: Log the received request body
    console.log('📝 Received request body:', JSON.stringify(req.body, null, 2));

    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      address, 
      currentPassword, 
      newPassword,
      companyName,
      companyFirstName,
      companyLastName,
      vehicleType
    } = req.body || {}; // Ajouter une valeur par défaut

    // Debug: Log the extracted fields
    console.log('🔍 Extracted fields:', {
      firstName: `"${firstName}" (type: ${typeof firstName})`,
      lastName: `"${lastName}" (type: ${typeof lastName})`,
      email: `"${email}" (type: ${typeof email})`,
      vehicleType: `"${vehicleType}" (type: ${typeof vehicleType})`
    });

    // Si seulement vehicleType est fourni (cas du modal véhicule)
    if (vehicleType && !firstName && !lastName && !email) {
      console.log('🚗 Vehicle type only update');
      
      try {
        const updateData = {
          vehicleType: vehicleType.toString().trim()
        };
        
        const updatedUser = await prisma.user.update({
          where: { id: decoded.id },
          data: updateData,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            address: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            vehicleType: true,
            userType: true,
            role: true,
            createdAt: true
          }
        });

        console.log('✅ Vehicle type updated for user:', updatedUser.email);

        return res.status(200).json({
          message: 'Type de véhicule mis à jour avec succès',
          user: updatedUser
        });
      } catch (dbError) {
        console.error('❌ Database error updating vehicle type:', dbError);
        return res.status(500).json({ 
          message: 'Erreur lors de la mise à jour du véhicule',
          error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
        });
      }
    }

    // Validation des données pour mise à jour complète
    if (!firstName || !lastName || !email) {
      console.log('❌ Validation failed:', {
        firstName: !firstName ? 'missing/empty' : 'ok',
        lastName: !lastName ? 'missing/empty' : 'ok',
        email: !email ? 'missing/empty' : 'ok'
      });
      return res.status(400).json({ message: 'Les champs prénom, nom et email sont requis' })
    }

    // Validation plus stricte des chaînes vides
    if (typeof firstName !== 'string' || firstName.trim() === '' ||
        typeof lastName !== 'string' || lastName.trim() === '' ||
        typeof email !== 'string' || email.trim() === '') {
      console.log('❌ String validation failed:', {
        firstName: `"${firstName}" -> "${firstName?.trim()}"`,
        lastName: `"${lastName}" -> "${lastName?.trim()}"`,
        email: `"${email}" -> "${email?.trim()}"`
      });
      return res.status(400).json({ message: 'Les champs prénom, nom et email ne peuvent pas être vides' })
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Format d\'email invalide' })
    }

    // Validation téléphone (optionnel mais doit être valide si fourni)
    if (phoneNumber && !/^(\+33|0)[1-9](\d{8})$/.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Format de téléphone invalide' })
    }

    // Vérifier si l'email existe déjà pour un autre utilisateur
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim() }
      });
      
      if (existingUser && existingUser.id !== decoded.id) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre utilisateur' })
      }
    } catch (dbError) {
      console.error('❌ Database error checking email:', dbError);
      return res.status(500).json({ 
        message: 'Erreur lors de la vérification de l\'email',
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
      });
    }

    // Préparer les données de mise à jour (seulement les champs qui existent dans le schéma)
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      address: address ? address.trim() : null,
      companyName: companyName ? companyName.trim() : null,
      companyFirstName: companyFirstName ? companyFirstName.trim() : null,
      companyLastName: companyLastName ? companyLastName.trim() : null,
      vehicleType: vehicleType ? vehicleType.trim() : null
    }

    console.log('📝 Update data prepared:', JSON.stringify(updateData, null, 2));

    // Gestion du changement de mot de passe
    if (currentPassword && newPassword) {
      try {
        // Récupérer l'utilisateur avec le mot de passe
        const userWithPassword = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { password: true }
        });

        // Vérifier le mot de passe actuel
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: 'Mot de passe actuel incorrect' })
        }

        // Validation du nouveau mot de passe
        if (newPassword.length < 6) {
          return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
        }

        // Hasher le nouveau mot de passe
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        updateData.password = hashedNewPassword;
      } catch (passwordError) {
        console.error('❌ Password handling error:', passwordError);
        return res.status(500).json({ 
          message: 'Erreur lors du traitement du mot de passe',
          error: process.env.NODE_ENV === 'development' ? passwordError.message : 'Password error'
        });
      }
    }

    // Mettre à jour l'utilisateur
    try {
      const updatedUser = await prisma.user.update({
        where: { id: decoded.id },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          address: true,
          companyName: true,
          companyFirstName: true,
          companyLastName: true,
          vehicleType: true,
          userType: true,
          role: true,
          createdAt: true
        }
      });

      console.log('✅ Profile updated for user:', updatedUser.email);

      return res.status(200).json({
        message: 'Profil mis à jour avec succès',
        user: updatedUser
      });
    } catch (dbError) {
      console.error('❌ Database error updating user:', dbError);
      return res.status(500).json({ 
        message: 'Erreur lors de la mise à jour du profil',
        error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale lors de la mise à jour du profil:', error);
    return res.status(500).json({ 
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur interne est survenue'
    });
  }
} 
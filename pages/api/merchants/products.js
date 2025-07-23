import prisma, { ensureConnected } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Ensure database connection before any queries
      await ensureConnected();
      
      const { merchantId } = req.query;

      // Si merchantId est fourni (pour l'admin dashboard), l'utiliser
      if (merchantId) {
        // Vérifier que le marchand existe
        const merchant = await prisma.user.findUnique({
          where: {
            id: merchantId,
            role: 'MERCHANT'
          }
        });

        if (!merchant) {
          return res.status(404).json({ error: 'Marchand non trouvé' });
        }

        // Récupérer les vrais produits de la base de données
        const products = await prisma.product.findMany({
          where: { 
            merchantId: merchantId,
            isActive: true 
          },
          orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(products);
      } else {
        // Sinon, utiliser l'authentification par token (pour le merchant dashboard)
        let token = req.cookies.auth_token;

        // Check Authorization header if no cookie
        if (!token && req.headers.authorization) {
          const authHeader = req.headers.authorization;
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          }
        }
        
        if (!token) {
          return res.status(401).json({ error: 'Non autorisé - Token manquant' });
        }

        const decoded = await verifyToken(token);
        
        if (!decoded || !decoded.id) {
          return res.status(401).json({ error: 'Token invalide' });
        }

        // Vérifier que l'utilisateur est un marchand
        const user = await prisma.user.findUnique({
          where: { id: decoded.id }
        });

        if (!user || user.role !== 'MERCHANT') {
          return res.status(403).json({ error: 'Accès refusé. Seuls les marchands peuvent voir leurs produits.' });
        }

        // Récupérer tous les produits du marchand connecté (actifs et inactifs)
        const products = await prisma.product.findMany({
          where: { 
            merchantId: decoded.id
          },
          orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(products);
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
    }
  } else if (req.method === 'POST') {
    try {
      // Ensure database connection before any queries
      await ensureConnected();
      
      console.log('=== POST /api/merchants/products ===');
      console.log('Request body:', req.body);
      console.log('Request cookies:', req.cookies);

      let token = req.cookies.auth_token;

      // Check Authorization header if no cookie
      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
      console.log('Token found:', !!token);
      
      if (!token) {
        return res.status(401).json({ error: 'Non autorisé - Token manquant' });
      }

      const decoded = await verifyToken(token);
      console.log('Token decoded:', decoded);
      
      if (!decoded || !decoded.id) {
        return res.status(401).json({ error: 'Token invalide' });
      }

      // Vérifier que l'utilisateur est un marchand
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      console.log('User found:', user);

      if (!user || user.role !== 'MERCHANT') {
        return res.status(403).json({ error: 'Accès refusé. Seuls les marchands peuvent créer des produits.' });
      }

      const { name, description, price, category, stock, weight, dimensions, imageUrl, isActive } = req.body;

      console.log('Product data:', { name, description, price, category, stock, weight, dimensions, imageUrl, isActive });

      if (!name || !price || !category) {
        return res.status(400).json({ error: 'Nom, prix et catégorie sont requis' });
      }

      // Créer le produit dans la base de données
      const newProduct = await prisma.product.create({
        data: {
          merchantId: decoded.id,
          name: name.trim(),
          description: description?.trim() || null,
          price: parseFloat(price),
          category: category || 'Autre',
          stock: parseInt(stock) || 0,
          weight: weight ? parseFloat(weight) : null,
          dimensions: dimensions?.trim() || null,
          imageUrl: imageUrl?.trim() || null,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      console.log('Product created successfully:', newProduct);

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        product: newProduct
      });

    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Erreur lors de la création du produit', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 
import prisma, { ensureConnected } from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  const { productId } = req.query;

  if (req.method === 'GET') {
    try {
      // Ensure database connection before any queries
      await ensureConnected();
      
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          merchant: {
            select: {
              firstName: true,
              lastName: true,
              companyName: true
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }

      res.status(200).json(product);

    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const token = req.cookies.auth_token;
      
      if (!token) {
        return res.status(401).json({ error: 'Non autorisé' });
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
        return res.status(403).json({ error: 'Accès refusé. Seuls les marchands peuvent supprimer des produits.' });
      }

      // Vérifier que le produit existe et appartient au marchand
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }

      if (product.merchantId !== decoded.id) {
        return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres produits' });
      }

      // Supprimer le produit
      await prisma.product.delete({
        where: { id: productId }
      });

      res.status(200).json({
        success: true,
        message: 'Produit supprimé avec succès'
      });

    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
    }
  } else if (req.method === 'PUT') {
    try {
      const token = req.cookies.auth_token;
      
      if (!token) {
        return res.status(401).json({ error: 'Non autorisé' });
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
        return res.status(403).json({ error: 'Accès refusé. Seuls les marchands peuvent modifier des produits.' });
      }

      // Vérifier que le produit existe et appartient au marchand
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }

      if (product.merchantId !== decoded.id) {
        return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres produits' });
      }

      const { name, description, price, category, stock, weight, dimensions, imageUrl, isActive } = req.body;

      // Mettre à jour le produit
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          name: name?.trim() || product.name,
          description: description?.trim() || product.description,
          price: price ? parseFloat(price) : product.price,
          category: category || product.category,
          stock: stock !== undefined ? parseInt(stock) : product.stock,
          weight: weight !== undefined ? (weight ? parseFloat(weight) : null) : product.weight,
          dimensions: dimensions?.trim() || product.dimensions,
          imageUrl: imageUrl?.trim() || product.imageUrl,
          isActive: isActive !== undefined ? isActive : product.isActive
        }
      });

      res.status(200).json({
        success: true,
        message: 'Produit mis à jour avec succès',
        product: updatedProduct
      });

    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du produit' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 
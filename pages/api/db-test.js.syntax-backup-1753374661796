import { prisma } from '../../src/lib/prisma';

export default async function handler(req, res) {
  try {
    // Afficher les informations de l'URL de la base de données (masquant les informations sensibles)
    const dbUrl = process.env.DATABASE_URL || 'Non définie';
    const maskedDbUrl = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://*****:*****@')
                             .replace(/api_key=([^&]+)/, 'api_key=*****');
    console.log('URL de base de données:', maskedDbUrl);
    
    // Vérifier la connexion en exécutant une requête simple
    console.log('Tentative de connexion à la base de données...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('Test de connexion à la base de données réussi:', result);
    
    // Vérifier si les tables existent et récupérer la liste des tables
    try {
      // Pour PostgreSQL, nous utilisons information_schema pour lister les tables
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      console.log('Tables dans la base de données:', tables);
      
      // Essayer de compter les utilisateurs si la table existe
      try {
        const userCount = await prisma.user.count();
        console.log(`Nombre d'utilisateurs dans la base de données: ${userCount}`);
        
        return res.status(200).json({
          success: true,
          message: 'Connexion à la base de données réussie',
          tables: tables.map(t => t.table_name),
          userCount
        });
      } catch (countError) {
        console.error('Erreur lors du comptage des utilisateurs:', countError);
        return res.status(200).json({
          success: true,
          message: 'Connexion à la base de données réussie, mais erreur lors du comptage des utilisateurs',
          tables: tables.map(t => t.table_name),
          error: countError.message
        });
      }
    } catch (tableError) {
      console.error('Erreur lors de la récupération des tables:', tableError);
      return res.status(200).json({
        success: true,
        message: 'Connexion à la base de données réussie, mais erreur lors de la récupération des tables',
        error: tableError.message
      });
    }
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    return res.status(500).json({
      success: false,
      message: 'Échec de la connexion à la base de données',
      error: error.message
    });
  }
} 
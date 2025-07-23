-- Script d'initialisation de la base de données pour EcoFront
-- Ce script est exécuté automatiquement lors de la création du conteneur PostgreSQL

-- Note: La base de données eco_database est déjà créée par les variables d'environnement
-- du conteneur PostgreSQL (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD)

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- L'utilisateur eco_user est déjà créé par les variables d'environnement
-- Accorder tous les privilèges à l'utilisateur (par sécurité)
GRANT ALL PRIVILEGES ON DATABASE eco_database TO eco_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO eco_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO eco_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO eco_user;

-- Définir les privilèges par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO eco_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO eco_user;

-- Afficher un message de confirmation
\echo 'Base de données eco_database initialisée avec succès'; 
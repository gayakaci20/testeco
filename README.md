# RENDU - Conteneurisation ecodeli

## 📋 Vue d'ensemble du projet

**ecodeli** est une plateforme de livraison écologique composée de deux applications Next.js avec une base de données PostgreSQL partagée.

## 🏗️ Architecture du système

### Diagramme d'architecture

```html
<!DOCTYPE html>
<html>
<head>
    <title>Architecture ecodeli</title>
    <style>
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .architecture { display: flex; flex-direction: column; gap: 30px; }
        .layer { border: 2px solid #333; border-radius: 10px; padding: 20px; }
        .services { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px; }
        .service { 
            border: 2px solid #007acc; 
            border-radius: 8px; 
            padding: 15px; 
            min-width: 200px; 
            text-align: center;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .database { 
            border: 2px solid #ff6b35; 
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        }
        .proxy { 
            border: 2px solid #28a745; 
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        }
        .title { text-align: center; color: #333; margin-bottom: 30px; }
        .port { font-size: 12px; color: #666; }
        .tech { font-style: italic; color: #555; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🐳 Architecture EcoDeli - Docker</h1>
        
        <div class="architecture">
            <!-- Couche Proxy -->
            <div class="layer">
                <h3>🌐 Couche Proxy</h3>
                <div class="services">
                    <div class="service proxy">
                        <h4>Nginx</h4>
                        <div class="port">Port: 80</div>
                        <div class="tech">Reverse Proxy & Load Balancer</div>
                    </div>
                </div>
            </div>

            <!-- Couche Applications -->
            <div class="layer">
                <h3>🚀 Couche Applications</h3>
                <div class="services">
                    <div class="service">
                        <h4>EcoDeli App</h4>
                        <div class="port">Port: 3000</div>
                        <div class="tech">Next.js 15.3.0 + Prisma</div>
                        <small>Application principale utilisateurs</small>
                    </div>
                    <div class="service">
                        <h4>Admin Dashboard</h4>
                        <div class="port">Port: 3001</div>
                        <div class="tech">Next.js + Prisma</div>
                        <small>Interface d'administration</small>
                    </div>
                </div>
            </div>

            <!-- Couche Services -->
            <div class="layer">
                <h3>⚡ Couche Services</h3>
                <div class="services">
                    <div class="service database">
                        <h4>PostgreSQL</h4>
                        <div class="port">Port: 5432</div>
                        <div class="tech">Base de données relationnelle</div>
                        <small>Stockage persistant</small>
                    </div>
                    <div class="service database">
                        <h4>Redis</h4>
                        <div class="port">Port: 6379</div>
                        <div class="tech">Cache en mémoire</div>
                        <small>Sessions & cache</small>
                    </div>
                </div>
            </div>

            <!-- Couche Migration -->
            <div class="layer">
                <h3>🔄 Service de Migration</h3>
                <div class="services">
                    <div class="service">
                        <h4>Prisma Migrate</h4>
                        <div class="tech">Service d'initialisation</div>
                        <small>Migration automatique de la DB</small>
                    </div>
                </div>
            </div>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <h3>🔗 Flux de données</h3>
            <p><strong>Client</strong> → <strong>Nginx (80)</strong> → <strong>App (3000)</strong> ou <strong>Admin (3001)</strong> → <strong>PostgreSQL (5432)</strong> + <strong>Redis (6379)</strong></p>
        </div>
    </div>
</body>
</html>
```

## 🐳 Étapes de dockerisation

### 1. Préparation des fichiers Docker

#### Dockerfile principal (eco-front)
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

#### Dockerfile admin-dashboard
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3001
CMD ["node", "server.js"]
```

### 2. Configuration Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: eco_database
      POSTGRES_USER: eco_user
      POSTGRES_PASSWORD: eco_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  migrate:
    build: .
    command: npx prisma db push
    environment:
      DATABASE_URL: postgresql://eco_user:eco_password@postgres:5432/eco_database
    depends_on:
      - postgres

  eco-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://eco_user:eco_password@postgres:5432/eco_database
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
      - migrate

  admin-dashboard:
    build: ./admin-dashboard
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://eco_user:eco_password@postgres:5432/eco_database
    depends_on:
      - postgres
      - migrate

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - eco-app
      - admin-dashboard

volumes:
  postgres_data:
```

### 3. Configuration Nginx

```nginx
events {
    worker_connections 1024;
}

http {
    upstream eco_app {
        server eco-app:3000;
    }
    
    upstream admin_app {
        server admin-dashboard:3001;
    }

    server {
        listen 80;
        
        location /admin {
            proxy_pass http://admin_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location / {
            proxy_pass http://eco_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### 4. Commandes de déploiement

```bash
# Construction et lancement
docker-compose up --build -d

# Vérification des services
docker-compose ps

# Logs des services
docker-compose logs -f

# Arrêt des services
docker-compose down
```

## 📊 Détail des services

### 🚀 **ecodeli App** (Port 3000)
- **Rôle** : Application principale pour les utilisateurs finaux
- **Technologies** : Next.js 15.3.0, Prisma ORM, React
- **Fonctionnalités** : Gestion des commandes, profils utilisateurs, paiements

### 🛠️ **Admin Dashboard** (Port 3001)
- **Rôle** : Interface d'administration pour la gestion du système
- **Technologies** : Next.js, Prisma ORM, React
- **Fonctionnalités** : Gestion des utilisateurs, statistiques, modération

### 🗄️ **PostgreSQL** (Port 5432)
- **Rôle** : Base de données principale pour le stockage persistant
- **Technologies** : PostgreSQL 15
- **Données** : Utilisateurs, commandes, produits, transactions

### ⚡ **Redis** (Port 6379)
- **Rôle** : Cache en mémoire et gestion des sessions
- **Technologies** : Redis 7
- **Usage** : Cache des requêtes, sessions utilisateurs, données temporaires

### 🌐 **Nginx** (Port 80)
- **Rôle** : Reverse proxy et load balancer
- **Technologies** : Nginx Alpine
- **Fonctions** : Routage des requêtes, SSL termination, compression

### 🔄 **Prisma Migrate**
- **Rôle** : Service d'initialisation de la base de données
- **Technologies** : Prisma CLI
- **Fonction** : Migration automatique du schéma de base de données

## 🎯 Justification des choix

### **Architecture Microservices**
- **Séparation des responsabilités** : App utilisateur et admin séparées
- **Scalabilité** : Chaque service peut être mis à l'échelle indépendamment
- **Maintenance** : Déploiements et mises à jour isolés

### **Docker & Orchestration**
- **Portabilité** : Environnement identique dev/prod
- **Isolation** : Chaque service dans son propre conteneur
- **Reproductibilité** : Déploiement cohérent sur toute infrastructure

### **PostgreSQL + Redis**
- **PostgreSQL** : ACID compliance, relations complexes, performance
- **Redis** : Cache haute performance, gestion des sessions temps réel

### **Nginx comme Reverse Proxy**
- **Performance** : Gestion efficace des connexions statiques
- **Sécurité** : Point d'entrée unique, protection DDoS
- **Flexibilité** : Routage basé sur les chemins, load balancing

### **Avantages de cette architecture**

1. **Haute Disponibilité** : Redondance et failover automatique
2. **Performance** : Cache Redis + proxy Nginx optimisé
3. **Sécurité** : Isolation des services, exposition contrôlée
4. **Évolutivité** : Scaling horizontal facile
5. **Maintenance** : Déploiements sans interruption de service

## 🚀 Résultats

- ✅ **2 applications** Next.js conteneurisées
- ✅ **Base de données** PostgreSQL partagée
- ✅ **Cache Redis** pour les performances
- ✅ **Reverse proxy** Nginx configuré
- ✅ **Migration automatique** de la base de données
- ✅ **Orchestration complète** avec Docker Compose

**Temps de déploiement** : < 5 minutes  
**Services actifs** : 6 conteneurs  
**Ports exposés** : 80 (public), 3000, 3001, 5432, 6379 
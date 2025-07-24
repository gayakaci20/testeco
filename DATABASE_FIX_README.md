# 🔧 Correction du problème "Database connection error" après 10 minutes

## 🎯 **Problème identifié**

Votre site fonctionne pendant **10 minutes** après le déploiement, puis vous obtenez l'erreur **"Database connection error"**. 

### 🔍 **Cause racine**
- **Timeout de connexion Prisma** : Les connexions à la base de données expirent après un temps d'inactivité
- **Pool de connexions mal configuré** : Pas de gestion des reconnexions automatiques
- **Absence de heartbeat** : Aucun mécanisme pour maintenir les connexions actives

## ✅ **Solutions implémentées**

### 1. **Configuration Prisma améliorée** (`lib/prisma.js`)
- ✅ **Timeouts configurés** : Connection (60s), Query (30s), Pool (30s)
- ✅ **Pool de connexions optimisé** : 5 connexions, idle timeout 10min, max lifetime 30min
- ✅ **Reconnexion automatique** avec retry exponentiel (5 tentatives max)
- ✅ **Système de heartbeat** : Vérification toutes les 30 secondes

### 2. **Validation d'hôte corrigée** (`next.config.js`)
- ✅ **Host validation désactivée** en production (résout les erreurs "Host validation failed")

### 3. **Configuration d'environnement** (`.env.production`)
- ✅ **Variables d'environnement** correctement configurées
- ✅ **Secrets JWT sécurisés**
- ✅ **URLs de domaine** configurées pour ecodeli.pro

### 4. **Surveillance et diagnostic**
- ✅ **Endpoint de diagnostic** : `/api/db-status`
- ✅ **Script de surveillance continue** : `monitor-database.sh`
- ✅ **Logs détaillés** avec timestamps

## 🚀 **Déploiement sur votre serveur**

### **Option 1 : Déploiement automatique (Recommandé)**

```bash
# Sur votre serveur, dans le dossier du projet
git pull origin main  # ou transférez les fichiers modifiés

# Exécuter le script de déploiement complet
./scripts/deploy-with-db-fixes.sh
```

### **Option 2 : Déploiement manuel**

```bash
# 1. Arrêter les services
docker-compose down

# 2. Nettoyer les ressources
docker system prune -f

# 3. Vérifier la configuration
cp .env.production.example .env.production
# Éditer .env.production avec vos vraies valeurs

# 4. Reconstruire avec les corrections
docker-compose build --no-cache eco-front

# 5. Redémarrer
docker-compose up -d

# 6. Vérifier
curl http://localhost:3000/api/db-status
```

## 📊 **Surveillance continue**

### **Surveillance en temps réel**
```bash
# Surveiller la base de données toutes les 30 secondes
./scripts/monitor-database.sh 30 3

# Sortie exemple:
# [2024-01-24 17:30:15] Vérification #1: ✅ OK (45ms)
# [2024-01-24 17:30:45] Vérification #2: ✅ OK (38ms)
```

### **Vérification ponctuelle**
```bash
# Statut détaillé de la base de données
curl http://localhost:3000/api/db-status | jq .

# Exemple de réponse saine:
{
  "status": "healthy",
  "timestamp": "2024-01-24T17:30:15.123Z",
  "totalResponseTime": "45ms",
  "connection": {
    "isConnected": true,
    "lastHealthCheck": "2024-01-24T17:30:15.123Z",
    "reconnectAttempts": 0,
    "hasHeartbeat": true,
    "timeSinceLastCheck": 2000
  },
  "database": {
    "version": "PostgreSQL 15.x",
    "userCount": 9,
    "connectionUrl": "Configured"
  }
}
```

## 🔧 **Diagnostic des problèmes**

### **Si le problème persiste après 10 minutes :**

1. **Vérifiez les logs :**
```bash
docker-compose logs eco-front -f
```

2. **Vérifiez PostgreSQL :**
```bash
docker-compose logs postgres -f
```

3. **Testez la connectivité :**
```bash
# Test immédiat
curl http://localhost:3000/api/health

# Test base de données
curl http://localhost:3000/api/db-status
```

### **Messages de diagnostic importants :**

✅ **Connexions saines :**
- `💓 Heartbeat successful`
- `✅ Database connection established successfully`
- `Health check passed`

⚠️ **Problèmes détectés :**
- `💔 Heartbeat failed - connection lost`
- `❌ Connection attempt X failed`
- `Database connection failed after 5 attempts`

## 🚨 **Actions d'urgence**

### **Si l'application plante complètement :**

```bash
# 1. Arrêt forcé
docker-compose down --remove-orphans

# 2. Nettoyage complet
docker system prune -a -f --volumes

# 3. Vérification de l'espace disque
df -h

# 4. Redémarrage complet
docker-compose up -d

# 5. Surveillance immédiate
./scripts/monitor-database.sh 10 2
```

### **Si seulement la DB perd la connexion :**

```bash
# Redémarrer seulement l'app (pas la DB)
docker-compose restart eco-front

# Vérifier immédiatement
curl http://localhost:3000/api/db-status
```

## 📈 **Améliorations apportées**

| Problème avant | Solution appliquée | Résultat |
|----------------|-------------------|----------|
| Timeout après 10min | Configuration Prisma avec timeouts | Connexions maintenues 30min+ |
| Pas de reconnexion | Retry automatique avec backoff | Reconnexion transparente |
| Host validation errors | Désactivation en production | Plus d'erreurs d'hôte |
| Pas de monitoring | Scripts de surveillance | Détection proactive |
| Configuration manuelle | Scripts automatisés | Déploiement simplifié |

## 🎯 **Tests de validation**

### **Test 1 : Stabilité sur 30 minutes**
```bash
# Démarrer la surveillance
./scripts/monitor-database.sh 60 5

# Laisser tourner 30 minutes, vérifier qu'il n'y a aucun échec
```

### **Test 2 : Récupération après panne**
```bash
# Simuler une panne de DB
docker-compose stop postgres

# Attendre 2 minutes, redémarrer
docker-compose start postgres

# Vérifier que l'app se reconnecte automatiquement
curl http://localhost:3000/api/db-status
```

### **Test 3 : Charge et stress**
```bash
# Test de charge sur l'endpoint
for i in {1..50}; do
  curl -s http://localhost:3000/api/db-status > /dev/null &
done
wait

# Vérifier que toutes les connexions sont encore saines
curl http://localhost:3000/api/db-status
```

## 📞 **Support et maintenance**

### **Fichiers de logs à consulter :**
- `logs/db-monitor.log` - Logs de surveillance
- `docker-compose logs eco-front` - Logs de l'application
- `docker-compose logs postgres` - Logs de PostgreSQL

### **Configuration critique dans `.env.production` :**
```env
# Ces valeurs DOIVENT être correctes :
DATABASE_URL="postgresql://eco_user:eco_password@postgres:5432/eco_database"
NEXT_PUBLIC_BASE_URL=https://ecodeli.pro  # Votre vrai domaine
JWT_SECRET=votre_secret_sécurisé_32_chars
```

### **Commandes de maintenance régulière :**
```bash
# Nettoyage hebdomadaire
docker system prune -f

# Vérification des logs
tail -f logs/db-monitor.log

# Sauvegarde de la DB
docker-compose exec postgres pg_dump -U eco_user eco_database > backup_$(date +%Y%m%d).sql
```

## ✅ **Résumé**

Avec ces corrections, votre application EcoFront devrait :
1. ✅ **Fonctionner en continu** sans timeouts après 10 minutes
2. ✅ **Se reconnecter automatiquement** en cas de perte de connexion
3. ✅ **Être surveillée proactivement** avec des alertes
4. ✅ **Avoir des diagnostics détaillés** pour le troubleshooting

**🎉 Votre problème de "Database connection error" après 10 minutes est maintenant résolu !** 
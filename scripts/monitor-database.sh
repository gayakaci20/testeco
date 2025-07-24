#!/bin/bash

# Script de surveillance continue de la base de données EcoFront
echo "📊 Surveillance de la base de données EcoFront"
echo "=============================================="

# Configuration
INTERVAL=${1:-30}  # Intervalle en secondes (défaut: 30s)
LOG_FILE="logs/db-monitor.log"
MAX_FAILURES=${2:-3}  # Nombre d'échecs avant alerte (défaut: 3)

# Créer le dossier de logs s'il n'existe pas
mkdir -p logs

# Compteurs
failure_count=0
total_checks=0
success_count=0

echo "🔍 Surveillance démarrée - Intervalle: ${INTERVAL}s - Seuil d'alerte: ${MAX_FAILURES} échecs"
echo "📝 Logs sauvegardés dans: $LOG_FILE"
echo "⏹️  Appuyez sur Ctrl+C pour arrêter"
echo ""

# Fonction de vérification
check_database() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    total_checks=$((total_checks + 1))
    
    echo -n "[$timestamp] Vérification #$total_checks: "
    
    # Test de l'endpoint de santé
    local response=$(curl -s -w "%{http_code}" http://localhost:3000/api/db-status -o /tmp/db-status.json)
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        # Vérifier le statut dans la réponse JSON
        local status=$(cat /tmp/db-status.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        local response_time=$(cat /tmp/db-status.json | grep -o '"totalResponseTime":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$status" = "healthy" ]; then
            echo "✅ OK ($response_time)"
            echo "[$timestamp] DB_STATUS=OK RESPONSE_TIME=$response_time" >> "$LOG_FILE"
            failure_count=0
            success_count=$((success_count + 1))
        else
            echo "⚠️  UNHEALTHY"
            echo "[$timestamp] DB_STATUS=UNHEALTHY" >> "$LOG_FILE"
            failure_count=$((failure_count + 1))
        fi
    else
        echo "❌ ERREUR HTTP $http_code"
        echo "[$timestamp] DB_STATUS=ERROR HTTP_CODE=$http_code" >> "$LOG_FILE"
        failure_count=$((failure_count + 1))
    fi
    
    # Vérifier si on a atteint le seuil d'alerte
    if [ $failure_count -ge $MAX_FAILURES ]; then
        echo ""
        echo "🚨 ALERTE: $failure_count échecs consécutifs détectés!"
        echo "🔧 Actions recommandées:"
        echo "   1. Vérifier les logs: docker-compose logs eco-front"
        echo "   2. Redémarrer l'application: docker-compose restart eco-front"
        echo "   3. Vérifier PostgreSQL: docker-compose logs postgres"
        echo ""
        
        # Log de l'alerte
        echo "[$timestamp] ALERT: $failure_count consecutive failures" >> "$LOG_FILE"
        
        # Optionnel: envoyer une notification (à adapter selon vos besoins)
        # send_alert_notification
    fi
    
    # Nettoyer le fichier temporaire
    rm -f /tmp/db-status.json
}

# Fonction d'alerte (à personnaliser)
send_alert_notification() {
    echo "📧 Envoi d'alerte (fonctionnalité à implémenter)"
    # Exemple: envoyer un email, Slack, Discord, etc.
    # curl -X POST "https://hooks.slack.com/..." -d "text=DB Alert: $failure_count failures"
}

# Fonction de nettoyage à l'arrêt
cleanup() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo ""
    echo "📊 Statistiques de surveillance:"
    echo "   Total vérifications: $total_checks"
    echo "   Succès: $success_count"
    echo "   Échecs: $((total_checks - success_count))"
    echo "   Taux de succès: $(( success_count * 100 / total_checks ))%"
    echo ""
    echo "[$timestamp] MONITORING_STOPPED TOTAL=$total_checks SUCCESS=$success_count" >> "$LOG_FILE"
    echo "🔚 Surveillance arrêtée"
    exit 0
}

# Gérer l'interruption (Ctrl+C)
trap cleanup SIGINT SIGTERM

# Vérification initiale
echo "🏁 Vérification initiale..."
check_database

# Boucle de surveillance
while true; do
    sleep $INTERVAL
    check_database
done 
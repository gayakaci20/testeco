import fs from 'fs';
import path from 'path';
import { createApiLogger } from './logger';

// Configuration du nettoyage automatique
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 heure en millisecondes
const CLEANUP_STORAGE_KEY = 'logs_last_cleanup';

// Classe pour gérer le nettoyage automatique
export class AutoCleanupService {
  private static instance: AutoCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastCleanupTime: number = 0;
  private logger: any;

  private constructor() {
    try {
      this.logger = createApiLogger('AUTO_CLEANUP');
    } catch (error) {
      console.error('Erreur lors de la création du logger AutoCleanup:', error);
    }
    
    // Charger la dernière fois que le nettoyage a été effectué
    this.loadLastCleanupTime();
  }

  public static getInstance(): AutoCleanupService {
    if (!AutoCleanupService.instance) {
      AutoCleanupService.instance = new AutoCleanupService();
    }
    return AutoCleanupService.instance;
  }

  private loadLastCleanupTime(): void {
    try {
      const storageFile = path.join(process.cwd(), '.logs-cleanup-time');
      if (fs.existsSync(storageFile)) {
        const timeString = fs.readFileSync(storageFile, 'utf8');
        this.lastCleanupTime = parseInt(timeString) || 0;
      }
    } catch (error) {
      console.error('Erreur lors du chargement du temps de nettoyage:', error);
    }
  }

  private saveLastCleanupTime(): void {
    try {
      const storageFile = path.join(process.cwd(), '.logs-cleanup-time');
      fs.writeFileSync(storageFile, this.lastCleanupTime.toString());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du temps de nettoyage:', error);
    }
  }

  public deleteAllLogs(): { success: boolean; message: string; deletedCount: number } {
    const LOG_DIR = path.join(process.cwd(), 'logs');
    
    try {
      if (!fs.existsSync(LOG_DIR)) {
        const result = { success: true, message: 'Aucun répertoire de logs trouvé', deletedCount: 0 };
        if (this.logger) this.logger.info('Aucun répertoire de logs trouvé');
        return result;
      }
      
      const files = fs.readdirSync(LOG_DIR);
      let deletedCount = 0;
      
      files.forEach(file => {
        const filePath = path.join(LOG_DIR, file);
        try {
          if (fs.statSync(filePath).isFile() && file.endsWith('.log')) {
            fs.unlinkSync(filePath);
            deletedCount++;
            if (this.logger) this.logger.info(`Fichier de log supprimé: ${file}`);
          }
        } catch (error: any) {
          console.error(`Erreur lors de la suppression du fichier ${file}:`, error);
          if (this.logger) this.logger.error(`Erreur lors de la suppression du fichier ${file}`, { error: error.message });
        }
      });
      
      const result = { 
        success: true, 
        message: `${deletedCount} fichier(s) de logs supprimé(s)`,
        deletedCount 
      };
      
      if (this.logger) this.logger.info(`Suppression terminée: ${deletedCount} fichiers`);
      return result;
    } catch (error: any) {
      console.error('Erreur lors de la suppression des logs:', error);
      const result = { 
        success: false, 
        message: `Erreur: ${error.message}`,
        deletedCount: 0 
      };
      if (this.logger) this.logger.error('Erreur lors de la suppression des logs', { error: error.message });
      return result;
    }
  }

  public shouldCleanup(): boolean {
    const now = Date.now();
    const timeSinceLastCleanup = now - this.lastCleanupTime;
    return timeSinceLastCleanup >= CLEANUP_INTERVAL;
  }

  public performCleanup(): { success: boolean; message: string; deletedCount: number } {
    if (!this.shouldCleanup()) {
      return {
        success: true,
        message: 'Nettoyage pas encore nécessaire',
        deletedCount: 0
      };
    }

    console.log('🧹 Nettoyage automatique des logs déclenché');
    if (this.logger) this.logger.info('Nettoyage automatique des logs déclenché');

    try {
      const result = this.deleteAllLogs();
      this.lastCleanupTime = Date.now();
      this.saveLastCleanupTime();
      
      console.log(`✅ Nettoyage automatique terminé: ${result.deletedCount} fichiers supprimés`);
      if (this.logger) this.logger.info(`Nettoyage automatique terminé: ${result.deletedCount} fichiers supprimés`);
      
      return result;
    } catch (error: any) {
      console.error('❌ Erreur lors du nettoyage automatique:', error);
      if (this.logger) this.logger.error('Erreur lors du nettoyage automatique', { error: error.message });
      
      return {
        success: false,
        message: `Erreur lors du nettoyage: ${error.message}`,
        deletedCount: 0
      };
    }
  }

  public startAutoCleanup(): void {
    if (this.cleanupInterval) {
      return; // Déjà démarré
    }

    // Vérifier immédiatement si un nettoyage est nécessaire
    this.performCleanup();

    // Programmer le nettoyage toutes les heures
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, CLEANUP_INTERVAL);

    console.log('🔄 Service de nettoyage automatique démarré');
    if (this.logger) this.logger.info('Service de nettoyage automatique démarré');
  }

  public stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('⏹️ Service de nettoyage automatique arrêté');
      if (this.logger) this.logger.info('Service de nettoyage automatique arrêté');
    }
  }

  public getNextCleanupTime(): Date {
    const nextCleanupTime = this.lastCleanupTime + CLEANUP_INTERVAL;
    return new Date(nextCleanupTime);
  }

  public getTimeUntilNextCleanup(): number {
    const nextCleanupTime = this.lastCleanupTime + CLEANUP_INTERVAL;
    return Math.max(0, nextCleanupTime - Date.now());
  }
}

// Instance globale du service
export const autoCleanupService = AutoCleanupService.getInstance();

// Démarrer automatiquement le service
autoCleanupService.startAutoCleanup(); 
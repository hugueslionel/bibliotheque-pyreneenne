const fs = require('fs');
const path = require('path');

class FileOperations {
  
  // Valider le format des données JSON
  static validateLibraryData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Les données doivent être un tableau');
    }
    
    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      if (typeof entry !== 'object' || entry === null) {
        throw new Error(`Entrée ${i + 1}: Doit être un objet`);
      }
      
      // Vérifier les propriétés requises
      const requiredFields = ['id', 'author', 'title', 'description', 'comments'];
      for (const field of requiredFields) {
        if (!(field in entry)) {
          throw new Error(`Entrée ${i + 1}: Propriété manquante '${field}'`);
        }
      }
      
      // Vérifier les types
      if (typeof entry.id !== 'number') {
        throw new Error(`Entrée ${i + 1}: 'id' doit être un nombre`);
      }
      
      if (typeof entry.author !== 'string') {
        throw new Error(`Entrée ${i + 1}: 'author' doit être une chaîne`);
      }
      
      if (typeof entry.title !== 'string') {
        throw new Error(`Entrée ${i + 1}: 'title' doit être une chaîne`);
      }
      
      if (typeof entry.description !== 'string') {
        throw new Error(`Entrée ${i + 1}: 'description' doit être une chaîne`);
      }
      
      if (typeof entry.comments !== 'string') {
        throw new Error(`Entrée ${i + 1}: 'comments' doit être une chaîne`);
      }
      
      // 'image' est optionnel mais doit être une chaîne si présent
      if ('image' in entry && typeof entry.image !== 'string') {
        throw new Error(`Entrée ${i + 1}: 'image' doit être une chaîne`);
      }
    }
    
    return true;
  }
  
  // Nettoyer et optimiser les données avant sauvegarde
  static cleanupData(data) {
    return data.map(entry => ({
      id: entry.id,
      author: (entry.author || '').trim(),
      title: (entry.title || '').trim(),  
      description: (entry.description || '').trim(),
      comments: (entry.comments || '').trim(),
      image: entry.image || ''
    }));
  }
  
  // Créer une sauvegarde locale avant import/export
  static createBackup(data, backupDir = 'backups') {
    try {
      // Créer le dossier de sauvegarde s'il n'existe pas
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `bibliotheque-backup-${timestamp}.json`;
      const backupPath = path.join(backupDir, backupFileName);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        totalEntries: data.length,
        data: this.cleanupData(data)
      };
      
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
      
      return {
        success: true,
        path: backupPath,
        message: `Sauvegarde créée: ${backupFileName}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de la création de la sauvegarde: ${error.message}`
      };
    }
  }
  
  // Lister les sauvegardes disponibles
  static listBackups(backupDir = 'backups') {
    try {
      if (!fs.existsSync(backupDir)) {
        return [];
      }
      
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('bibliotheque-backup-') && file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.ctime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created); // Tri par date de création décroissante
      
      return files;
    } catch (error) {
      console.error('Erreur lors de la liste des sauvegardes:', error.message);
      return [];
    }
  }
  
  // Restaurer depuis une sauvegarde
  static restoreFromBackup(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Fichier de sauvegarde introuvable');
      }
      
      const backupContent = fs.readFileSync(backupPath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      // Vérifier le format de la sauvegarde
      if (backupData.data && Array.isArray(backupData.data)) {
        // Nouveau format avec métadonnées
        this.validateLibraryData(backupData.data);
        return {
          success: true,
          data: backupData.data,
          metadata: {
            timestamp: backupData.timestamp,
            totalEntries: backupData.totalEntries
          }
        };
      } else if (Array.isArray(backupData)) {
        // Ancien format direct
        this.validateLibraryData(backupData);
        return {
          success: true,
          data: backupData,
          metadata: null
        };
      } else {
        throw new Error('Format de sauvegarde non reconnu');
      }
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de la restauration: ${error.message}`
      };
    }
  }
  
  // Calculer des statistiques sur les données
  static calculateStats(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        totalEntries: 0,
        withImages: 0,
        withoutImages: 0,
        averageFieldLength: 0,
        authors: [],
        uniqueAuthors: 0
      };
    }
    
    const authors = data
      .map(entry => entry.author?.trim())
      .filter(author => author && author.length > 0);
    
    const uniqueAuthors = [...new Set(authors)];
    
    const entriesWithImages = data.filter(entry => entry.image && entry.image.length > 0).length;
    
    const totalFieldLength = data.reduce((sum, entry) => {
      return sum + 
        (entry.author?.length || 0) + 
        (entry.title?.length || 0) + 
        (entry.description?.length || 0) + 
        (entry.comments?.length || 0);
    }, 0);
    
    return {
      totalEntries: data.length,
      withImages: entriesWithImages,
      withoutImages: data.length - entriesWithImages,
      averageFieldLength: Math.round(totalFieldLength / data.length),
      authors: uniqueAuthors,
      uniqueAuthors: uniqueAuthors.length,
      mostCommonAuthor: this.getMostCommonAuthor(authors)
    };
  }
  
  // Trouver l'auteur le plus fréquent
  static getMostCommonAuthor(authors) {
    if (authors.length === 0) return null;
    
    const frequency = {};
    authors.forEach(author => {
      frequency[author] = (frequency[author] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)[0];
  }
  
  // Vérifier l'intégrité des données
  static checkDataIntegrity(data) {
    const issues = [];
    
    if (!Array.isArray(data)) {
      issues.push('Les données ne sont pas un tableau valide');
      return issues;
    }
    
    // Vérifier les IDs uniques
    const ids = data.map(entry => entry.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      issues.push('Des entrées ont des IDs dupliqués');
    }
    
    // Vérifier les champs vides
    data.forEach((entry, index) => {
      if (!entry.author?.trim() && !entry.title?.trim()) {
        issues.push(`Entrée ${index + 1}: Auteur et titre vides`);
      }
    });
    
    // Vérifier les images corrompues
    data.forEach((entry, index) => {
      if (entry.image && entry.image.startsWith('data:image/')) {
        try {
          // Vérifier si l'image base64 est valide
          const base64Data = entry.image.split(',')[1];
          if (!base64Data || base64Data.length === 0) {
            issues.push(`Entrée ${index + 1}: Image corrompue ou vide`);
          }
        } catch (error) {
          issues.push(`Entrée ${index + 1}: Format d'image invalide`);
        }
      }
    });
    
    return issues;
  }
}

module.exports = FileOperations;

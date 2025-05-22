const { Octokit } = require('octokit');

class GitHubIntegration {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
    // IMPORTANT: Remplacez 'VOTRE_NOM_UTILISATEUR_GITHUB' par votre nom d'utilisateur GitHub réel
    this.owner = 'hugueslionel'; 
    this.repo = 'bibliotheque-pyreneenne-data'; // Nom du dépôt pour stocker les données
    this.path = 'bibliotheque-data.json';
  }

  // Créer le dépôt s'il n'existe pas
  async createRepoIfNotExists() {
    try {
      await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      return true;
    } catch (error) {
      if (error.status === 404) {
        // Le dépôt n'existe pas, créons-le
        try {
          await this.octokit.rest.repos.createForAuthenticatedUser({
            name: this.repo,
            description: 'Données de sauvegarde pour l\'application Bibliothèque Pyrénéenne',
            private: true, // Dépôt privé pour vos données personnelles
            auto_init: true // Initialiser avec un README
          });
          console.log(`Dépôt ${this.repo} créé avec succès`);
          return true;
        } catch (createError) {
          throw new Error(`Impossible de créer le dépôt: ${createError.message}`);
        }
      }
      throw new Error(`Erreur d'accès au dépôt: ${error.message}`);
    }
  }

  // Récupérer le fichier existant s'il existe
  async getExistingFile() {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: this.path,
      });
      
      if (Array.isArray(response.data)) {
        throw new Error('Le chemin spécifié pointe vers un dossier, pas un fichier');
      }
      
      return {
        sha: response.data.sha,
        content: JSON.parse(Buffer.from(response.data.content, 'base64').toString())
      };
    } catch (error) {
      if (error.status === 404) {
        return null; // Le fichier n'existe pas encore
      }
      throw new Error(`Erreur lors de la récupération du fichier: ${error.message}`);
    }
  }

  // Sauvegarder les données dans le dépôt GitHub
  async saveDataToRepo(data) {
    try {
      // Vérifier/créer le dépôt
      await this.createRepoIfNotExists();
      
      // Récupérer le fichier existant
      const existingFile = await this.getExistingFile();
      
      // Préparer les données avec métadonnées
      const dataWithMetadata = {
        lastUpdate: new Date().toISOString(),
        version: '1.0',
        totalEntries: data.length,
        data: data
      };
      
      const content = Buffer.from(JSON.stringify(dataWithMetadata, null, 2)).toString('base64');
      
      const commitMessage = existingFile 
        ? `Mise à jour des données - ${data.length} entrée(s) - ${new Date().toLocaleString('fr-FR')}`
        : `Initialisation des données - ${data.length} entrée(s) - ${new Date().toLocaleString('fr-FR')}`;
      
      const params = {
        owner: this.owner,
        repo: this.repo,
        path: this.path,
        message: commitMessage,
        content: content,
        committer: {
          name: 'Bibliothèque Pyrénéenne App',
          email: 'bibliotheque@pyreneenne.app',
        },
      };
      
      // Si le fichier existe, ajouter le SHA pour la mise à jour
      if (existingFile) {
        params.sha = existingFile.sha;
      }
      
      const result = await this.octokit.rest.repos.createOrUpdateFileContents(params);
      
      return {
        success: true,
        url: `https://github.com/${this.owner}/${this.repo}/blob/main/${this.path}`,
        commitUrl: result.data.commit.html_url,
        message: `Données sauvegardées avec succès (${data.length} entrées)`
      };
      
    } catch (error) {
      throw new Error(`Échec de la sauvegarde sur GitHub: ${error.message}`);
    }
  }

  // Charger les données depuis le dépôt GitHub
  async loadDataFromRepo() {
    try {
      const existingFile = await this.getExistingFile();
      
      if (!existingFile) {
        throw new Error('Aucune sauvegarde trouvée sur GitHub. Effectuez d\'abord une sauvegarde.');
      }
      
      // Vérifier si les données ont le nouveau format avec métadonnées
      if (existingFile.content.data && Array.isArray(existingFile.content.data)) {
        // Nouveau format avec métadonnées
        console.log(`Données chargées: ${existingFile.content.totalEntries} entrée(s), dernière mise à jour: ${existingFile.content.lastUpdate}`);
        return existingFile.content.data;
      } else if (Array.isArray(existingFile.content)) {
        // Ancien format direct (tableau)
        console.log(`Données chargées (ancien format): ${existingFile.content.length} entrée(s)`);
        return existingFile.content;
      } else {
        throw new Error('Format de données non reconnu dans le fichier GitHub');
      }
      
    } catch (error) {
      throw new Error(`Échec du chargement depuis GitHub: ${error.message}`);
    }
  }

  // Vérifier la connectivité et les permissions
  async testConnection() {
    try {
      // Tester l'accès à l'API GitHub
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      
      // Vérifier si le nom d'utilisateur correspond
      if (user.login !== this.owner) {
        throw new Error(`Le token appartient à ${user.login}, mais le code est configuré pour ${this.owner}`);
      }
      
      return {
        success: true,
        user: user.login,
        message: 'Connexion GitHub réussie'
      };
    } catch (error) {
      throw new Error(`Test de connexion échoué: ${error.message}`);
    }
  }
}

module.exports = GitHubIntegration;

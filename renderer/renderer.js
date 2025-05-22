
 // Structure pour stocker les données de la bibliothèque
let bookLibrary = [];
let nextId = 1;

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', async function() {
    await loadFromStorage();
    await checkGitHubToken();
    renderTable();
});

// === GESTION DU STOCKAGE ===

// Fonction pour charger les données depuis Electron Store
async function loadFromStorage() {
    try {
        const result = await window.electronAPI.loadLibrary();
        if (result.error) {
            showStatusMessage('Avertissement: ' + result.error, true);
        }
        bookLibrary = result.library || [];
        nextId = result.nextId || 1;
    } catch (error) {
        showStatusMessage('Erreur de chargement: ' + error.message, true);
        bookLibrary = [];
        nextId = 1;
    }
}

// Fonction pour sauvegarder les données
async function saveToStorage() {
    try {
        const result = await window.electronAPI.saveLibrary(bookLibrary, nextId);
        if (!result.success) {
            showStatusMessage('Erreur de sauvegarde: ' + result.message, true);
        }
    } catch (error) {
        showStatusMessage('Erreur de sauvegarde: ' + error.message, true);
    }
}

// === GESTION DES ENTRÉES ===

// Fonction pour réindexer les entrées de manière séquentielle
function reindexEntries() {
    for (let i = 0; i < bookLibrary.length; i++) {
        bookLibrary[i].id = i + 1;
    }
    nextId = bookLibrary.length + 1;
    saveToStorage();
}

// Fonction pour afficher un message de statut
function showStatusMessage(message, isError = false) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.style.color = isError ? '#e74c3c' : '#27ae60';
    
    setTimeout(() => {
        statusElement.textContent = '';
    }, 3000);
}

// === GESTION DES ÉVÉNEMENTS ===

// Ajouter une nouvelle entrée
document.getElementById('addEntryBtn').addEventListener('click', function() {
    bookLibrary.unshift({
        id: nextId++,
        author: '',
        title: '',
        description: '',
        comments: '',
        image: ''
    });
    
    reindexEntries();
    renderTable();
    showStatusMessage('Nouvelle entrée ajoutée');
});

// Fonction pour rendre le tableau avec les données actuelles
function renderTable() {
    const tableBody = document.getElementById('bookTableBody');
    tableBody.innerHTML = '';
    
    bookLibrary.forEach((book, index) => {
        const row = document.createElement('tr');
        
        // N° d'entrée (non éditable)
        const idCell = document.createElement('td');
        idCell.textContent = book.id;
        row.appendChild(idCell);
        
        // Auteur (éditable)
        const authorCell = document.createElement('td');
        const authorDiv = document.createElement('div');
        authorDiv.className = 'editable';
        authorDiv.contentEditable = true;
        authorDiv.textContent = book.author;
        authorDiv.addEventListener('blur', function() {
            book.author = this.textContent;
            saveToStorage();
        });
        authorCell.appendChild(authorDiv);
        row.appendChild(authorCell);
        
        // Titre (éditable)
        const titleCell = document.createElement('td');
        const titleDiv = document.createElement('div');
        titleDiv.className = 'editable';
        titleDiv.contentEditable = true;
        titleDiv.textContent = book.title;
        titleDiv.addEventListener('blur', function() {
            book.title = this.textContent;
            saveToStorage();
        });
        titleCell.appendChild(titleDiv);
        row.appendChild(titleCell);
        
        // Description (éditable)
        const descCell = document.createElement('td');
        const descDiv = document.createElement('div');
        descDiv.className = 'editable';
        descDiv.contentEditable = true;
        descDiv.textContent = book.description;
        descDiv.addEventListener('blur', function() {
            book.description = this.textContent;
            saveToStorage();
        });
        descCell.appendChild(descDiv);
        row.appendChild(descCell);
        
        // Commentaires (éditable)
        const commentsCell = document.createElement('td');
        const commentsDiv = document.createElement('div');
        commentsDiv.className = 'editable';
        commentsDiv.contentEditable = true;
        commentsDiv.textContent = book.comments;
        commentsDiv.addEventListener('blur', function() {
            book.comments = this.textContent;
            saveToStorage();
        });
        commentsCell.appendChild(commentsDiv);
        row.appendChild(commentsCell);
        
        // Photo
        const photoCell = document.createElement('td');
        
        if (book.image) {
            const thumbnail = document.createElement('img');
            thumbnail.src = book.image;
            thumbnail.className = 'thumbnail';
            thumbnail.addEventListener('click', function() {
                document.getElementById('expandedImg').src = this.src;
                document.getElementById('imageModal').style.display = 'block';
            });
            photoCell.appendChild(thumbnail);
        } else {
            const fileLabel = document.createElement('label');
            fileLabel.className = 'file-label';
            fileLabel.textContent = 'Choisir image';
            fileLabel.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    const result = await window.electronAPI.selectImage();
                    if (result.success) {
                        book.image = result.data;
                        saveToStorage();
                        renderTable();
                        showStatusMessage('Image ajoutée avec succès');
                    } else if (result.message !== 'Sélection annulée') {
                        showStatusMessage(result.message || 'Erreur lors de la sélection', true);
                    }
                } catch (error) {
                    showStatusMessage('Erreur lors de la sélection d\'image: ' + error.message, true);
                }
            });
            
            photoCell.appendChild(fileLabel);
        }
        row.appendChild(photoCell);
        
        // Supprimer (bouton ×)
        const actionsCell = document.createElement('td');
        actionsCell.className = 'supprimer-column';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Supprimer cette entrée';
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm(`Êtes-vous sûr de vouloir supprimer l'entrée n°${book.id} ?`)) {
                bookLibrary.splice(index, 1);
                reindexEntries();
                renderTable();
                showStatusMessage('Entrée supprimée');
            }
        });
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// === RECHERCHE ===

document.getElementById('searchInput').addEventListener('input', function() {
    const searchValue = this.value.toLowerCase();
    const rows = document.getElementById('bookTableBody').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        for (let j = 1; j < cells.length - 1; j++) {
            const cellText = cells[j].textContent.toLowerCase();
            if (cellText.includes(searchValue)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
});

// === EXPORT/IMPORT ===

// Exporter les données
document.getElementById('exportBtn').addEventListener('click', async function() {
    try {
        const result = await window.electronAPI.exportData(bookLibrary);
        if (result.success) {
            showStatusMessage(result.message || 'Données exportées avec succès');
        } else if (result.message !== 'Exportation annulée') {
            showStatusMessage(result.message || 'Erreur lors de l\'exportation', true);
        }
    } catch (error) {
        showStatusMessage('Erreur d\'exportation: ' + error.message, true);
    }
});

// Importer les données
document.getElementById('importBtn').addEventListener('click', async function() {
    try {
        const result = await window.electronAPI.importData();
        if (result.success) {
            if (confirm('Cette action remplacera toutes les données existantes. Continuer ?')) {
                bookLibrary = result.data;
                reindexEntries();
                renderTable();
                showStatusMessage('Données importées avec succès');
            }
        } else if (result.message !== 'Importation annulée') {
            showStatusMessage(result.message || 'Erreur lors de l\'importation', true);
        }
    } catch (error) {
        showStatusMessage('Erreur d\'importation: ' + error.message, true);
    }
});

// === GESTION DES MODALES ===

// Fermer la modal d'image
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('imageModal').style.display = 'none';
});

// Fermer la modal si on clique en dehors
window.addEventListener('click', function(event) {
    const imageModal = document.getElementById('imageModal');
    const configModal = document.getElementById('githubConfigModal');
    
    if (event.target === imageModal) {
        imageModal.style.display = 'none';
    }
    if (event.target === configModal) {
        configModal.style.display = 'none';
    }
});

// === INTÉGRATION GITHUB ===

// Vérifier si un token GitHub est configuré
async function checkGitHubToken() {
    try {
        const result = await window.electronAPI.githubCheckToken();
        const statusElement = document.getElementById('githubStatus');
        if (result.hasToken) {
            statusElement.textContent = '✓ Token configuré';
            statusElement.style.color = '#27ae60';
        } else {
            statusElement.textContent = '⚠ Token non configuré';
            statusElement.style.color = '#f39c12';
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
    }
}

// Configuration GitHub
document.getElementById('githubConfigBtn').addEventListener('click', function() {
    document.getElementById('githubConfigModal').style.display = 'block';
    document.getElementById('githubTokenInput').value = '';
});

document.getElementById('cancelTokenBtn').addEventListener('click', function() {
    document.getElementById('githubConfigModal').style.display = 'none';
});

document.getElementById('saveTokenBtn').addEventListener('click', async function() {
    const token = document.getElementById('githubTokenInput').value.trim();
    
    if (!token) {
        showStatusMessage('Veuillez entrer un token valide', true);
        return;
    }
    
    try {
        const result = await window.electronAPI.githubAuth(token);
        if (result.success) {
            document.getElementById('githubConfigModal').style.display = 'none';
            showStatusMessage('Token GitHub configuré avec succès');
            await checkGitHubToken();
        } else {
            showStatusMessage(result.message || 'Erreur lors de la configuration', true);
        }
    } catch (error) {
        showStatusMessage('Erreur lors de la configuration: ' + error.message, true);
    }
});

// Sauvegarder sur GitHub
document.getElementById('githubSaveBtn').addEventListener('click', async function() {
    try {
        showStatusMessage('Sauvegarde en cours...');
        const result = await window.electronAPI.githubSave(bookLibrary);
        if (result.success) {
            showStatusMessage('Données sauvegardées sur GitHub avec succès');
        } else {
            showStatusMessage(result.message || 'Erreur lors de la sauvegarde', true);
        }
    } catch (error) {
        showStatusMessage('Erreur lors de la sauvegarde: ' + error.message, true);
    }
});

// Charger depuis GitHub
document.getElementById('githubLoadBtn').addEventListener('click', async function() {
    try {
        showStatusMessage('Chargement en cours...');
        const result = await window.electronAPI.githubLoad();
        if (result.success) {
            if (confirm('Cette action remplacera toutes les données existantes. Continuer ?')) {
                bookLibrary = result.data;
                reindexEntries();
                renderTable();
                showStatusMessage('Données chargées depuis GitHub avec succès');
            }
        } else {
            showStatusMessage(result.message || 'Erreur lors du chargement', true);
        }
    } catch (error) {
        showStatusMessage('Erreur lors du chargement: ' + error.message, true);
    }
});

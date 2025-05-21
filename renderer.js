// Structure pour stocker les données de la bibliothèque
let bookLibrary = [];
let nextId = 1;

// Charger les données depuis le localStorage au démarrage
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    renderTable();
});
 // Fonction pour charger les données depuis le localStorage
        function loadFromLocalStorage() {
            const savedLibrary = localStorage.getItem('pyreneenneLibrary');
            const savedNextId = localStorage.getItem('pyreneenneNextId');
            
            if (savedLibrary) {
                bookLibrary = JSON.parse(savedLibrary);
            }
            
            if (savedNextId) {
                nextId = parseInt(savedNextId);
            }
        }

        // Fonction pour sauvegarder les données dans le localStorage
        function saveToLocalStorage() {
            localStorage.setItem('pyreneenneLibrary', JSON.stringify(bookLibrary));
            localStorage.setItem('pyreneenneNextId', nextId);
        }

        // Fonction pour réindexer les entrées de manière séquentielle
        function reindexEntries() {
            // Réassigner tous les IDs séquentiellement
            for (let i = 0; i < bookLibrary.length; i++) {
                bookLibrary[i].id = i + 1;
            }
            // Mettre à jour le prochain ID
            nextId = bookLibrary.length + 1;
            // Sauvegarder les changements
            saveToLocalStorage();
        }

        // Fonction pour afficher un message de statut
        function showStatusMessage(message, isError = false) {
            const statusElement = document.getElementById('statusMessage');
            statusElement.textContent = message;
            statusElement.style.color = isError ? '#e74c3c' : '#27ae60';
            
            // Effacer le message après 3 secondes
            setTimeout(() => {
                statusElement.textContent = '';
            }, 3000);
        }

        // Fonction pour ajouter une nouvelle entrée
        document.getElementById('addEntryBtn').addEventListener('click', function() {
            // Ajouter en haut du tableau
            bookLibrary.unshift({
                id: nextId++,
                author: '',
                title: '',
                description: '',
                comments: '',
                image: ''
            });
            
            // Réindexer toutes les entrées
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
                    saveToLocalStorage();
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
                    saveToLocalStorage();
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
                    saveToLocalStorage();
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
                    saveToLocalStorage();
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
                    
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.className = 'file-input';
                    fileInput.addEventListener('change', function(e) {
                        if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = function(event) {
                                book.image = event.target.result;
                                saveToLocalStorage();
                                renderTable();
                                showStatusMessage('Image ajoutée avec succès');
                            };
                            reader.readAsDataURL(e.target.files[0]);
                        }
                    });
                    
                    // L'input est ajouté directement à la page plutôt qu'au label
                    document.body.appendChild(fileInput);
                    
                    fileLabel.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        fileInput.click();
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
                    e.stopPropagation(); // Empêcher la propagation
                    if (confirm(`Êtes-vous sûr de vouloir supprimer l'entrée n°${book.id} ?`)) {
                        // Supprimer l'entrée du tableau
                        bookLibrary.splice(index, 1);
                        // Réindexer les entrées restantes
                        reindexEntries();
                        // Rafraîchir l'affichage
                        renderTable();
                        showStatusMessage('Entrée supprimée');
                    }
                });
                actionsCell.appendChild(deleteBtn);
                row.appendChild(actionsCell);
                
                tableBody.appendChild(row);
            });
        }

        // Recherche
        document.getElementById('searchInput').addEventListener('input', function() {
            const searchValue = this.value.toLowerCase();
            const rows = document.getElementById('bookTableBody').getElementsByTagName('tr');
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.getElementsByTagName('td');
                let found = false;
                
                for (let j = 1; j < cells.length - 1; j++) { // Ignorer l'ID et la dernière cellule (supprimer)
                    const cellText = cells[j].textContent.toLowerCase();
                    if (cellText.includes(searchValue)) {
                        found = true;
                        break;
                    }
                }
                
                row.style.display = found ? '' : 'none';
            }
        });

// === MODIFIEZ UNIQUEMENT LA FONCTION D'EXPORT ===
document.getElementById('exportBtn').addEventListener('click', async function() {
    const dataStr = JSON.stringify(bookLibrary, null, 2);
    
    try {
        const result = await window.electronAPI.exportData(dataStr);
        if (result.success) {
            showStatusMessage(`Données exportées vers : ${result.filePath}`);
        }
    } catch (err) {
        showStatusMessage('Erreur lors de l\'exportation : ' + err.message, true);
    }
});

// Importer les données
        document.getElementById('importBtn').addEventListener('click', function() {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        
                        if (Array.isArray(importedData)) {
                            if (confirm('Cette action remplacera toutes les données existantes. Continuer ?')) {
                                bookLibrary = importedData;
                                
                                // Réindexer les entrées importées
                                reindexEntries();
                                renderTable();
                                showStatusMessage('Données importées avec succès');
                            }
                        } else {
                            showStatusMessage('Format de fichier invalide', true);
                        }
                    } catch (error) {
                        showStatusMessage('Erreur lors de l\'importation: ' + error.message, true);
                    }
                };
                
                reader.readAsText(file);
            }
        });

        // Fermer la modale d'image
        document.querySelector('.close').addEventListener('click', function() {
            document.getElementById('imageModal').style.display = 'none';
        });

        // Fermer la modale si on clique en dehors de l'image
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('imageModal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

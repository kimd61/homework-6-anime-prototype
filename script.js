class AnimeApp {
    constructor() {
        this.initElements();
        this.addEventListeners();
        this.loadTopAnime();
        this.favoriteAnimes = this.loadFavorites();
    }

    initElements() {
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.animeGrid = document.getElementById('anime-grid');
        this.loadingSpinner = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        this.favoritesGrid = document.getElementById('favorites-grid');
    }

    addEventListeners() {
        this.searchButton.addEventListener('click', () => this.searchAnime());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchAnime();
        });

        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                
                // Hide all sections first
                document.getElementById('top-section').classList.add('hidden');
                document.getElementById('search-section').classList.add('hidden');
                document.getElementById('favorites-section').classList.add('hidden');
                
                // Show the selected section
                if (page === 'top') {
                    document.getElementById('top-section').classList.remove('hidden');
                    this.loadTopAnime();
                } else if (page === 'search') {
                    document.getElementById('search-section').classList.remove('hidden');
                    this.searchInput.focus();
                } else if (page === 'favorites') {
                    document.getElementById('favorites-section').classList.remove('hidden');
                    this.displayFavorites();
                }
            });
        });
    }

    showLoading() {
        this.loadingSpinner.classList.remove('hidden');
        this.animeGrid.innerHTML = '';
        this.errorMessage.classList.add('hidden');
    }

    hideLoading() {
        this.loadingSpinner.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
        this.animeGrid.innerHTML = '';
    }

    async fetchAnime(url) {
        this.showLoading();
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            this.showError('Failed to fetch anime data: ' + error.message);
            return null;
        } finally {
            this.hideLoading();
        }
    }

    createAnimeCard(anime, isFavorite = false) {
        const card = document.createElement('div');
        card.classList.add('anime-card');
        card.dataset.id = anime.mal_id;

        const title = anime.title || anime.title_english || 'Unknown Title';
        const imageUrl = anime.images?.jpg?.image_url || anime.image_url || 'https://via.placeholder.com/225x350';
        const score = anime.score || 'N/A';
        const episodes = anime.episodes || 'Unknown';

        card.innerHTML = `
            <img src="${imageUrl}" alt="${title}">
            <div class="anime-card-content">
                <h3>${title}</h3>
                <div class="anime-details">
                    <span>Score: ${score}</span>
                    <span>Episodes: ${episodes}</span>
                </div>
                <button class="favorite-btn ${isFavorite ? 'favorited' : ''}">
                    ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
            </div>
        `;
        
        // Add event listener to the favorite button
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', () => this.toggleFavorite(anime));
        
        return card;
    }

    renderAnimeGrid(animeList) {
        this.animeGrid.innerHTML = '';
        animeList.forEach(anime => {
            const isFavorite = this.favoriteAnimes.some(fav => fav.mal_id === anime.mal_id);
            const card = this.createAnimeCard(anime, isFavorite);
            this.animeGrid.appendChild(card);
        });
    }

    async loadTopAnime() {
        const url = 'https://api.jikan.moe/v4/top/anime?limit=5';
        
        const data = await this.fetchAnime(url);
        if (data) {
            this.renderAnimeGrid(data.data);
        }
    }

    async searchAnime() {
        const searchTerm = this.searchInput.value.trim();
        if (!searchTerm) return;

        const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchTerm)}&limit=5`;
        
        const data = await this.fetchAnime(url);
        if (data) {
            this.renderAnimeGrid(data.data);
        }
    }

    // Favorites functionality
    toggleFavorite(anime) {
        const index = this.favoriteAnimes.findIndex(fav => fav.mal_id === anime.mal_id);
        
        if (index === -1) {
            // Add to favorites
            this.favoriteAnimes.push(anime);
        } else {
            // Remove from favorites
            this.favoriteAnimes.splice(index, 1);
        }
        
        // Save to local storage
        this.saveFavorites();
        
        // Update UI
        document.querySelectorAll(`.anime-card[data-id="${anime.mal_id}"] .favorite-btn`).forEach(btn => {
            if (index === -1) {
                btn.classList.add('favorited');
                btn.textContent = 'Remove from Favorites';
            } else {
                btn.classList.remove('favorited');
                btn.textContent = 'Add to Favorites';
            }
        });
    }
    
    saveFavorites() {
        localStorage.setItem('favoriteAnimes', JSON.stringify(this.favoriteAnimes));
    }
    
    loadFavorites() {
        const saved = localStorage.getItem('favoriteAnimes');
        return saved ? JSON.parse(saved) : [];
    }
    
    displayFavorites() {
        this.favoritesGrid.innerHTML = '';
        
        if (this.favoriteAnimes.length === 0) {
            this.favoritesGrid.innerHTML = '<p class="no-favorites">No favorites added yet.</p>';
            return;
        }
        
        this.favoriteAnimes.forEach(anime => {
            const card = this.createAnimeCard(anime, true);
            this.favoritesGrid.appendChild(card);
        });
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnimeApp();
});
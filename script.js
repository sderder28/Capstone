// API Configuration from config.js
const API_BASE_URL = CONFIG.API_BASE_URL;
const API_KEY = CONFIG.API_KEY;
const API_ENDPOINTS = CONFIG.API_ENDPOINTS;

// DOM elements
const ingredientInput = document.getElementById('ingredientInput');
const suggestions = document.getElementById('suggestions');
const ingredientsTags = document.getElementById('ingredientsTags');
const mealSelect = document.getElementById('mealSelect');
const searchBtn = document.getElementById('searchBtn');

// Store selected ingredients
let selectedIngredients = [];
let searchTimeout;

// Show suggestions as user types
ingredientInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase().trim();
    
    // Clear previous timeout
    clearTimeout(searchTimeout);
    
    if (value.length < 1) {
        suggestions.style.display = 'none';
        return;
    }
    
    // Faster debounce - wait only 150ms after user stops typing
    searchTimeout = setTimeout(() => {
        searchIngredients(value);
    }, 150);
});

// Search ingredients from Spoonacular API
async function searchIngredients(query) {
    try {
        // Show loading state immediately
        showLoadingState();
        
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INGREDIENTS_SEARCH}?apiKey=${API_KEY}&query=${encodeURIComponent(query)}&number=10`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        const ingredients = data.results || [];
        
        // Filter out already selected ingredients
        const filtered = ingredients.filter(ingredient => 
            !selectedIngredients.includes(ingredient.name)
        );
        
        if (filtered.length > 0) {
            showSuggestions(filtered);
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        showErrorState();
    }
}

// Show loading state
function showLoadingState() {
    suggestions.innerHTML = '<div class="suggestion-item loading">Searching ingredients...</div>';
    suggestions.style.display = 'block';
}

// Show no results state
function showNoResults() {
    suggestions.innerHTML = '<div class="suggestion-item no-results">No ingredients found</div>';
    suggestions.style.display = 'block';
}

// Show error state
function showErrorState() {
    suggestions.innerHTML = '<div class="suggestion-item error">Error loading suggestions</div>';
    suggestions.style.display = 'block';
}

// Show suggestions dropdown
function showSuggestions(items) {
    suggestions.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        
        // Spoonacular returns ingredient objects with name property
        const ingredientName = item.name;
        div.textContent = ingredientName;
        
        div.addEventListener('click', () => {
            addIngredient(ingredientName);
            ingredientInput.value = '';
            suggestions.style.display = 'none';
        });
        suggestions.appendChild(div);
    });
    suggestions.style.display = 'block';
}

// Add ingredient to tags
function addIngredient(ingredient) {
    if (!selectedIngredients.includes(ingredient)) {
        selectedIngredients.push(ingredient);
        updateTags();
    }
}

// Update tags display
function updateTags() {
    ingredientsTags.innerHTML = '';
    selectedIngredients.forEach(ingredient => {
        const tag = document.createElement('div');
        tag.className = 'ingredient-tag';
        tag.innerHTML = `
            ${ingredient}
            <button class="remove-tag" onclick="removeIngredient('${ingredient}')">×</button>
        `;
        ingredientsTags.appendChild(tag);
    });
}

// Remove ingredient
function removeIngredient(ingredient) {
    selectedIngredients = selectedIngredients.filter(item => item !== ingredient);
    updateTags();
}

// Handle Enter key to add ingredient
ingredientInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const value = ingredientInput.value.trim();
        if (value && !selectedIngredients.includes(value)) {
            addIngredient(value);
            ingredientInput.value = '';
            suggestions.style.display = 'none';
        }
    }
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!ingredientInput.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.style.display = 'none';
    }
});

// Search button functionality
searchBtn.addEventListener('click', async () => {
    const mealType = mealSelect.value;
    
    if (selectedIngredients.length === 0) {
        alert('Please add at least one ingredient');
        return;
    }
    
    try {
        // Build query parameters for Spoonacular
        const params = new URLSearchParams({
            apiKey: API_KEY,
            includeIngredients: selectedIngredients.join(','),
            number: 20,
            addRecipeInformation: true,
            fillIngredients: true
        });
        
        // Add meal type if selected
        if (mealType) {
            params.append('type', mealType);
        }
        
        // Search for recipes using Spoonacular API
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RECIPES_SEARCH}?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Recipe search failed');
        }

        const data = await response.json();
        
        // Handle the search results
        handleSearchResults(data);
        
    } catch (error) {
        console.error('Error searching recipes:', error);
        alert('Error searching for recipes. Please try again.');
    }
});

// Handle search results
function handleSearchResults(data) {
    // Store results in sessionStorage for the results page
    sessionStorage.setItem('searchResults', JSON.stringify(data));
    sessionStorage.setItem('searchIngredients', JSON.stringify(selectedIngredients));
    sessionStorage.setItem('searchMealType', mealSelect.value);
    
    // Navigate to results page (you'll need to create this)
    window.location.href = 'results.html';
}

// Enable/disable search button based on ingredients
function updateSearchButton() {
    searchBtn.disabled = selectedIngredients.length === 0;
}

// Update search button when ingredients change
const originalUpdateTags = updateTags;
updateTags = function() {
    originalUpdateTags();
    updateSearchButton();
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('SavrChef Spoonacular API integration initialized');
}); 
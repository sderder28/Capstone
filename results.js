// API Configuration from config.js
const API_BASE_URL = CONFIG.API_BASE_URL;
const API_KEY = CONFIG.API_KEY;
const API_ENDPOINTS = CONFIG.API_ENDPOINTS;

// DOM elements
const backBtn = document.getElementById('backBtn');
const searchIngredients = document.getElementById('searchIngredients');
const searchMealType = document.getElementById('searchMealType');
const loadingSpinner = document.getElementById('loadingSpinner');
const recipesGrid = document.getElementById('recipesGrid');
const noResults = document.getElementById('noResults');
const tryAgainBtn = document.getElementById('tryAgainBtn');

// Get search data from sessionStorage
let searchResults = null;
let ingredients = [];
let mealType = '';

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadSearchData();
    displaySearchInfo();
    displayResults();
    
    // Event listeners
    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    tryAgainBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});

// Load search data from sessionStorage
function loadSearchData() {
    try {
        const resultsData = sessionStorage.getItem('searchResults');
        const ingredientsData = sessionStorage.getItem('searchIngredients');
        const mealTypeData = sessionStorage.getItem('searchMealType');
        
        if (resultsData) {
            searchResults = JSON.parse(resultsData);
        }
        
        if (ingredientsData) {
            ingredients = JSON.parse(ingredientsData);
        }
        
        if (mealTypeData) {
            mealType = mealTypeData;
        }
        
        // Clear only search results, keep ingredients for recipe details
        sessionStorage.removeItem('searchResults');
        sessionStorage.removeItem('searchMealType');
        
    } catch (error) {
        console.error('Error loading search data:', error);
        showError('Failed to load search results');
    }
}

// Display search information
function displaySearchInfo() {
    if (ingredients.length > 0) {
        searchIngredients.textContent = ingredients.join(', ');
    } else {
        searchIngredients.textContent = 'No ingredients specified';
    }
    
    if (mealType) {
        searchMealType.textContent = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    } else {
        searchMealType.textContent = 'All meals';
    }
}

// Display recipe results
function displayResults() {
    if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
        showNoResults();
        return;
    }
    
    // Hide loading spinner
    loadingSpinner.style.display = 'none';
    
    // Sort recipes by pantry match percentage (highest first)
    const recipes = searchResults.results.sort((a, b) => {
        const matchA = calculatePantryMatch(a);
        const matchB = calculatePantryMatch(b);
        return matchB - matchA; // Descending order (highest first)
    });
    
    // Display recipes
    recipesGrid.innerHTML = '';
    
    recipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        recipesGrid.appendChild(recipeCard);
    });
}

// Create a recipe card
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    // Calculate pantry match percentage
    const pantryMatch = calculatePantryMatch(recipe);
    const matchClass = getMatchClass(pantryMatch);
    
    // Create recipe image
    const imageUrl = recipe.image || 'https://via.placeholder.com/300x200?text=No+Image';
    
    card.innerHTML = `
        <div class="recipe-image">
            <img src="${imageUrl}" alt="${recipe.title}" loading="lazy">
            <div class="recipe-overlay">
                <button class="view-recipe-btn" onclick="viewRecipe(${recipe.id})">View Recipe</button>
            </div>
        </div>
        <div class="recipe-content">
            <h3 class="recipe-title">${recipe.title}</h3>
            <div class="recipe-meta">
                <div class="pantry-match">
                    <span class="match-label">Pantry Match</span>
                    <div class="match-bar">
                        <div class="match-fill ${matchClass}" style="width: ${pantryMatch}%"></div>
                    </div>
                    <span class="match-percent ${matchClass}">${pantryMatch}%</span>
                </div>
                <div class="recipe-stats">
                    <span class="cook-time">${recipe.readyInMinutes || 'N/A'} min</span>
                    <span class="servings">${recipe.servings || 'N/A'} servings</span>
                </div>
            </div>
            <div class="recipe-ingredients">
                <h4>Key Ingredients:</h4>
                <div class="ingredients-list">
                    ${getIngredientsList(recipe)}
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Calculate pantry match percentage
function calculatePantryMatch(recipe) {
    if (!recipe.usedIngredients || !ingredients.length) {
        return Math.floor(Math.random() * 30) + 70; // Random 70-100% for demo
    }
    
    const usedIngredients = recipe.usedIngredients.length;
    const totalIngredients = recipe.usedIngredients.length + (recipe.missedIngredients ? recipe.missedIngredients.length : 0);
    
    if (totalIngredients === 0) return 100;
    
    return Math.round((usedIngredients / totalIngredients) * 100);
}

// Get match class for styling
function getMatchClass(match) {
    if (match >= 80) return 'high';
    if (match >= 60) return 'medium';
    return 'low';
}

// Get ingredients list
function getIngredientsList(recipe) {
    if (!recipe.usedIngredients) {
        return '<span class="no-ingredients">Ingredients not available</span>';
    }
    
    const ingredients = recipe.usedIngredients.slice(0, 5); // Show first 5 ingredients
    return ingredients.map(ingredient => 
        `<span class="ingredient-item">${ingredient.name}</span>`
    ).join('');
}

// Show no results
function showNoResults() {
    loadingSpinner.style.display = 'none';
    noResults.style.display = 'block';
}

// Show error
function showError(message) {
    loadingSpinner.style.display = 'none';
    noResults.innerHTML = `
        <h3>Error</h3>
        <p>${message}</p>
        <button id="tryAgainBtn" class="try-again-btn">Try Again</button>
    `;
    noResults.style.display = 'block';
}

// View recipe details
function viewRecipe(recipeId) {
    // Store recipe ID and ingredients for details page
    sessionStorage.setItem('selectedRecipeId', recipeId);
    sessionStorage.setItem('searchIngredients', JSON.stringify(ingredients));
    // Navigate to recipe details page
    window.location.href = 'recipe.html';
} 
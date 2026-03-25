// API Configuration from config.js
const API_BASE_URL = CONFIG.API_BASE_URL;
const API_KEY = CONFIG.API_KEY;
const API_ENDPOINTS = CONFIG.API_ENDPOINTS;

// DOM elements
const backBtn = document.getElementById('backBtn');
const recipeDetails = document.getElementById('recipeDetails');
const substitutionModal = document.getElementById('substitutionModal');
const closeModal = document.getElementById('closeModal');
const missingIngredient = document.getElementById('missingIngredient');
const substitutionList = document.getElementById('substitutionList');

// Recipe data
let recipeData = null;
let userIngredients = [];
let missingIngredients = [];
let additionalData = {
    nutrition: null,
    equipment: null,
    analyzedInstructions: null
};

// Enhanced ingredient cache for API-based category matching
let ingredientCache = new Map();

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadRecipeData();
    setupEventListeners();
});

// Load recipe data from sessionStorage
function loadRecipeData() {
    try {
        const recipeId = sessionStorage.getItem('selectedRecipeId');
        const ingredientsData = sessionStorage.getItem('searchIngredients');
        
        console.log('Loading recipe data...');
        console.log('Recipe ID:', recipeId);
        
        if (ingredientsData) {
            userIngredients = JSON.parse(ingredientsData);
            console.log('User ingredients:', userIngredients);
        } else {
            userIngredients = [];
        }
        
        if (recipeId) {
            fetchRecipeDetails(recipeId);
        } else {
            showError('No recipe selected');
        }
        
    } catch (error) {
        console.error('Error loading recipe data:', error);
        showError('Failed to load recipe details');
    }
}

// Setup event listeners
function setupEventListeners() {
    backBtn.addEventListener('click', () => {
        window.location.href = 'results.html';
    });
    
    closeModal.addEventListener('click', () => {
        substitutionModal.style.display = 'none';
        substitutionModal.classList.remove('show');
    });
    
    // Close modal when clicking outside
    substitutionModal.addEventListener('click', (e) => {
        if (e.target === substitutionModal) {
            substitutionModal.style.display = 'none';
            substitutionModal.classList.remove('show');
        }
    });
}

// Generic API call function with error handling
async function makeApiCall(endpoint, params = {}) {
    try {
        const url = new URL(`${API_BASE_URL}${endpoint}`);
        url.searchParams.append('apiKey', API_KEY);
        
        // Add additional parameters
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Enhanced API-based ingredient search
async function searchIngredient(ingredientName) {
    try {
        const results = await makeApiCall(API_ENDPOINTS.INGREDIENTS_SEARCH, {
            query: ingredientName,
            number: 5, // Get top 5 matches
            addChildren: true,
            fillIngredients: true
        });
        
        return results.results || [];
    } catch (error) {
        console.error('Error searching ingredient:', error);
        return [];
    }
}

// Get detailed ingredient information from API
async function getIngredientInfo(ingredientId) {
    try {
        const endpoint = API_ENDPOINTS.INGREDIENT_INFORMATION.replace('{id}', ingredientId);
        const info = await makeApiCall(endpoint, {
            amount: 1,
            unit: 'g'
        });
        
        return info;
    } catch (error) {
        console.error('Error getting ingredient info:', error);
        return null;
    }
}

// Enhanced API-based category matching
async function checkCategoryMatchAPI(userIngredient, recipeIngredient) {
    // Check cache first for the specific comparison
    const cacheKey = `${userIngredient}|${recipeIngredient}`;
    if (ingredientCache.has(cacheKey)) {
        return ingredientCache.get(cacheKey);
    }
    
    // Check if we have preloaded data for both ingredients
    const userInfo = ingredientCache.get(userIngredient.toLowerCase());
    const recipeInfo = ingredientCache.get(recipeIngredient.toLowerCase());
    
    if (userInfo && recipeInfo) {
        // Use preloaded data for matching
        const matchResult = await performEnhancedMatching(userInfo, recipeInfo, userIngredient, recipeIngredient);
        ingredientCache.set(cacheKey, matchResult);
        return matchResult;
    }
    
    try {
        // Search for ingredients that aren't cached
        const userResults = userInfo ? null : await searchIngredient(userIngredient);
        const recipeResults = recipeInfo ? null : await searchIngredient(recipeIngredient);
        
        if ((!userInfo && userResults.length === 0) || (!recipeInfo && recipeResults.length === 0)) {
            // Fallback to hardcoded matching
            const fallbackResult = checkCategoryMatchHardcoded(userIngredient, recipeIngredient);
            ingredientCache.set(cacheKey, fallbackResult);
            return fallbackResult;
        }
        
        // Get detailed info for ingredients that aren't cached
        const finalUserInfo = userInfo || await getIngredientInfo(userResults[0].id);
        const finalRecipeInfo = recipeInfo || await getIngredientInfo(recipeResults[0].id);
        
        if (!finalUserInfo || !finalRecipeInfo) {
            const fallbackResult = checkCategoryMatchHardcoded(userIngredient, recipeIngredient);
            ingredientCache.set(cacheKey, fallbackResult);
            return fallbackResult;
        }
        
        // Enhanced matching logic using API data
        const matchResult = await performEnhancedMatching(finalUserInfo, finalRecipeInfo, userIngredient, recipeIngredient);
        ingredientCache.set(cacheKey, matchResult);
        return matchResult;
        
    } catch (error) {
        console.error('Error in API category matching:', error);
        // Fallback to hardcoded matching
        const fallbackResult = checkCategoryMatchHardcoded(userIngredient, recipeIngredient);
        ingredientCache.set(cacheKey, fallbackResult);
        return fallbackResult;
    }
}

// Perform enhanced matching using API data
async function performEnhancedMatching(userInfo, recipeInfo, userIngredient, recipeIngredient) {
    // Check if ingredients are in the same category
    if (userInfo.category && recipeInfo.category && 
        userInfo.category.toLowerCase() === recipeInfo.category.toLowerCase()) {
        console.log(`API category match: "${userIngredient}" and "${recipeIngredient}" both in category "${userInfo.category}"`);
        return true;
    }
    
    // Check if ingredients are related (substitutions, similar ingredients)
    if (userInfo.possibleUnits && recipeInfo.possibleUnits) {
        const userUnits = userInfo.possibleUnits.map(u => u.unit.toLowerCase());
        const recipeUnits = recipeInfo.possibleUnits.map(u => u.unit.toLowerCase());
        const commonUnits = userUnits.filter(unit => recipeUnits.includes(unit));
        
        if (commonUnits.length > 0) {
            console.log(`API unit compatibility match: "${userIngredient}" and "${recipeIngredient}" share units: ${commonUnits.join(', ')}`);
            return true;
        }
    }
    
    // Check for similar names or aliases
    const userNames = [userInfo.name, ...(userInfo.aliases || [])].map(n => n.toLowerCase());
    const recipeNames = [recipeInfo.name, ...(recipeInfo.aliases || [])].map(n => n.toLowerCase());
    
    for (const userName of userNames) {
        for (const recipeName of recipeNames) {
            if (userName.includes(recipeName) || recipeName.includes(userName)) {
                console.log(`API name similarity match: "${userIngredient}" and "${recipeIngredient}" have similar names`);
                return true;
            }
        }
    }
    
    // Check if they're both in the same food group
    if (userInfo.categoryPath && recipeInfo.categoryPath) {
        const userPath = userInfo.categoryPath.toLowerCase();
        const recipePath = recipeInfo.categoryPath.toLowerCase();
        
        if (userPath.includes(recipePath) || recipePath.includes(userPath)) {
            console.log(`API category path match: "${userIngredient}" and "${recipeIngredient}" share category path`);
            return true;
        }
    }
    
    return false;
}

// Handle ingredient aliases and common variations
function getIngredientAliases(ingredientName) {
    const aliases = {
        'tomato': ['tomatoes', 'roma tomato', 'cherry tomato', 'beefsteak tomato'],
        'onion': ['yellow onion', 'white onion', 'red onion', 'sweet onion', 'shallot', 'leek', 'scallion', 'green onion'],
        'garlic': ['garlic clove', 'garlic powder', 'minced garlic', 'garlic paste'],
        'cheese': ['cheddar', 'mozzarella', 'parmesan', 'pecorino', 'asiago', 'gouda', 'brie', 'feta'],
        'milk': ['whole milk', 'skim milk', 'almond milk', 'soy milk', 'oat milk', 'coconut milk'],
        'oil': ['olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil'],
        'butter': ['unsalted butter', 'salted butter', 'margarine'],
        'flour': ['all purpose flour', 'bread flour', 'cake flour', 'whole wheat flour'],
        'sugar': ['white sugar', 'brown sugar', 'powdered sugar', 'granulated sugar'],
        'salt': ['table salt', 'kosher salt', 'sea salt', 'iodized salt'],
        'pepper': ['black pepper', 'white pepper', 'cayenne pepper', 'red pepper flakes'],
        'beef': ['sirloin', 'steak', 'ground beef', 'hamburger', 'roast', 'brisket', 'ribeye', 'tenderloin'],
        'chicken': ['breast', 'thigh', 'wing', 'drumstick', 'ground chicken', 'tender', 'cutlet'],
        'pork': ['bacon', 'ham', 'sausage', 'chop', 'loin', 'shoulder', 'belly', 'tenderloin']
    };
    
    const normalizedName = ingredientName.toLowerCase().trim();
    
    // Check if the ingredient name matches any alias
    for (const [baseName, aliasList] of Object.entries(aliases)) {
        if (normalizedName === baseName || aliasList.includes(normalizedName)) {
            return [baseName, ...aliasList];
        }
    }
    
    return [normalizedName];
}

// Enhanced ingredient matching with aliases
async function checkIngredientMatchWithAliases(userIngredient, recipeIngredient) {
    const userAliases = getIngredientAliases(userIngredient);
    const recipeAliases = getIngredientAliases(recipeIngredient);
    
    // Check for exact matches in aliases
    for (const userAlias of userAliases) {
        for (const recipeAlias of recipeAliases) {
            if (userAlias === recipeAlias) {
                console.log(`Alias match found: "${userIngredient}" and "${recipeIngredient}" match via alias "${userAlias}"`);
                return true;
            }
        }
    }
    
    // If no alias match, try API-based matching
    return await checkCategoryMatchAPI(userIngredient, recipeIngredient);
}

// Fallback to original hardcoded category matching
function checkCategoryMatchHardcoded(userIngredient, recipeIngredient) {
    const categories = {
        'beef': ['beef', 'sirloin', 'steak', 'ground beef', 'hamburger', 'roast', 'brisket', 'ribeye', 'tenderloin', 'flank', 'skirt', 'chuck', 'round', 'shank'],
        'chicken': ['chicken', 'breast', 'thigh', 'wing', 'drumstick', 'ground chicken', 'tender', 'cutlet'],
        'pork': ['pork', 'bacon', 'ham', 'sausage', 'chop', 'loin', 'shoulder', 'belly', 'tenderloin'],
        'onion': ['onion', 'yellow onion', 'white onion', 'red onion', 'sweet onion', 'shallot', 'leek', 'scallion', 'green onion'],
        'garlic': ['garlic', 'garlic clove', 'garlic powder', 'minced garlic'],
        'tomato': ['tomato', 'tomatoes', 'cherry tomato', 'roma tomato', 'beefsteak tomato', 'tomato paste', 'tomato sauce'],
        'cheese': ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'pecorino', 'asiago', 'gouda', 'brie', 'feta'],
        'milk': ['milk', 'whole milk', 'skim milk', 'almond milk', 'soy milk', 'oat milk', 'coconut milk'],
        'oil': ['oil', 'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil'],
        'butter': ['butter', 'unsalted butter', 'salted butter', 'margarine'],
        'flour': ['flour', 'all purpose flour', 'bread flour', 'cake flour', 'whole wheat flour'],
        'sugar': ['sugar', 'white sugar', 'brown sugar', 'powdered sugar', 'granulated sugar'],
        'salt': ['salt', 'table salt', 'kosher salt', 'sea salt', 'iodized salt'],
        'pepper': ['pepper', 'black pepper', 'white pepper', 'cayenne pepper', 'red pepper flakes']
    };
    
    for (const [category, types] of Object.entries(categories)) {
        const userMatchesCategory = category === userIngredient || types.some(type => userIngredient.includes(type));
        const recipeMatchesCategory = types.some(type => recipeIngredient.includes(type));
        
        if (userMatchesCategory && recipeMatchesCategory) {
            console.log(`Hardcoded category match found: "${userIngredient}" and "${recipeIngredient}" both match category "${category}"`);
            return true;
        }
    }
    
    console.log(`No hardcoded category match found for "${userIngredient}" and "${recipeIngredient}"`);
    return false;
}

// Preload ingredient information for better performance
async function preloadIngredientInfo() {
    if (!recipeData || !recipeData.extendedIngredients) return;
    
    console.log('Preloading ingredient information for enhanced matching...');
    
    const ingredientsToPreload = [
        ...recipeData.extendedIngredients.map(ing => ing.name),
        ...userIngredients
    ];
    
    // Preload unique ingredients and filter out already cached ones
    const uniqueIngredients = [...new Set(ingredientsToPreload)].filter(
        ingredient => !ingredientCache.has(ingredient.toLowerCase())
    );
    
    if (uniqueIngredients.length === 0) {
        console.log('All ingredients already cached, skipping preload');
        return;
    }
    
    // Preload in parallel for better performance (limit to 5 concurrent requests)
    const batchSize = 5;
    for (let i = 0; i < uniqueIngredients.length; i += batchSize) {
        const batch = uniqueIngredients.slice(i, i + batchSize);
        const batchPromises = batch.map(async (ingredientName) => {
            try {
                const results = await searchIngredient(ingredientName);
                if (results.length > 0) {
                    const info = await getIngredientInfo(results[0].id);
                    if (info) {
                        ingredientCache.set(ingredientName.toLowerCase(), info);
                        console.log(`Preloaded info for: ${ingredientName}`);
                    }
                }
            } catch (error) {
                console.warn(`Failed to preload info for ${ingredientName}:`, error);
            }
        });
        
        await Promise.allSettled(batchPromises);
    }
    
    console.log('Ingredient preloading completed');
}

// Fetch recipe details and additional information
async function fetchRecipeDetails(recipeId) {
    try {
        // Show loading state
        recipeDetails.innerHTML = `
            <div class="loading-recipe">
                <div class="spinner"></div>
                <p>Loading recipe details...</p>
            </div>
        `;

        // Fetch main recipe data
        const recipeResponse = await makeApiCall(
            API_ENDPOINTS.RECIPE_DETAILS.replace('{id}', recipeId)
        );
        
        recipeData = recipeResponse;
        
        // Display recipe immediately with basic information
        await displayRecipe();
        
        // Fetch additional data in parallel for better performance
        const additionalDataPromises = [
            fetchAnalyzedInstructions(recipeId),
            fetchNutritionInfo(recipeId),
            fetchEquipmentInfo(recipeId)
        ];

        try {
            const [analyzedInstructions, nutrition, equipment] = 
                await Promise.allSettled(additionalDataPromises);
            
            additionalData.analyzedInstructions = analyzedInstructions.status === 'fulfilled' ? analyzedInstructions.value : null;
            additionalData.nutrition = nutrition.status === 'fulfilled' ? nutrition.value : null;
            additionalData.equipment = equipment.status === 'fulfilled' ? equipment.value : null;
            
            // Update the display with additional data
            await displayRecipe();
        } catch (error) {
            console.warn('Some additional data failed to load:', error);
        }

        // Preload ingredient information for enhanced matching in background
        preloadIngredientInfo().then(() => {
            // Update ingredient matching after preloading
            identifyMissingIngredients().then(() => {
                displayRecipe();
            });
        }).catch(error => {
            console.warn('Background ingredient preloading failed:', error);
        });
        
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        showError('Failed to load recipe details. Please try again.');
    }
}

// Fetch analyzed instructions (structured cooking steps)
async function fetchAnalyzedInstructions(recipeId) {
    return await makeApiCall(
        API_ENDPOINTS.RECIPE_ANALYZED_INSTRUCTIONS.replace('{id}', recipeId)
    );
}

// Fetch nutrition information
async function fetchNutritionInfo(recipeId) {
    return await makeApiCall(
        API_ENDPOINTS.RECIPE_NUTRITION.replace('{id}', recipeId)
    );
}

// Fetch equipment information
async function fetchEquipmentInfo(recipeId) {
    return await makeApiCall(
        API_ENDPOINTS.RECIPE_EQUIPMENT.replace('{id}', recipeId)
    );
}



// Display recipe details with enhanced information
async function displayRecipe() {
    if (!recipeData) {
        showError('Recipe data not available');
        return;
    }
    
    // Identify missing ingredients
    await identifyMissingIngredients();
    
    recipeDetails.innerHTML = `
        <div class="recipe-header">
            <div class="recipe-image-large">
                <img src="${recipeData.image}" alt="${recipeData.title}">
            </div>
            <div class="recipe-info">
                <h1>${recipeData.title}</h1>
                <div class="recipe-meta-info">
                    <span class="cook-time">⏱️ ${recipeData.readyInMinutes} minutes</span>
                    <span class="servings">👥 ${recipeData.servings} servings</span>
                    ${recipeData.healthScore ? `<span class="health-score">❤️ Health Score: ${recipeData.healthScore}</span>` : ''}
                </div>
                <div class="ingredient-status">
                    <h3>Ingredients Status</h3>
                    <div class="status-summary">
                        <span class="available">✅ Available: ${userIngredients.length}</span>
                        <span class="missing">❌ Missing: ${missingIngredients.length}</span>
                    </div>
                </div>
                ${additionalData.nutrition ? `
                    <div class="nutrition-preview">
                        <h4>Nutrition (per serving)</h4>
                        <div class="nutrition-summary">
                            <span>Calories: ${additionalData.nutrition.calories || 'N/A'}</span>
                            <span>Protein: ${additionalData.nutrition.protein || 'N/A'}</span>
                            <span>Carbs: ${additionalData.nutrition.carbs || 'N/A'}</span>
                            <span>Fat: ${additionalData.nutrition.fat || 'N/A'}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="recipe-content">
            <div class="ingredients-section">
                <h2>Ingredients</h2>
                <div class="ingredients-list">
                    ${generateIngredientsList()}
                </div>
            </div>
            
            <div class="instructions-section">
                <h2>Instructions</h2>
                <div class="instructions">
                    ${formatInstructions()}
                </div>
            </div>
            
            ${additionalData.equipment ? `
                <div class="equipment-section">
                    <h2>Equipment Needed</h2>
                    <div class="equipment-list">
                        ${generateEquipmentList()}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Identify missing ingredients with improved matching
async function identifyMissingIngredients() {
    missingIngredients = [];
    
    if (!recipeData.extendedIngredients) return;
    
    console.log('User ingredients:', userIngredients); // Debug log
    
    // First, try fast matching without API calls
    for (const ingredient of recipeData.extendedIngredients) {
        if (ingredient.substituted) continue;
        
        const ingredientName = ingredient.name.toLowerCase().trim();
        console.log('Checking ingredient:', ingredientName); // Debug log
        
        let hasIngredient = false;
        
        // Check each user ingredient with fast matching first
        for (const userIngredient of userIngredients) {
            const normalizedUserIngredient = userIngredient.toLowerCase().trim();
            
            // Fast matching strategies (no API calls)
            const exactMatch = normalizedUserIngredient === ingredientName;
            const containsMatch = normalizedUserIngredient.includes(ingredientName) || 
                                 ingredientName.includes(normalizedUserIngredient);
            
            // Word-based matching
            const userWords = normalizedUserIngredient.split(/\s+/);
            const recipeWords = ingredientName.split(/\s+/);
            const wordMatch = userWords.some(userWord => 
                recipeWords.some(recipeWord => 
                    userWord === recipeWord || 
                    userWord.includes(recipeWord) || 
                    recipeWord.includes(userWord)
                )
            );
            
            // Check aliases (fast)
            const aliases = getIngredientAliases(normalizedUserIngredient);
            const aliasMatch = aliases.some(alias => 
                alias === ingredientName || 
                ingredientName.includes(alias) || 
                alias.includes(ingredientName)
            );
            
            const fastMatch = exactMatch || containsMatch || wordMatch || aliasMatch;
            
            if (fastMatch) {
                hasIngredient = true;
                console.log(`Fast match found for: ${ingredient.name}`);
                break;
            }
        }
        
        // If no fast match found, try API-based matching only if we have cached data
        if (!hasIngredient) {
            let apiMatch = false;
            
            // Only use API matching if we have cached data to avoid blocking
            for (const userIngredient of userIngredients) {
                const normalizedUserIngredient = userIngredient.toLowerCase().trim();
                
                // Check if we have cached data for this ingredient
                if (ingredientCache.has(normalizedUserIngredient) || ingredientCache.has(ingredientName)) {
                    const categoryMatch = await checkIngredientMatchWithAliases(normalizedUserIngredient, ingredientName);
                    if (categoryMatch) {
                        apiMatch = true;
                        console.log(`API match found for: ${ingredient.name}`);
                        break;
                    }
                }
            }
            
            if (!apiMatch) {
                missingIngredients.push(ingredient);
                console.log('Added to missing:', ingredient.name);
            }
        }
    }
    
    console.log('Final missing ingredients:', missingIngredients.map(i => i.name));
}

// Generate ingredients list
function generateIngredientsList() {
    if (!recipeData.extendedIngredients) return '<p>Ingredients not available</p>';
    
    return recipeData.extendedIngredients.map(ingredient => {
        const isMissing = missingIngredients.some(missing => 
            missing.name.toLowerCase().trim() === ingredient.name.toLowerCase().trim()
        );
        
        const isSubstituted = ingredient.substituted;
        const originalName = ingredient.originalName || ingredient.name;
        
        let missingClass = 'available-ingredient';
        let clickHandler = '';
        let cursorStyle = '';
        let badge = '<span class="available-badge">Available</span>';
        
        if (isSubstituted) {
            missingClass = 'substituted-ingredient';
            badge = '<span class="substituted-badge">Substituted</span>';
        } else if (isMissing) {
            missingClass = 'missing-ingredient';
            clickHandler = `onclick="showSubstitution('${originalName}')"`;
            cursorStyle = 'cursor: pointer;';
            badge = '<span class="missing-badge">Missing</span>';
        }
        
        return `
            <div class="ingredient-item ${missingClass}" ${clickHandler} style="${cursorStyle}">
                <span class="ingredient-name">${ingredient.name}</span>
                <span class="ingredient-amount">${ingredient.amount} ${ingredient.unit}</span>
                ${badge}
            </div>
        `;
    }).join('');
}

// Format instructions using analyzed instructions if available
function formatInstructions() {
    if (additionalData.analyzedInstructions && additionalData.analyzedInstructions.length > 0) {
        // Use structured instructions from API
        return additionalData.analyzedInstructions.map(instructionGroup => 
            instructionGroup.steps.map((step, index) => `
                <div class="instruction-step">
                    <span class="step-number">${step.number}</span>
                    <p>${step.step}</p>
                    ${step.equipment.length > 0 ? `
                        <div class="step-equipment">
                            <small>Equipment: ${step.equipment.map(eq => eq.name).join(', ')}</small>
                        </div>
                    ` : ''}
                    ${step.ingredients.length > 0 ? `
                        <div class="step-ingredients">
                            <small>Ingredients: ${step.ingredients.map(ing => ing.name).join(', ')}</small>
                        </div>
                    ` : ''}
                </div>
            `).join('')
        ).join('');
    } else if (recipeData.instructions) {
        // Fallback to basic instructions
        const steps = recipeData.instructions.split('\n').filter(step => step.trim());
        return steps.map((step, index) => `
            <div class="instruction-step">
                <span class="step-number">${index + 1}</span>
                <p>${step.trim()}</p>
            </div>
        `).join('');
    } else {
        return '<p>Instructions not available</p>';
    }
}

// Generate equipment list
function generateEquipmentList() {
    if (!additionalData.equipment || !additionalData.equipment.equipment) {
        return '<p>Equipment information not available</p>';
    }
    
    return additionalData.equipment.equipment.map(item => `
        <div class="equipment-item">
            <span class="equipment-name">${item.name}</span>
            ${item.temperature ? `<span class="equipment-temp">Temperature: ${item.temperature.number}°${item.temperature.unit}</span>` : ''}
        </div>
    `).join('');
}



// Show substitution modal with enhanced API usage
async function showSubstitution(ingredientName) {
    missingIngredient.textContent = ingredientName;
    
    // Show loading state
    substitutionList.innerHTML = `
        <div class="loading-substitutions">
            <div class="spinner-small"></div>
            <p>Finding substitutions for ${ingredientName}...</p>
        </div>
    `;
    
    substitutionModal.style.display = 'flex';
    substitutionModal.classList.add('show');
    
    try {
        // Use the API endpoint for substitutions
        const substitutions = await makeApiCall(
            API_ENDPOINTS.INGREDIENT_SUBSTITUTES,
            { ingredientName: ingredientName }
        );
        
        if (substitutions.substitutes && substitutions.substitutes.length > 0) {
            const apiSubstitutions = substitutions.substitutes.slice(0, 3).map(sub => ({
                name: sub,
                ratio: '1:1',
                notes: 'Direct substitution from Spoonacular database',
                source: 'api'
            }));
            
            displaySubstitutions(apiSubstitutions);
        } else {
            // Fallback to local substitutions
            const fallbackSubstitutions = getFallbackSubstitutions(ingredientName);
            if (fallbackSubstitutions.length > 0) {
                displaySubstitutions(fallbackSubstitutions);
            } else {
                substitutionList.innerHTML = `
                    <div class="no-substitutions">
                        <p>No substitutions found for "${ingredientName}"</p>
                        <p>Try checking your pantry for similar ingredients or consider omitting this ingredient.</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Error loading substitutions:', error);
        substitutionList.innerHTML = `
            <div class="error-substitutions">
                <p>Failed to load substitutions. Please try again.</p>
                <button onclick="showSubstitution('${ingredientName}')">Retry</button>
            </div>
        `;
    }
}

// Display substitutions in modal
function displaySubstitutions(substitutions) {
    substitutionList.innerHTML = `
        <div class="substitutions-header">
            <p>Select one of the following substitutions:</p>
        </div>
        ${substitutions.map((sub, index) => `
            <div class="substitution-item selectable" data-substitution="${sub.name}" data-index="${index}">
                <div class="substitution-info">
                    <div class="substitution-header">
                        <h5>${sub.name}</h5>
                    </div>
                    <p class="substitution-ratio">${sub.ratio}</p>
                    <p class="substitution-notes">${sub.notes}</p>
                </div>
                <div class="substitution-actions">
                    <button class="select-substitution" onclick="selectSubstitution('${missingIngredient.textContent}', '${sub.name}', ${index})">
                        Select This
                    </button>
                </div>
            </div>
        `).join('')}
    `;
}

// Select substitution
function selectSubstitution(originalIngredient, substitution, index) {
    // Highlight selection
    const substitutionItems = document.querySelectorAll('.substitution-item');
    substitutionItems.forEach(item => item.classList.remove('selected'));
    
    const selectedItem = document.querySelector(`[data-index="${index}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Update recipe data
    if (recipeData && recipeData.extendedIngredients) {
        let found = false;
        recipeData.extendedIngredients.forEach(ingredient => {
            const normalizedIngredientName = ingredient.name.toLowerCase().trim();
            const normalizedOriginalName = originalIngredient.toLowerCase().trim();
            
            if (normalizedIngredientName === normalizedOriginalName) {
                ingredient.originalName = ingredient.name;
                ingredient.name = `${substitution} (${originalIngredient})`;
                ingredient.substituted = true;
                found = true;
            }
        });
        
        if (!found) {
            console.warn('No matching ingredient found for:', originalIngredient);
        }
    }
    
    // Update missing ingredients list
    missingIngredients = missingIngredients.filter(ingredient => {
        const normalizedIngredientName = ingredient.name.toLowerCase().trim();
        const normalizedOriginalName = originalIngredient.toLowerCase().trim();
        return normalizedIngredientName !== normalizedOriginalName;
    });
    
    // Close modal and update display
    setTimeout(async () => {
        substitutionModal.style.display = 'none';
        substitutionModal.classList.remove('show');
        await displayRecipe();
        showSuccessMessage(`✅ Substituted ${originalIngredient} with ${substitution}`);
    }, 500);
}

// Fallback substitutions (simplified)
function getFallbackSubstitutions(ingredientName) {
    const ingredient = ingredientName.toLowerCase();
    const substitutionDatabase = {
        'butter': [
            { name: 'Olive Oil', ratio: '1:1', notes: 'For cooking and baking' },
            { name: 'Coconut Oil', ratio: '1:1', notes: 'Good for baking' }
        ],
        'eggs': [
            { name: 'Flaxseed Meal', ratio: '1 tbsp + 3 tbsp water = 1 egg', notes: 'For binding in baking' },
            { name: 'Banana', ratio: '1/4 cup mashed = 1 egg', notes: 'For baking, adds sweetness' }
        ],
        'milk': [
            { name: 'Almond Milk', ratio: '1:1', notes: 'Dairy-free alternative' },
            { name: 'Soy Milk', ratio: '1:1', notes: 'High protein alternative' }
        ],
        'onion': [
            { name: 'Shallots', ratio: '1:1', notes: 'Milder flavor' },
            { name: 'Leeks', ratio: '1:1', notes: 'Sweet, mild alternative' }
        ],
        'garlic': [
            { name: 'Garlic Powder', ratio: '1/8 tsp = 1 clove', notes: 'Convenient alternative' },
            { name: 'Shallots', ratio: '1:1', notes: 'Milder flavor' }
        ]
    };
    
    for (const [key, subs] of Object.entries(substitutionDatabase)) {
        if (ingredient.includes(key) || key.includes(ingredient)) {
            return subs;
        }
    }
    
    return [];
}



// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Show error
function showError(message) {
    recipeDetails.innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="window.location.href='results.html'">Back to Results</button>
        </div>
    `;
} 
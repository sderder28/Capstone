// API Configuration for Spoonacular API
const CONFIG = {
    API_BASE_URL: 'https://api.spoonacular.com', // Base URL for Spoonacular
    API_KEY: 'cba6117991324d32b9d7a7240c4e8374',
    API_ENDPOINTS: {
        // Core recipe endpoints
        INGREDIENTS_SEARCH: '/food/ingredients/search', // Spoonacular ingredients search endpoint
        RECIPES_SEARCH: '/recipes/complexSearch', // Spoonacular recipe search endpoint
        RECIPE_DETAILS: '/recipes/{id}/information', // Spoonacular recipe details endpoint
        
        // Enhanced recipe information
        RECIPE_ANALYZED_INSTRUCTIONS: '/recipes/{id}/analyzedInstructions', // Structured cooking instructions
        RECIPE_NUTRITION: '/recipes/{id}/nutritionWidget.json', // Nutrition information
        RECIPE_EQUIPMENT: '/recipes/{id}/equipmentWidget.json', // Cooking equipment needed
        RECIPE_PRICE_BREAKDOWN: '/recipes/{id}/priceBreakdownWidget.json', // Cost breakdown
        RECIPE_TASTE: '/recipes/{id}/tasteWidget.json', // Taste profile (sweet, salty, etc.)
        
        // Related recipes
        RECIPE_SIMILAR: '/recipes/{id}/similar', // Similar recipes
        RECIPE_RANDOM: '/recipes/random', // Random recipe suggestions
        
        // Ingredient information
        INGREDIENT_SUBSTITUTES: '/food/ingredients/substitutes', // Ingredient substitutions
        INGREDIENT_INFORMATION: '/food/ingredients/{id}/information', // Detailed ingredient info
        
        // Fun additions
        FOOD_TRIVIA: '/food/trivia/random', // Food trivia
        FOOD_JOKES: '/food/jokes/random' // Food jokes
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;

} 

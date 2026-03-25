// API Configuration from config.js
const API_BASE_URL = CONFIG.API_BASE_URL;
const API_KEY = CONFIG.API_KEY;
const API_ENDPOINTS = CONFIG.API_ENDPOINTS;

// Recipe submission functionality
document.addEventListener('DOMContentLoaded', function() {
    const recipeForm = document.getElementById('recipeForm');
    const ingredientInput = document.getElementById('ingredientInput');
    const suggestions = document.getElementById('suggestions');
    const ingredientsTags = document.getElementById('ingredientsTags');
    const successModal = document.getElementById('successModal');
    const addAnotherBtn = document.getElementById('addAnotherBtn');
    
    let ingredients = [];
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
                !ingredients.includes(ingredient.name)
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
    
    // Add ingredient function
    function addIngredient(ingredient) {
        if (!ingredients.includes(ingredient)) {
            ingredients.push(ingredient);
            updateIngredientsDisplay();
        }
    }
    
    // Update ingredients display
    function updateIngredientsDisplay() {
        ingredientsTags.innerHTML = ingredients.map(ingredient => `
            <div class="ingredient-tag">
                <span>${ingredient}</span>
                <button type="button" class="remove-tag" onclick="removeIngredient('${ingredient}')">×</button>
            </div>
        `).join('');
    }
    
    // Remove ingredient function (global for onclick)
    window.removeIngredient = function(ingredient) {
        ingredients = ingredients.filter(item => item !== ingredient);
        updateIngredientsDisplay();
    };
    
    // Handle Enter key to add ingredient
    ingredientInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const value = ingredientInput.value.trim();
            if (value && !ingredients.includes(value)) {
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
    
    // Handle form submission
    recipeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(recipeForm);
        const recipeData = {
            name: formData.get('recipeName'),
            mealType: formData.get('mealType'),
            ingredients: ingredients,
            preparationSteps: formData.get('preparationSteps'),
            submittedAt: new Date().toISOString()
        };
        
        // Validate form
        if (!recipeData.name || !recipeData.mealType || ingredients.length === 0 || !recipeData.preparationSteps) {
            alert('Please fill in all required fields and add at least one ingredient.');
            return;
        }
        
        // Simulate form submission
        submitRecipe(recipeData);
    });
    
    // Submit recipe function
    async function submitRecipe(recipeData) {
        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        try {
            // Submit to PHP backend
            const response = await fetch('submit-recipe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipeData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Recipe submitted successfully:', result);
                
                // Reset form
                recipeForm.reset();
                ingredients = [];
                updateIngredientsDisplay();
                
                // Show success modal
                successModal.classList.add('show');
            } else {
                throw new Error(result.error || 'Submission failed');
            }
        } catch (error) {
            console.error('Error submitting recipe:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Error submitting recipe: ';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage += 'Cannot connect to server. Make sure you are running this through a web server (http://localhost) and not opening the file directly.';
            } else {
                errorMessage += error.message;
            }
            
            alert(errorMessage);
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Handle "Add Another Recipe" button
    addAnotherBtn.addEventListener('click', function() {
        successModal.classList.remove('show');
        // Form is already reset, just focus on recipe name
        document.getElementById('recipeName').focus();
    });
    
    // Close modal when clicking outside
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            successModal.classList.remove('show');
        }
    });
    
    // Add some sample data for demonstration
    function addSampleData() {
        // Add sample ingredient
        ingredients = ['Salmon (Seafood)'];
        updateIngredientsDisplay();
        
        // Set sample form data
        document.getElementById('recipeName').value = 'Sample';
        document.getElementById('mealType').value = 'breakfast';
        document.getElementById('preparationSteps').value = 'One\nTwo\nThree';
    }
    
    // Uncomment the line below to add sample data for testing
    // addSampleData();
}); 
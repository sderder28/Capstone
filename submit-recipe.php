<?php
// Recipe submission handler for SavrChef
// This file handles POST requests from the submit-recipe form

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Include database configuration
require_once 'database/config.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate required fields
    $required_fields = ['name', 'mealType', 'ingredients', 'preparationSteps'];
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Validate meal type
    $valid_meal_types = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
    if (!in_array($input['mealType'], $valid_meal_types)) {
        throw new Exception('Invalid meal type');
    }
    
    // Validate ingredients array
    if (!is_array($input['ingredients']) || empty($input['ingredients'])) {
        throw new Exception('Ingredients must be a non-empty array');
    }
    
    // Sanitize and prepare data
    $name = trim($input['name']);
    $meal_type = $input['mealType'];
    $ingredients = json_encode($input['ingredients']); // Store as JSON
    $preparation_steps = trim($input['preparationSteps']);
    
    // Additional validation
    if (strlen($name) > 255) {
        throw new Exception('Recipe name is too long (max 255 characters)');
    }
    
    if (strlen($preparation_steps) > 65535) {
        throw new Exception('Preparation steps are too long');
    }
    
    // Get database connection
    $pdo = getDBConnection();
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Prepare and execute the insert statement
    $sql = "INSERT INTO recipes (name, meal_type, ingredients, preparation_steps) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    
    $result = $stmt->execute([
        $name,
        $meal_type,
        $ingredients,
        $preparation_steps
    ]);
    
    if ($result) {
        $recipe_id = $pdo->lastInsertId();
        
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Recipe submitted successfully',
            'recipe_id' => $recipe_id,
            'submitted_at' => date('Y-m-d H:i:s')
        ]);
    } else {
        throw new Exception('Failed to insert recipe into database');
    }
    
} catch (Exception $e) {
    // Log error for debugging
    error_log("Recipe submission error: " . $e->getMessage());
    
    // Return error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 
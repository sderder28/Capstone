<?php
// Database configuration for SavrChef


define('DB_HOST', 'localhost');     
define('DB_NAME', 'savrchef');     
define('DB_USER', 'root');          
define('DB_PASS', '');              
define('DB_CHARSET', 'utf8mb4');    

// Create database connection
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        
        // Set PDO error mode to exception
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Set default fetch mode to associative array
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        return $pdo;
    } catch(PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return false;
    }
}

// Test database connection
function testDBConnection() {
    $pdo = getDBConnection();
    if ($pdo) {
        echo "Database connection successful!";
        return true;
    } else {
        echo "Database connection failed!";
        return false;
    }
}

// Uncomment the line below to test the database connection
// testDBConnection();
?> 
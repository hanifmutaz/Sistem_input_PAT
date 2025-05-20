<?php
// Database connection configuration
$host = "sql205.infinityfree.com";
$username = "if0_39020775";
$password = "Aq1MBOT16hxAsf";
$database = "if0_39020775_pat2025";

// Create connection with database selected
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to UTF-8
$conn->set_charset("utf8");

// Create tables if they don't exist
$sql = "CREATE TABLE IF NOT EXISTS users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    nama VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    jabatan VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY (nama, jabatan)
)";
if ($conn->query($sql) !== TRUE) {
    die("Error creating users table: " . $conn->error);
}

$sql = "CREATE TABLE IF NOT EXISTS penilaian_data (
    id INT(11) NOT NULL AUTO_INCREMENT,
    timestamp DATETIME NOT NULL,
    guru VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) NOT NULL, 
    subkategori VARCHAR(50) NOT NULL,
    nilai INT(11) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (guru),
    INDEX (kategori),
    INDEX (timestamp)
)";
if ($conn->query($sql) !== TRUE) {
    die("Error creating penilaian_data table: " . $conn->error);
}

// Check if admin user exists, if not create one
$checkAdmin = "SELECT * FROM users WHERE jabatan = 'admin' LIMIT 1";
$result = $conn->query($checkAdmin);
if ($result->num_rows == 0) {
    $hashedPassword = password_hash('lupa12345', PASSWORD_DEFAULT);
    $insertAdmin = "INSERT INTO users (nama, password, jabatan) 
                    VALUES ('Administrator', '$hashedPassword', 'admin')";
    if ($conn->query($insertAdmin) !== TRUE) {
        die("Error creating admin user: " . $conn->error);
    }
}

// Function to create or update default user by jabatan
function createDefaultUser($conn, $nama, $jabatan, $password) {
    $checkUser = "SELECT * FROM users WHERE nama = ? AND jabatan = ? LIMIT 1";
    $stmt = $conn->prepare($checkUser);
    $stmt->bind_param("ss", $nama, $jabatan);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    if ($result->num_rows == 0) {
        // Create new user
        $insertUser = "INSERT INTO users (nama, password, jabatan) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($insertUser);
        $stmt->bind_param("sss", $nama, $hashedPassword, $jabatan);
        return $stmt->execute();
    } else {
        // User exists, no need to update
        return true;
    }
}

// Create default users if needed
createDefaultUser($conn, "Default Guru", "guru", "guru123");
createDefaultUser($conn, "Default Wali", "wali", "guru123");
?>
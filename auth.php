<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

// Function to sanitize input
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Set security headers
header("X-XSS-Protection: 1; mode=block");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("Content-Security-Policy: default-src 'self'");

// Handle login requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputData = file_get_contents('php://input');
    $data = json_decode($inputData, true);
    
    if (!isset($data['action'])) {
        echo json_encode(['success' => false, 'message' => 'Action not specified']);
        exit;
    }
    
    // Login process
    if ($data['action'] === 'login') {
        $namaGuru = isset($data['namaGuru']) ? $conn->real_escape_string(sanitizeInput($data['namaGuru'])) : '';
        $password = isset($data['password']) ? $data['password'] : '';
        $jabatan = isset($data['jabatan']) ? $conn->real_escape_string(sanitizeInput($data['jabatan'])) : '';
        
        // Validate inputs
        if (empty($namaGuru) || empty($password) || empty($jabatan)) {
            echo json_encode(['success' => false, 'message' => 'Semua field harus diisi']);
            exit;
        }
        
        // Special case for admin login
        if ($jabatan === 'admin') {
            $stmt = $conn->prepare("SELECT * FROM users WHERE jabatan = 'admin' LIMIT 1");
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                if (password_verify($password, $user['password'])) {
                    // Update last login time
                    $updateStmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
                    $updateStmt->bind_param("i", $user['id']);
                    $updateStmt->execute();
                    
                    $_SESSION['user'] = [
                        'id' => $user['id'],
                        'nama' => $user['nama'],
                        'jabatan' => 'admin',
                        'timestamp' => time()
                    ];
                    echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
                    exit;
                }
            }
            
            // Admin login failed
            echo json_encode(['success' => false, 'message' => 'Username atau password admin salah']);
            exit;
        } else {
            // Regular user login (guru or wali)
            $stmt = $conn->prepare("SELECT * FROM users WHERE nama = ? AND jabatan = ?");
            $stmt->bind_param("ss", $namaGuru, $jabatan);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                if (password_verify($password, $user['password'])) {
                    // Update last login time
                    $updateStmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
                    $updateStmt->bind_param("i", $user['id']);
                    $updateStmt->execute();
                    
                    $_SESSION['user'] = [
                        'id' => $user['id'],
                        'nama' => $user['nama'],
                        'jabatan' => $user['jabatan'],
                        'timestamp' => time()
                    ];
                    echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
                    exit;
                } else {
                    echo json_encode(['success' => false, 'message' => 'Password salah']);
                    exit;
                }
            } else {
                // Check if it's a default account using default password
                $defaultPassword = "guru123";
                
                if ($password === $defaultPassword) {
                    // Create new user with this password
                    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                    $stmt = $conn->prepare("INSERT INTO users (nama, password, jabatan) VALUES (?, ?, ?)");
                    $stmt->bind_param("sss", $namaGuru, $hashedPassword, $jabatan);
                    
                    if ($stmt->execute()) {
                        $_SESSION['user'] = [
                            'id' => $conn->insert_id,
                            'nama' => $namaGuru,
                            'jabatan' => $jabatan,
                            'timestamp' => time()
                        ];
                        echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
                        exit;
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Gagal membuat user baru: ' . $conn->error]);
                        exit;
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'Akun tidak ditemukan. Gunakan password default "guru123"']);
                    exit;
                }
            }
        }
    }
    
    // Logout process
    if ($data['action'] === 'logout') {
        session_unset();
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
        exit;
    }
    
    // Check session validity
    if ($data['action'] === 'checkSession') {
        if (isset($_SESSION['user'])) {
            // Using a 2-hour (7200 seconds) session timeout
            if (time() - $_SESSION['user']['timestamp'] < 7200) {
                // Update timestamp to extend session
                $_SESSION['user']['timestamp'] = time();
                echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
                exit;
            } else {
                // Session expired
                session_unset();
                session_destroy();
                echo json_encode(['success' => false, 'message' => 'Sesi Anda telah berakhir. Silakan login kembali']);
                exit;
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Belum login']);
            exit;
        }
    }
}

// If we get here, it's a bad request
header('HTTP/1.1 400 Bad Request');
echo json_encode(['success' => false, 'message' => 'Invalid request method or action']);
exit;
?>
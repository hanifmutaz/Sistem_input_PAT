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

        if (empty($namaGuru) || empty($password) || empty($jabatan)) {
            echo json_encode(['success' => false, 'message' => 'Semua field harus diisi']);
            exit;
        }

        if ($jabatan === 'admin') {
            $stmt = $conn->prepare("SELECT * FROM users WHERE jabatan = 'admin' LIMIT 1");
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                if (password_verify($password, $user['password'])) {
                    if ($user['must_change_password']) {
                        echo json_encode([
                            'success' => false,
                            'requirePasswordChange' => true,
                            'userId' => $user['id'],
                            'message' => 'Password harus diganti sebelum login'
                        ]);
                        exit;
                    }

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

            echo json_encode(['success' => false, 'message' => 'Username atau password admin salah']);
            exit;
        } else {
            $stmt = $conn->prepare("SELECT * FROM users WHERE nama = ? AND jabatan = ?");
            $stmt->bind_param("ss", $namaGuru, $jabatan);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                if (password_verify($password, $user['password'])) {
                    if ($user['must_change_password']) {
                        echo json_encode([
                            'success' => false,
                            'requirePasswordChange' => true,
                            'userId' => $user['id'],
                            'message' => 'Password harus diganti sebelum login'
                        ]);
                        exit;
                    }

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
                echo json_encode(['success' => false, 'message' => 'Akun tidak ditemukan']);
                exit;
            }
        }
    }

    // Change password process
    if ($data['action'] === 'changePassword') {
        $userId = isset($data['userId']) ? intval($data['userId']) : 0;
        $currentPassword = $data['currentPassword'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        if (!$userId || !$currentPassword || !$newPassword) {
            echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
            exit;
        }

        $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            if (password_verify($currentPassword, $user['password'])) {
                $hashed = password_hash($newPassword, PASSWORD_DEFAULT);
                $update = $conn->prepare("UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?");
                $update->bind_param("si", $hashed, $userId);
                if ($update->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Password berhasil diperbarui']);
                    exit;
                } else {
                    echo json_encode(['success' => false, 'message' => 'Gagal memperbarui password']);
                    exit;
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Password saat ini salah']);
                exit;
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
            exit;
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
            if (time() - $_SESSION['user']['timestamp'] < 7200) {
                $_SESSION['user']['timestamp'] = time();
                echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
                exit;
            } else {
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

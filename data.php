<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

// Function to sanitize input
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Check if user is logged in
if (!isset($_SESSION['user'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'Silakan login terlebih dahulu']);
    exit;
}

// Handle data operations
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputData = file_get_contents('php://input');
    $data = json_decode($inputData, true);
    
    if (!isset($data['action'])) {
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Action tidak ditentukan']);
        exit;
    }
    
    // Save form data
    if ($data['action'] === 'saveData') {
        $guru = $conn->real_escape_string($_SESSION['user']['nama']);
        $currentTime = date('Y-m-d H:i:s');
        
        // Validate all numeric fields
        $validFields = ['membuatSoal', 'editSoal', 'koreksiDiniyah', 'koreksiLokal', 
                      'koreksiDiknas', 'raportAlQuran', 'raportP5', 'menulisRaport', 'mengawasUjian'];
        
        foreach ($validFields as $field) {
            if (isset($data[$field])) {
                $value = intval($data[$field]);
                if ($value < 0 || $value > 1000) {
                    echo json_encode(['success' => false, 'message' => "Nilai $field harus antara 0-1000"]);
                    exit;
                }
            }
        }
        
        // Define entries to save in a structured format
        $entries = [
            // Pembuatan Soal
            ['pembuatan', 'membuatSoal', isset($data['membuatSoal']) ? intval($data['membuatSoal']) : 0],
            ['pembuatan', 'editSoal', isset($data['editSoal']) ? intval($data['editSoal']) : 0],
            
            // Koreksi
            ['koreksi', 'diniyah', isset($data['koreksiDiniyah']) ? intval($data['koreksiDiniyah']) : 0],
            ['koreksi', 'lokal', isset($data['koreksiLokal']) ? intval($data['koreksiLokal']) : 0],
            ['koreksi', 'diknas', isset($data['koreksiDiknas']) ? intval($data['koreksiDiknas']) : 0],
            
            // Raport
            ['raport', 'alQuran', isset($data['raportAlQuran']) ? intval($data['raportAlQuran']) : 0],
            ['raport', 'p5', isset($data['raportP5']) ? intval($data['raportP5']) : 0],
            ['raport', 'menulis', isset($data['menulisRaport']) ? intval($data['menulisRaport']) : 0],
            
            // Lain-lain
            ['lain', 'mengawasUjian', isset($data['mengawasUjian']) ? intval($data['mengawasUjian']) : 0]
        ];
        
        $conn->begin_transaction(); // Start transaction for data integrity
        try {
            $success = true;
            $stmt = $conn->prepare("INSERT INTO penilaian_data (timestamp, guru, kategori, subkategori, nilai) VALUES (?, ?, ?, ?, ?)");
            
            foreach ($entries as $entry) {
                $stmt->bind_param("ssssi", $currentTime, $guru, $entry[0], $entry[1], $entry[2]);
                if (!$stmt->execute()) {
                    throw new Exception($conn->error);
                }
            }
            
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Data berhasil disimpan']);
        } catch (Exception $e) {
            $conn->rollback();
            error_log('SQL Error: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Gagal menyimpan data: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // Get all data (admin only)
    if ($data['action'] === 'getData') {
        if ($_SESSION['user']['jabatan'] !== 'admin') {
            http_response_code(403); // Forbidden
            echo json_encode(['success' => false, 'message' => 'Anda tidak memiliki akses untuk melihat semua data']);
            exit;
        }
        
        try {
            $sql = "SELECT id, timestamp, guru, kategori, subkategori, nilai FROM penilaian_data ORDER BY timestamp DESC, guru ASC";
            $result = $conn->query($sql);
            
            $dataArray = [];
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $dataArray[] = [
                        'id' => $row['id'],
                        'timestamp' => $row['timestamp'],
                        'guru' => sanitizeInput($row['guru']),
                        'kategori' => sanitizeInput($row['kategori']),
                        'subkategori' => sanitizeInput($row['subkategori']),
                        'nilai' => intval($row['nilai'])
                    ];
                }
            }
            
            echo json_encode(['success' => true, 'data' => $dataArray]);
        } catch (Exception $e) {
            error_log('SQL Error: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan saat mengambil data']);
        }
        exit;
    }
    
    // Delete entry (admin only)
    if ($data['action'] === 'deleteEntry') {
        if ($_SESSION['user']['jabatan'] !== 'admin') {
            http_response_code(403); // Forbidden
            echo json_encode(['success' => false, 'message' => 'Anda tidak memiliki akses untuk menghapus data']);
            exit;
        }
        
        if (!isset($data['id']) || !is_numeric($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'ID data tidak valid']);
            exit;
        }
        
        try {
            $id = intval($data['id']);
            $stmt = $conn->prepare("DELETE FROM penilaian_data WHERE id = ?");
            $stmt->bind_param("i", $id);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    echo json_encode(['success' => true, 'message' => 'Data berhasil dihapus']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Data tidak ditemukan']);
                }
            } else {
                throw new Exception($conn->error);
            }
        } catch (Exception $e) {
            error_log('SQL Error: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus data: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // Delete all data (admin only)
    if ($data['action'] === 'deleteAllData') {
        if ($_SESSION['user']['jabatan'] !== 'admin') {
            http_response_code(403); // Forbidden
            echo json_encode(['success' => false, 'message' => 'Anda tidak memiliki akses untuk menghapus semua data']);
            exit;
        }
        
        try {
            $sql = "TRUNCATE TABLE penilaian_data";
            if ($conn->query($sql) === TRUE) {
                echo json_encode(['success' => true, 'message' => 'Semua data berhasil dihapus']);
            } else {
                throw new Exception($conn->error);
            }
        } catch (Exception $e) {
            error_log('SQL Error: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus data: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // Export data (admin only)
    if ($data['action'] === 'exportData') {
        if ($_SESSION['user']['jabatan'] !== 'admin') {
            http_response_code(403); // Forbidden
            echo json_encode(['success' => false, 'message' => 'Anda tidak memiliki akses untuk mengekspor data']);
            exit;
        }
        
        try {
            $sql = "SELECT timestamp, guru, kategori, subkategori, nilai FROM penilaian_data ORDER BY timestamp DESC, guru ASC";
            $result = $conn->query($sql);
            
            $dataArray = [];
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $dataArray[] = [
                        'Tanggal' => date('d-m-Y H:i', strtotime($row['timestamp'])),
                        'Guru' => sanitizeInput($row['guru']),
                        'Kategori' => sanitizeInput($row['kategori']),
                        'Subkategori' => sanitizeInput($row['subkategori']),
                        'Nilai' => intval($row['nilai'])
                    ];
                }
                echo json_encode(['success' => true, 'data' => $dataArray]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Tidak ada data untuk diekspor']);
            }
        } catch (Exception $e) {
            error_log('SQL Error: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan saat mengekspor data']);
        }
        exit;
    }
    
    // Get summary report data (admin only)
    if ($data['action'] === 'getSummaryData') {
        if ($_SESSION['user']['jabatan'] !== 'admin') {
            http_response_code(403); // Forbidden
            echo json_encode(['success' => false, 'message' => 'Anda tidak memiliki akses untuk melihat ringkasan data']);
            exit;
        }
        
        try {
            $sql = "SELECT guru, kategori, subkategori, SUM(nilai) as total_nilai 
                   FROM penilaian_data 
                   GROUP BY guru, kategori, subkategori 
                   ORDER BY guru ASC, kategori ASC, subkategori ASC";
            $result = $conn->query($sql);
            
            $dataArray = [];
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $dataArray[] = [
                        'guru' => sanitizeInput($row['guru']),
                        'kategori' => sanitizeInput($row['kategori']),
                        'subkategori' => sanitizeInput($row['subkategori']),
                        'total_nilai' => intval($row['total_nilai'])
                    ];
                }
            }
            
            echo json_encode(['success' => true, 'data' => $dataArray]);
        } catch (Exception $e) {
            error_log('SQL Error: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan saat mengambil ringkasan data']);
        }
        exit;
    }
}

// If we get here, it's a bad request
http_response_code(400); // Bad Request
echo json_encode(['success' => false, 'message' => 'Invalid request method or action']);
exit;
?>
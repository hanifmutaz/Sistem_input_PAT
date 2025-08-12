<?php
require_once 'config.php';

$nama = 'Administrator';
$jabatan = 'admin';

$tempPassword = bin2hex(random_bytes(4));
$hashed = password_hash($tempPassword, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO users (nama, password, jabatan, must_change_password) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE password = VALUES(password), must_change_password = 1");
$stmt->bind_param("sss", $nama, $hashed, $jabatan);

if ($stmt->execute()) {
    echo "Admin account initialized.\n";
    echo "Username: {$nama}\n";
    echo "Temporary Password: {$tempPassword}\n";
    echo "Please login and change this password immediately.\n";
} else {
    echo "Error creating admin user: " . $conn->error . "\n";
}
?>

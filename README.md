# Sistem Input PAT

## Konfigurasi Database
1. Salin berkas `.env.example` menjadi `.env`.
2. Isi nilai `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, dan `DB_DATABASE` sesuai kredensial database Anda.

## Inisialisasi Akun Admin
1. Jalankan skrip berikut untuk membuat akun admin dengan password sementara:
   ```bash
   php init_admin.php
   ```
2. Skrip akan menampilkan password sementara di terminal. Gunakan password tersebut untuk login pertama kali dengan jabatan **admin**.
3. Saat mencoba login, sistem akan menolak dan meminta perubahan password.
4. Ubah password dengan mengirim permintaan POST ke `auth.php`:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"action":"changePassword","userId":1,"currentPassword":"<temp_pass>","newPassword":"<new_pass>"}' \
     http://example.com/auth.php
   ```
   Ganti `userId`, `temp_pass`, dan `new_pass` sesuai kebutuhan.

Setelah password diganti, login kembali menggunakan password baru.

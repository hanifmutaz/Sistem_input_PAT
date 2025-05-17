document.addEventListener('DOMContentLoaded', function() {
    // Event listener untuk form login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }

    // Event listener untuk tombol tampilkan/sembunyikan password
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
        });
    }

    // Periksa apakah sudah login
    checkSession();
});

// Fungsi untuk login
function login() {
    // Tampilkan loader pada tombol login
    const loginButton = document.querySelector('.btn-login');
    loginButton.classList.add('loading');
    
    // Sembunyikan pesan error dan sukses
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginSuccess').style.display = 'none';
    
    // Ambil data dari form
    const namaGuru = document.getElementById('namaGuru').value.trim();
    const password = document.getElementById('password').value;
    const jabatan = document.getElementById('jabatan').value;
    
    // Validasi data
    if (!namaGuru || !password || !jabatan) {
        showMessage('loginError', 'Semua field harus diisi');
        loginButton.classList.remove('loading');
        return;
    }
    
    // Kirim permintaan login ke server
    fetch('auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'login',
            namaGuru: namaGuru,
            password: password,
            jabatan: jabatan
        })
    })
    .then(response => response.json())
    .then(data => {
        // Hilangkan loader pada tombol login
        loginButton.classList.remove('loading');
        
        if (data.success) {
            // Jika login berhasil, tampilkan pesan sukses dan arahkan ke halaman dashboard
            showMessage('loginSuccess', 'Login berhasil! Anda akan dialihkan...');
            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            // Jika login gagal, tampilkan pesan error
            showMessage('loginError', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Hilangkan loader pada tombol login
        loginButton.classList.remove('loading');
        // Tampilkan pesan error
        showMessage('loginError', 'Terjadi kesalahan saat login. Silakan coba lagi nanti.');
    });
}

// Fungsi untuk memeriksa session
function checkSession() {
    // Kirim permintaan ke server untuk memeriksa session
    fetch('auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'checkSession'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Jika session valid, arahkan ke halaman dashboard
            window.location.href = 'dashboard.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Jika terjadi kesalahan, anggap belum login dan tetap di halaman login
    });
}

// Fungsi untuk menampilkan pesan
function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    
    // Sembunyikan pesan setelah 5 detik
    if (elementId === 'loginError') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}
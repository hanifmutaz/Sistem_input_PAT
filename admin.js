document.addEventListener('DOMContentLoaded', function() {
    // Periksa apakah sudah login
    checkSession();

    // Event listener untuk tombol logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Event listener untuk tab di halaman admin
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Event listener untuk tombol export CSV
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    // Event listener untuk tombol hapus semua data
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', function() {
            showDeleteConfirmModal();
        });
    }

    // Event listener untuk tombol batal di modal konfirmasi
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            hideDeleteConfirmModal();
        });
    }

    // Event listener untuk tombol konfirmasi di modal konfirmasi
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            deleteAllData();
            hideDeleteConfirmModal();
        });
    }

    // Event listener untuk form perubahan password admin
    const adminPasswordForm = document.getElementById('adminPasswordForm');
    if (adminPasswordForm) {
        adminPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateAdminPassword();
        });
    }

    // Event listener untuk form pengaturan nilai insentif
    const insentifSettingsForm = document.getElementById('insentifSettingsForm');
    if (insentifSettingsForm) {
        insentifSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateInsentifSettings();
        });
    }

    // Muat pengaturan nilai insentif saat halaman dimuat
    loadInsentifSettings();
});

// Fungsi untuk memeriksa session
function checkSession() {
    // Tampilkan loader pada tombol logout
    document.getElementById('logoutBtn').classList.add('loading');
    
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
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Hilangkan loader pada tombol logout
        document.getElementById('logoutBtn').classList.remove('loading');
        
        if (data.success) {
            // Jika session valid, tampilkan nama dan jabatan user
            if (data.user.jabatan !== 'admin') {
                // Jika bukan admin, arahkan ke dashboard
                window.location.href = 'dashboard.html';
            }
            document.getElementById('userName').textContent = data.user.nama;
            loadAllData();
            loadSummaryData();
        } else {
            // Jika session tidak valid, arahkan ke halaman login
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Hilangkan loader pada tombol logout
        document.getElementById('logoutBtn').classList.remove('loading');
        // Arahkan ke halaman login jika terjadi kesalahan
        window.location.href = 'index.html';
    });
}

// Fungsi untuk logout
function logout() {
    // Tampilkan loader pada tombol logout
    document.getElementById('logoutBtn').classList.add('loading');
    
    // Kirim permintaan ke server untuk logout
    fetch('auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'logout'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Hilangkan loader pada tombol logout
        document.getElementById('logoutBtn').classList.remove('loading');
        
        if (data.success) {
            // Jika logout berhasil, arahkan ke halaman login
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Hilangkan loader pada tombol logout
        document.getElementById('logoutBtn').classList.remove('loading');
        alert('Terjadi kesalahan saat logout. Silakan coba lagi.');
    });
}

// Fungsi untuk memuat pengaturan nilai insentif
function loadInsentifSettings() {
    // Kirim permintaan ke server untuk mendapatkan pengaturan nilai insentif
    fetch('data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'getInsentifSettings'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Jika berhasil, isi form pengaturan dengan data yang diterima
            document.getElementById('membuatSoalNilai').value = data.settings.membuat_soal || 0;
            document.getElementById('editSoalNilai').value = data.settings.edit_soal || 0;
            document.getElementById('koreksiDiniyahNilai').value = data.settings.koreksi_diniyah || 0;
            document.getElementById('koreksiLokalNilai').value = data.settings.koreksi_lokal || 0;
            document.getElementById('koreksiDiknasNilai').value = data.settings.koreksi_diknas || 0;
            document.getElementById('raportAlQuranNilai').value = data.settings.raport_alquran || 0;
            document.getElementById('raportP5Nilai').value = data.settings.raport_p5 || 0;
            document.getElementById('menulisRaportNilai').value = data.settings.menulis_raport || 0;
            document.getElementById('mengawasUjianNilai').value = data.settings.mengawas_ujian || 0;
        } else {
            // Jika gagal, tampilkan pesan error
            showFormMessage('settingsError', data.message || 'Gagal memuat pengaturan nilai insentif.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Tampilkan pesan error
        showFormMessage('settingsError', 'Terjadi kesalahan saat memuat pengaturan nilai insentif. Silakan coba lagi nanti.');
    });
}

// Fungsi untuk memperbarui pengaturan nilai insentif
function updateInsentifSettings() {
    // Tampilkan loader pada tombol submit
    const submitBtn = document.querySelector('#insentifSettingsForm .btn-primary');
    submitBtn.classList.add('loading');
    
    // Ambil data dari form
    const settingsData = {
        action: 'updateInsentifSettings',
        membuat_soal: parseInt(document.getElementById('membuatSoalNilai').value) || 0,
        edit_soal: parseInt(document.getElementById('editSoalNilai').value) || 0,
        koreksi_diniyah: parseInt(document.getElementById('koreksiDiniyahNilai').value) || 0,
        koreksi_lokal: parseInt(document.getElementById('koreksiLokalNilai').value) || 0,
        koreksi_diknas: parseInt(document.getElementById('koreksiDiknasNilai').value) || 0,
        raport_alquran: parseInt(document.getElementById('raportAlQuranNilai').value) || 0,
        raport_p5: parseInt(document.getElementById('raportP5Nilai').value) || 0,
        menulis_raport: parseInt(document.getElementById('menulisRaportNilai').value) || 0,
        mengawas_ujian: parseInt(document.getElementById('mengawasUjianNilai').value) || 0
    };
    
    // Validasi data sebelum dikirim
    const isValid = Object.entries(settingsData).every(([key, value]) => {
        if (key !== 'action' && (isNaN(value) || value < 0)) {
            showFormMessage('settingsError', `Nilai ${key} harus berupa angka positif`);
            return false;
        }
        return true;
    });
    
    if (!isValid) {
        submitBtn.classList.remove('loading');
        return;
    }
    
    // Kirim data ke server
    fetch('data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Hilangkan loader pada tombol submit
        submitBtn.classList.remove('loading');
        
        if (data.success) {
            // Jika berhasil, tampilkan pesan sukses
            showFormMessage('settingsSuccess', data.message || 'Pengaturan nilai insentif berhasil diperbarui.');
        } else {
            // Jika gagal, tampilkan pesan error
            showFormMessage('settingsError', data.message || 'Gagal memperbarui pengaturan nilai insentif.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Hilangkan loader pada tombol submit
        submitBtn.classList.remove('loading');
        // Tampilkan pesan error
        showFormMessage('settingsError', 'Terjadi kesalahan saat memperbarui pengaturan nilai insentif. Silakan coba lagi nanti.');
    });
}

// Fungsi untuk memperbarui password admin
function updateAdminPassword() {
    // Tampilkan loader pada tombol submit
    const submitBtn = document.querySelector('#adminPasswordForm .btn-primary');
    submitBtn.classList.add('loading');
    
    // Ambil data dari form
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validasi data sebelum dikirim
    if (!currentPassword || !newPassword || !confirmPassword) {
        showFormMessage('passwordError', 'Semua field harus diisi');
        submitBtn.classList.remove('loading');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showFormMessage('passwordError', 'Password baru dan konfirmasi password tidak cocok');
        submitBtn.classList.remove('loading');
        return;
    }
    
    // Kirim data ke server
    fetch('auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'updateAdminPassword',
            currentPassword: currentPassword,
            newPassword: newPassword
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Hilangkan loader pada tombol submit
        submitBtn.classList.remove('loading');
        
        if (data.success) {
            // Jika berhasil, tampilkan pesan sukses dan reset form
            showFormMessage('passwordSuccess', data.message || 'Password berhasil diperbarui.');
            document.getElementById('adminPasswordForm').reset();
        } else {
            // Jika gagal, tampilkan pesan error
            showFormMessage('passwordError', data.message || 'Gagal memperbarui password.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Hilangkan loader pada tombol submit
        submitBtn.classList.remove('loading');
        // Tampilkan pesan error
        showFormMessage('passwordError', 'Terjadi kesalahan saat memperbarui password. Silakan coba lagi nanti.');
    });
}

// Fungsi untuk memuat semua data
function loadAllData() {
    // Kirim permintaan ke server untuk mendapatkan semua data
    fetch('data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'getData'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Jika berhasil, tampilkan data pada tabel
            renderDataTable(data.data);
        } else {
            // Jika gagal, tampilkan pesan error
            document.getElementById('tableBody').innerHTML = `<tr><td colspan="7" class="text-center">${data.message || 'Tidak ada data'}</td></tr>`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Tampilkan pesan error
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="7" class="text-center">Terjadi kesalahan saat memuat data. Silakan coba lagi nanti.</td></tr>';
    });
}

// Fungsi untuk memuat data ringkasan
function loadSummaryData() {
    // Kirim permintaan ke server untuk mendapatkan data ringkasan
    fetch('data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'getSummaryData'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Jika berhasil, tampilkan data pada tabel ringkasan
            renderSummaryTable(data.data);
        } else {
            // Jika gagal, tampilkan pesan error
            document.getElementById('summaryTableBody').innerHTML = `<tr><td colspan="7" class="text-center">${data.message || 'Tidak ada data ringkasan'}</td></tr>`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Tampilkan pesan error
        document.getElementById('summaryTableBody').innerHTML = '<tr><td colspan="7" class="text-center">Terjadi kesalahan saat memuat data ringkasan. Silakan coba lagi nanti.</td></tr>';
    });
}

// Fungsi untuk menampilkan data pada tabel
function renderDataTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>';
        return;
    }
    
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Format tanggal
        const dateTime = new Date(item.timestamp);
        const formattedDate = dateTime.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const formattedTime = dateTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formattedDate} ${formattedTime}</td>
            <td>${item.guru}</td>
            <td>${capitalizeFirstLetter(item.kategori)}</td>
            <td>${formatSubkategori(item.subkategori)}</td>
            <td>${item.nilai}</td>
            <td>
                <button class="btn-small btn-danger" onclick="deleteEntry(${item.id})">Hapus</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Fungsi untuk menampilkan data ringkasan pada tabel
function renderSummaryTable(data) {
    const summaryTableBody = document.getElementById('summaryTableBody');
    summaryTableBody.innerHTML = '';
    
    if (data.length === 0) {
        summaryTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>';
        return;
    }
    
    // Kelompokkan data berdasarkan guru
    const guruData = {};
    
    data.forEach(item => {
        if (!guruData[item.guru]) {
            guruData[item.guru] = {
                pembuatan: 0,
                koreksi: 0,
                raport: 0,
                lain: 0
            };
        }
        
        // Tambahkan nilai sesuai kategori
        if (item.kategori === 'pembuatan') {
            guruData[item.guru].pembuatan += parseInt(item.total_nilai);
        } else if (item.kategori === 'koreksi') {
            guruData[item.guru].koreksi += parseInt(item.total_nilai);
        } else if (item.kategori === 'raport') {
            guruData[item.guru].raport += parseInt(item.total_nilai);
        } else if (item.kategori === 'lain') {
            guruData[item.guru].lain += parseInt(item.total_nilai);
        }
    });
    
    // Tampilkan data pada tabel
    let index = 1;
    for (const guru in guruData) {
        const row = document.createElement('tr');
        const totalNilai = guruData[guru].pembuatan + guruData[guru].koreksi + guruData[guru].raport + guruData[guru].lain;
        
        row.innerHTML = `
            <td>${index}</td>
            <td>${guru}</td>
            <td>${guruData[guru].pembuatan}</td>
            <td>${guruData[guru].koreksi}</td>
            <td>${guruData[guru].raport}</td>
            <td>${guruData[guru].lain}</td>
            <td><strong>${totalNilai}</strong></td>
        `;
        
        summaryTableBody.appendChild(row);
        index++;
    }
}

// Fungsi untuk menghapus data
function deleteEntry(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        // Kirim permintaan ke server untuk menghapus data
        fetch('data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'deleteEntry',
                id: id
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Jika berhasil, muat ulang data
                loadAllData();
                loadSummaryData();
                alert(data.message || 'Data berhasil dihapus.');
            } else {
                // Jika gagal, tampilkan pesan error
                alert(data.message || 'Gagal menghapus data.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Tampilkan pesan error
            alert('Terjadi kesalahan saat menghapus data. Silakan coba lagi nanti.');
        });
    }
}

// Fungsi untuk menghapus semua data
function deleteAllData() {
    // Kirim permintaan ke server untuk menghapus semua data
    fetch('data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'deleteAllData'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Jika berhasil, muat ulang data
            loadAllData();
            loadSummaryData();
            alert(data.message || 'Semua data berhasil dihapus.');
        } else {
            // Jika gagal, tampilkan pesan error
            alert(data.message || 'Gagal menghapus semua data.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Tampilkan pesan error
        alert('Terjadi kesalahan saat menghapus semua data. Silakan coba lagi nanti.');
    });
}

// Fungsi untuk export data ke CSV
function exportData() {
    // Kirim permintaan ke server untuk mengekspor data
    fetch('data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'exportData'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Jika berhasil, buat file CSV
            const csvContent = convertToCSV(data.data);
            downloadCSV(csvContent, `insentif_pat_data_${getCurrentDate()}.csv`);
        } else {
            // Jika gagal, tampilkan pesan error
            alert(data.message || 'Gagal mengekspor data.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Tampilkan pesan error
        alert('Terjadi kesalahan saat mengekspor data. Silakan coba lagi nanti.');
    });
}

// Fungsi untuk mendapatkan tanggal saat ini dalam format YYYY-MM-DD
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Fungsi untuk mengkonversi data ke format CSV
function convertToCSV(data) {
    if (data.length === 0) {
        return '';
    }
    
    // Ambil header dari objek pertama
    const headers = Object.keys(data[0]);
    
    // Buat baris header
    let csv = headers.join(',') + '\n';
    
    // Tambahkan baris data
    data.forEach(row => {
        const values = headers.map(header => {
            const cellValue = row[header] !== null ? row[header] : '';
            // Escape nilai dengan quotes jika mengandung koma atau quote
            if (typeof cellValue === 'string' && (cellValue.includes(',') || cellValue.includes('"'))) {
                return `"${cellValue.replace(/"/g, '""')}"`;
            }
            return cellValue;
        });
        csv += values.join(',') + '\n';
    });
    
    return csv;
}

// Fungsi untuk mendownload file CSV
function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Jika browser mendukung URL.createObjectURL
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, fileName);
    } else {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Bebaskan sumber daya URL
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }
}

// Fungsi untuk menampilkan modal konfirmasi hapus semua data
function showDeleteConfirmModal() {
    document.getElementById('confirmDeleteModal').style.display = 'flex';
}

// Fungsi untuk menyembunyikan modal konfirmasi hapus semua data
function hideDeleteConfirmModal() {
    document.getElementById('confirmDeleteModal').style.display = 'none';
}

// Fungsi untuk beralih antara tab di halaman admin
function switchTab(tabId) {
    // Sembunyikan semua tab content
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // Hilangkan status aktif dari semua tab button
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Tampilkan tab content yang dipilih dan aktifkan tab button
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

// Fungsi untuk menampilkan pesan pada form
function showFormMessage(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    
    // Scroll ke elemen pesan
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Sembunyikan pesan setelah 5 detik
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Fungsi untuk mengkapitalisasi huruf pertama
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Fungsi untuk memformat subkategori
function formatSubkategori(subkategori) {
    if (!subkategori) return '';
    
    // Ubah format subkategori dari camelCase atau snake_case menjadi kalimat normal
    let formatted = subkategori
        // Untuk camelCase
        .replace(/([A-Z])/g, ' $1')
        // Untuk snake_case
        .replace(/_/g, ' ');
    
    return capitalizeFirstLetter(formatted.trim());
}
// assets/js/main.js

// ========== HAMBURGER MENU & DROPDOWN ==========
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Mobile dropdown toggle
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const dropbtn = dropdown.querySelector('.dropbtn');
        if (dropbtn) {
            dropbtn.addEventListener('click', function(e) {
                if (window.innerWidth <= 992) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });
    
    // Close menu when clicking a link (mobile)
    document.querySelectorAll('.nav-menu a, .dropdown-content a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                if (hamburger) hamburger.classList.remove('active');
                if (navMenu) navMenu.classList.remove('active');
            }
        });
    });
    
    // Set active nav link
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-menu > a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html') ||
            (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
});

// ========== JSONBin.io CONFIGURATION ==========
const API_KEY = "$2a$10$ySaKD0QvR.1AmJs8XSaefukNpo7ygh.Rq4KTzuTKTqzk9Ydb7yTuG";
const BIN_ID = "69f7e50c36566621a8200a47";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

async function loadData() {
    try {
        const response = await fetch(BASE_URL, { headers: { 'X-Master-Key': API_KEY } });
        const data = await response.json();
        return data.record;
    } catch (error) {
        console.error('Error loading data:', error);
        return { students: [], admin: {} };
    }
}

async function saveData(data) {
    try {
        await fetch(BASE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify(data)
        });
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

async function adminLogin(username, password) {
    const data = await loadData();
    if (data.admin && data.admin.username === username && data.admin.password === password) {
        localStorage.setItem('isAdminLoggedIn', 'true');
        return true;
    }
    return false;
}

function checkAdminAuth() {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (!isLoggedIn && window.location.pathname.includes('admin-dashboard.html')) {
        window.location.href = 'admin-login.html';
    }
    if (isLoggedIn && window.location.pathname.includes('admin-login.html')) {
        window.location.href = 'admin-dashboard.html';
    }
}

function logout() {
    localStorage.removeItem('isAdminLoggedIn');
    window.location.href = 'admin-login.html';
}

async function searchCertificate(course, serialNo, year) {
    const data = await loadData();
    const students = data.students || [];
    return students.find(student => 
        student.course === course && student.certSerial === serialNo && student.passYear === year
    );
}

function displayCertificate(student) {
    const resultDiv = document.getElementById('certificateResult');
    const detailsDiv = document.getElementById('certificateDetails');
    
    if (student) {
        detailsDiv.innerHTML = `
            <div class="detail-item"><div class="detail-label"><i class="fas fa-user"></i> শিক্ষার্থীর নাম</div><div class="detail-value">${student.fullName}</div></div>
            <div class="detail-item"><div class="detail-label"><i class="fas fa-id-card"></i> রোল নম্বর</div><div class="detail-value">${student.rollNo}</div></div>
            <div class="detail-item"><div class="detail-label"><i class="fas fa-qrcode"></i> ইউনিক আইডি</div><div class="detail-value">${student.uniqueId}</div></div>
            <div class="detail-item"><div class="detail-label"><i class="fas fa-book"></i> কোর্সের নাম</div><div class="detail-value">${student.course}</div></div>
            <div class="detail-item"><div class="detail-label"><i class="fas fa-hourglass-half"></i> মেয়াদকাল</div><div class="detail-value">${student.duration}</div></div>
            <div class="detail-item"><div class="detail-label"><i class="fas fa-star"></i> ফলাফল</div><div class="detail-value"><span class="status-badge">${student.result}</span></div></div>
            <div class="detail-item"><div class="detail-label"><i class="fas fa-barcode"></i> সিরিয়াল নম্বর</div><div class="detail-value">${student.certSerial}</div></div>
        `;
        resultDiv.style.display = 'block';
        showAlert('✅ বৈধ সার্টিফিকেট পাওয়া গেছে!', 'success');
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    } else {
        resultDiv.style.display = 'none';
        showAlert('❌ কোনো সার্টিফিকেট পাওয়া যায়নি। সঠিক তথ্য দিন।', 'error');
    }
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.innerHTML = message;
        alertDiv.className = `alert ${type}`;
        setTimeout(() => { alertDiv.style.display = 'none'; }, 5000);
    }
}

async function addStudent(studentData) {
    const data = await loadData();
    if (!data.students) data.students = [];
    
    const exists = data.students.find(s => s.certSerial === studentData.certSerial);
    if (exists) {
        showDashboardAlert('এই সিরিয়াল নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে!', 'error');
        return false;
    }
    
    data.students.push(studentData);
    await saveData(data);
    showDashboardAlert('শিক্ষার্থীর তথ্য সংরক্ষিত হয়েছে!', 'success');
    loadStudentsList();
    updateStats();
    return true;
}

async function loadStudentsList() {
    const data = await loadData();
    const students = data.students || [];
    const tbody = document.getElementById('studentsList');
    
    if (tbody) {
        tbody.innerHTML = students.map((student, index) => `
            <tr>
                <td>${student.fullName}</td>
                <td><strong>${student.certSerial}</strong></td>
                <td>${student.course}</td>
                <td>${student.passYear}</td>
                <td>${student.result}</td>
                <td><button onclick="deleteStudent(${index})" class="delete-btn"><i class="fas fa-trash"></i> ডিলিট</button></td>
            </tr>
        `).join('');
    }
}

async function deleteStudent(index) {
    if (confirm('আপনি কি এই শিক্ষার্থীর তথ্য ডিলিট করতে চান?')) {
        const data = await loadData();
        data.students.splice(index, 1);
        await saveData(data);
        loadStudentsList();
        updateStats();
        showDashboardAlert('তথ্য ডিলিট করা হয়েছে!', 'success');
    }
}

async function updateStats() {
    const data = await loadData();
    const students = data.students || [];
    const totalEl = document.getElementById('totalStudents');
    const totalCertEl = document.getElementById('totalCertificates');
    if (totalEl) totalEl.textContent = students.length;
    if (totalCertEl) totalCertEl.textContent = students.length;
}

function showDashboardAlert(message, type) {
    const alertDiv = document.getElementById('dashboardAlert');
    if (alertDiv) {
        alertDiv.innerHTML = message;
        alertDiv.className = `alert ${type}`;
        setTimeout(() => { alertDiv.style.display = 'none'; }, 5000);
    }
}

// Page specific initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const course = document.getElementById('course').value;
            const serialNo = document.getElementById('serialNo').value;
            const year = document.getElementById('year').value;
            if (!course || !serialNo || !year) {
                showAlert('সব ক্ষেত্র পূরণ করুন!', 'error');
                return;
            }
            const result = await searchCertificate(course, serialNo, year);
            displayCertificate(result);
        });
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (await adminLogin(username, password)) {
                window.location.href = 'admin-dashboard.html';
            } else {
                const alertDiv = document.getElementById('loginAlert');
                alertDiv.innerHTML = 'ভুল ইউজারনেম বা পাসওয়ার্ড!';
                alertDiv.className = 'alert error';
                alertDiv.style.display = 'block';
            }
        });
    }
    
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const studentData = {
                fullName: document.getElementById('fullName').value,
                rollNo: document.getElementById('rollNo').value,
                uniqueId: document.getElementById('uniqueId').value,
                course: document.getElementById('courseName').value,
                certSerial: document.getElementById('certSerial').value,
                duration: document.getElementById('duration').value,
                passYear: document.getElementById('passYear').value,
                result: document.getElementById('result').value
            };
            await addStudent(studentData);
            studentForm.reset();
        });
        loadStudentsList();
        updateStats();
    }
});

function downloadBrochure(courseName) {
    const brochureLinks = {
        'kids-computer': 'assets/brochures/kids-computer.pdf',
        'basic-office': 'assets/brochures/basic-office.pdf',
        'professional-office': 'assets/brochures/professional-office.pdf',
        'graphic-design': 'assets/brochures/graphic-design.pdf',
        'web-development': 'assets/brochures/web-development.pdf',
        'digital-marketing': 'assets/brochures/digital-marketing.pdf',
        'professional-ai': 'assets/brochures/professional-ai.pdf',
        'academic-coaching': 'assets/brochures/academic-coaching.pdf',
        'hsc-ict': 'assets/brochures/hsc-ict.pdf',
        'hand-writing': 'assets/brochures/hand-writing.pdf'
    };
    
    const link = brochureLinks[courseName];
    if (link) {
        window.open(link, '_blank');
    } else {
        alert('ব্রোশিওরটি শীঘ্রই যোগ করা হবে।');
    }
}
let currentUser = null;
let selectedElemnt = null;
let draggedElement = null;
let elementCounter = 0;

function switchTab(tab, event) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.login-tab');

    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    loginForm.style.display = tab === 'login' ? 'block' : 'none';
    registerForm.style.display = tab === 'register' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.login-tab').forEach(tab => {
        tab.addEventListener('click', (event) => {
            const selectedTab = event.target.innerText.toLowerCase();
            switchTab(selectedTab, event);
        });
    });

    // LOGIN FORM
    document.getElementById('login-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user)); // Store current user
            window.location.href = "dashboard.html"; // Redirect to dashboard
        } else {
            alert('Invalid username or password. Please register first.');
        }
    });

    // REGISTER FORM
    document.getElementById('register-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return; 
        }

        let users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.username === username)) {
            alert('User already exists. Please log in.');
            return;
        }

        const newUser = { username, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        localStorage.setItem('currentUser', JSON.stringify(newUser));
        window.location.href = "dashboard.html";
    });
});

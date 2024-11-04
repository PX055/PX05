document.addEventListener('DOMContentLoaded', function() {
    // Get all containers
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    const forgotContainer = document.getElementById('forgotContainer');

    // Check if user is already logged in
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'dashboard.html';
    }

    // Navigation functions
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    document.getElementById('showForgotPassword').addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        forgotContainer.classList.remove('hidden');
    });

    document.getElementById('backToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        forgotContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    // Login form handling
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorMessage = document.getElementById('loginError');
        
        if (!username || !password) {
            showError('loginError', 'Please fill in all fields');
            return;
        }
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Store current user and redirect to dashboard
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            errorMessage.textContent = 'Invalid username or password';
        }
    });

    // Register form handling
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('registerError');

        if (!username || !email || !password || !confirmPassword) {
            errorMessage.textContent = 'Please fill in all fields';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match';
            return;
        }

        // Get existing users
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if username already exists
        if (users.some(user => user.username === username)) {
            errorMessage.textContent = 'Username already exists';
            return;
        }

        // Add new user
        const newUser = {
            username,
            email,
            password
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Show success message and redirect to login
        errorMessage.style.color = '#4CAF50';
        errorMessage.textContent = 'Registration successful! Redirecting to login...';
        
        setTimeout(() => {
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        }, 2000);
    });

    // Forgot password form handling
    document.getElementById('forgotForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        const errorMessage = document.getElementById('forgotError');

        if (!email) {
            errorMessage.textContent = 'Please enter your email';
            return;
        }

        // In a real application, you would send a password reset email
        errorMessage.style.color = '#4CAF50';
        errorMessage.textContent = 'If an account exists with this email, you will receive reset instructions.';
    });

    // Add this function to your script.js
    function showError(element, message) {
        const errorElement = document.getElementById(element);
        errorElement.textContent = message;
        errorElement.parentElement.classList.add('shake');
        
        // Remove shake class after animation completes
        setTimeout(() => {
            errorElement.parentElement.classList.remove('shake');
        }, 600);
    }
}); 
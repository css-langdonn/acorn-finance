// Authentication system
const Auth = {
    currentUser: null,

    // Initialize auth
    init() {
        this.currentUser = Utils.loadFromStorage('currentUser', null);
        this.updateUI();
    },

    // Sign up
    async signUp(username, email, password) {
        if (!Utils.validateEmail(email)) {
            throw new Error('Invalid email address');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const users = Utils.loadFromStorage('users', []);
        
        // Check if user exists
        if (users.find(u => u.email === email || u.username === username)) {
            throw new Error('User already exists');
        }

        const newUser = {
            id: Utils.generateId(),
            username,
            email,
            password: btoa(password), // Simple encoding (use proper hashing in production)
            role: 'user',
            status: 'active',
            createdAt: Date.now(),
            subscription: 'free'
        };

        users.push(newUser);
        Utils.saveToStorage('users', users);

        this.currentUser = newUser;
        Utils.saveToStorage('currentUser', newUser);
        this.updateUI();

        return newUser;
    },

    // Sign in
    signIn(email, password) {
        const users = Utils.loadFromStorage('users', []);
        const user = users.find(u => u.email === email);

        if (!user) {
            throw new Error('User not found');
        }

        if (atob(user.password) !== password) {
            throw new Error('Incorrect password');
        }

        if (user.status !== 'active') {
            throw new Error('Account is inactive');
        }

        this.currentUser = user;
        Utils.saveToStorage('currentUser', user);
        this.updateUI();

        return user;
    },

    // Sign out
    signOut() {
        this.currentUser = null;
        Utils.saveToStorage('currentUser', null);
        window.location.href = 'login.html';
    },

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    },

    // Check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    },

    // Update UI based on auth state
    updateUI() {
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(el => {
            const required = el.getAttribute('data-auth');
            if (required === 'authenticated') {
                el.style.display = this.isAuthenticated() ? '' : 'none';
            } else if (required === 'admin') {
                el.style.display = this.isAdmin() ? '' : 'none';
            } else if (required === 'guest') {
                el.style.display = !this.isAuthenticated() ? '' : 'none';
            }
        });

        const userInfo = document.getElementById('userInfo');
        if (userInfo && this.currentUser) {
            userInfo.textContent = this.currentUser.username;
        }
    },

    // Require authentication (redirect if not)
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Require admin (redirect if not)
    requireAdmin() {
        if (!this.isAdmin()) {
            alert('Admin access required');
            return false;
        }
        return true;
    }
};

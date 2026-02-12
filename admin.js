// Admin panel functionality
const Admin = {
    init() {
        this.initAdminModal();
        this.initWebhooks();
        this.initUsers();
        this.initApiKeys();
        this.initSystemControls();
        this.initSettings();
        this.updateOverview();
    },

    // Initialize admin modal
    initAdminModal() {
        const adminBtn = document.getElementById('adminBtn');
        const adminModal = document.getElementById('adminModal');
        const closeAdmin = document.getElementById('closeAdmin');
        const adminMenuItems = document.querySelectorAll('.admin-menu-item');
        const adminPanels = document.querySelectorAll('.admin-panel');

        adminBtn?.addEventListener('click', () => {
            // Check if user is admin, if not, prompt for password
            if (!Auth.isAdmin()) {
                const password = prompt('Enter admin password:');
                if (password !== CONFIG.adminPassword) {
                    alert('Incorrect password');
                    return;
                }
            }
            if (adminModal) {
                adminModal.classList.add('active');
                this.updateOverview();
            }
        });

        closeAdmin?.addEventListener('click', () => {
            adminModal.classList.remove('active');
        });

        adminMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                const panel = item.getAttribute('data-panel');

                adminMenuItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                adminPanels.forEach(p => p.classList.remove('active'));
                const targetPanel = document.getElementById(`admin${panel.charAt(0).toUpperCase() + panel.slice(1)}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }

                // Update panel-specific data
                if (panel === 'webhooks') {
                    this.updateWebhooksList();
                    // Re-initialize webhook event listeners
                    setTimeout(() => {
                        const webhooksList = document.getElementById('webhooksList');
                        if (webhooksList) {
                            webhooksList.addEventListener('click', (e) => {
                                const button = e.target.closest('[data-action]');
                                if (!button) return;
                                const webhookId = button.getAttribute('data-webhook-id');
                                const action = button.getAttribute('data-action');
                                if (action === 'test') this.testWebhook(webhookId, e);
                                else if (action === 'edit') this.editWebhook(webhookId);
                                else if (action === 'delete') this.deleteWebhook(webhookId);
                            });
                        }
                    }, 100);
                }
                if (panel === 'users') this.updateUsersTable();
            });
        });

        // Close on outside click
        adminModal?.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                adminModal.classList.remove('active');
            }
        });
    },

    // Update overview panel
    updateOverview() {
        const users = Utils.loadFromStorage('users', []);
        document.getElementById('totalUsers')?.textContent = users.length;
        document.getElementById('activeSessions')?.textContent = Math.floor(Math.random() * 50) + 10;
        
        const startTime = Utils.loadFromStorage('systemStartTime', Date.now());
        const uptime = Math.floor((Date.now() - startTime) / 1000 / 60);
        document.getElementById('systemUptime')?.textContent = `${Math.floor(uptime / 60)}h ${uptime % 60}m`;
        
        const webhooks = WebhookManager.webhooks || [];
        document.getElementById('webhookCount')?.textContent = webhooks.length;
    },

    // Webhook management
    initWebhooks() {
        // Ensure WebhookManager is initialized
        if (!WebhookManager.webhooks || WebhookManager.webhooks.length === 0) {
            WebhookManager.init();
        }

        this.updateWebhooksList();

        document.getElementById('addWebhookBtn')?.addEventListener('click', () => {
            this.showAddWebhookModal();
        });

        // Use event delegation for webhook actions
        const webhooksList = document.getElementById('webhooksList');
        if (webhooksList) {
            // Remove existing listeners to avoid duplicates
            const newWebhooksList = webhooksList.cloneNode(true);
            webhooksList.parentNode.replaceChild(newWebhooksList, webhooksList);
            
            newWebhooksList.addEventListener('click', (e) => {
                const button = e.target.closest('[data-action]');
                if (!button) return;

                const webhookId = button.getAttribute('data-webhook-id');
                const action = button.getAttribute('data-action');

                if (action === 'test') {
                    this.testWebhook(webhookId, e);
                } else if (action === 'edit') {
                    this.editWebhook(webhookId);
                } else if (action === 'delete') {
                    this.deleteWebhook(webhookId);
                }
            });
        }
    },

    updateWebhooksList() {
        const list = document.getElementById('webhooksList');
        if (!list) {
            console.warn('webhooksList element not found');
            return;
        }

        // Ensure WebhookManager is initialized
        if (!WebhookManager.webhooks || WebhookManager.webhooks.length === 0) {
            WebhookManager.init();
        }

        list.innerHTML = '';

        if (WebhookManager.webhooks.length === 0) {
            list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No webhooks configured. Click "Add Webhook" to add one.</div>';
            return;
        }

        WebhookManager.webhooks.forEach(webhook => {
            const item = document.createElement('div');
            item.className = 'webhook-item';
            item.innerHTML = `
                <div class="webhook-header">
                    <div>
                        <div class="webhook-name">${webhook.name}</div>
                        <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
                            ${webhook.url.substring(0, 50)}...
                        </div>
                    </div>
                    <div class="webhook-actions">
                        <button class="btn-secondary" data-webhook-id="${webhook.id}" data-action="test">Test</button>
                        <button class="btn-secondary" data-webhook-id="${webhook.id}" data-action="edit">Edit</button>
                        <button class="btn-danger" data-webhook-id="${webhook.id}" data-action="delete">Delete</button>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                    <span>Types: ${webhook.types.join(', ')}</span>
                    <span>Min Confidence: ${webhook.minConfidence}%</span>
                    <span>Status: ${webhook.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
            `;
            list.appendChild(item);
        });
    },

    showAddWebhookModal() {
        const name = prompt('Webhook Name:');
        if (!name) return;

        const url = prompt('Webhook URL:');
        if (!url) return;

        const typesInput = prompt('Signal Types (comma-separated: buy,sell,hold):', 'buy,sell,hold');
        const types = typesInput ? typesInput.split(',').map(t => t.trim()) : ['buy', 'sell', 'hold'];

        const minConfidence = parseInt(prompt('Minimum Confidence (0-100):', '70')) || 70;

        WebhookManager.addWebhook(name, url, types, minConfidence);
        this.updateWebhooksList();
        alert('Webhook added successfully!');
    },

    editWebhook(id) {
        const webhook = WebhookManager.getWebhook(id);
        if (!webhook) return;

        const name = prompt('Webhook Name:', webhook.name);
        if (name) webhook.name = name;

        const url = prompt('Webhook URL:', webhook.url);
        if (url) webhook.url = url;

        const typesInput = prompt('Signal Types (comma-separated):', webhook.types.join(','));
        if (typesInput) {
            webhook.types = typesInput.split(',').map(t => t.trim());
        }

        const minConfidence = parseInt(prompt('Minimum Confidence:', webhook.minConfidence)) || webhook.minConfidence;
        webhook.minConfidence = minConfidence;

        WebhookManager.updateWebhook(id, webhook);
        this.updateWebhooksList();
    },

    deleteWebhook(id) {
        if (confirm('Are you sure you want to delete this webhook?')) {
            WebhookManager.deleteWebhook(id);
            this.updateWebhooksList();
        }
    },

    async testWebhook(id, event) {
        const button = event?.target || document.querySelector(`[data-webhook-id="${id}"][data-action="test"]`);
        const originalText = button?.textContent || 'Test';
        
        if (button) {
            button.disabled = true;
            button.textContent = 'Testing...';
        }

        try {
            const result = await WebhookManager.testWebhook(id);
            if (result) {
                alert('✅ Webhook test successful! Check your Discord channel.');
            } else {
                alert('⚠️ Webhook test completed but may have failed. Check your Discord channel.');
            }
        } catch (error) {
            console.error('Webhook test error:', error);
            alert(`❌ Webhook test failed: ${error.message}\n\nCheck:\n1. Webhook URL is correct\n2. Webhook is not expired\n3. Browser console for details`);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    },

    // User management
    initUsers() {
        this.updateUsersTable();

        document.getElementById('addUserBtn')?.addEventListener('click', () => {
            this.showAddUserModal();
        });
    },

    updateUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const users = Utils.loadFromStorage('users', []);
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td style="color: ${user.status === 'active' ? 'var(--success)' : 'var(--error)'}">${user.status}</td>
                <td>
                    <button class="btn-secondary" onclick="Admin.editUser('${user.id}')">Edit</button>
                    <button class="btn-danger" onclick="Admin.deleteUser('${user.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    showAddUserModal() {
        const username = prompt('Username:');
        if (!username) return;

        const email = prompt('Email:');
        if (!email || !Utils.validateEmail(email)) {
            alert('Invalid email');
            return;
        }

        const password = prompt('Password:');
        if (!password || password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        const role = prompt('Role (user/admin):', 'user');
        if (!['user', 'admin'].includes(role)) {
            alert('Invalid role');
            return;
        }

        try {
            Auth.signUp(username, email, password);
            const users = Utils.loadFromStorage('users', []);
            const newUser = users[users.length - 1];
            newUser.role = role;
            Utils.saveToStorage('users', users);
            this.updateUsersTable();
            alert('User added successfully!');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    },

    editUser(id) {
        const users = Utils.loadFromStorage('users', []);
        const user = users.find(u => u.id === id);
        if (!user) return;

        const email = prompt('Email:', user.email);
        if (email && Utils.validateEmail(email)) {
            user.email = email;
        }

        const role = prompt('Role (user/admin):', user.role);
        if (role && ['user', 'admin'].includes(role)) {
            user.role = role;
        }

        const status = prompt('Status (active/inactive):', user.status);
        if (status && ['active', 'inactive'].includes(status)) {
            user.status = status;
        }

        Utils.saveToStorage('users', users);
        this.updateUsersTable();
        alert('User updated successfully!');
    },

    deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            const users = Utils.loadFromStorage('users', []);
            const filtered = users.filter(u => u.id !== id);
            Utils.saveToStorage('users', filtered);
            this.updateUsersTable();
        }
    },

    // API Keys
    initApiKeys() {
        const savedOpenAI = Utils.loadFromStorage('openaiApiKey', '');
        const savedAlpha = Utils.loadFromStorage('alphaVantageApiKey', '');

        const openaiInput = document.getElementById('openaiKey');
        const alphaInput = document.getElementById('alphaVantageKey');

        if (openaiInput) openaiInput.value = savedOpenAI;
        if (alphaInput) alphaInput.value = savedAlpha;

        document.getElementById('saveApiKeys')?.addEventListener('click', () => {
            const openaiKey = openaiInput?.value || '';
            const alphaKey = alphaInput?.value || '';

            Utils.saveToStorage('openaiApiKey', openaiKey);
            Utils.saveToStorage('alphaVantageApiKey', alphaKey);

            CONFIG.openaiApiKey = openaiKey;
            CONFIG.alphaVantageApiKey = alphaKey;

            alert('API keys saved successfully!');
        });
    },

    // System controls
    initSystemControls() {
        const maintenanceMode = document.getElementById('maintenanceMode');
        const lockdownMode = document.getElementById('lockdownMode');
        const autoUpdates = document.getElementById('autoUpdates');

        const savedMaintenance = Utils.loadFromStorage('maintenanceMode', false);
        const savedLockdown = Utils.loadFromStorage('lockdownMode', false);
        const savedAutoUpdates = Utils.loadFromStorage('autoUpdates', true);

        if (maintenanceMode) {
            maintenanceMode.checked = savedMaintenance;
            maintenanceMode.addEventListener('change', (e) => {
                Utils.saveToStorage('maintenanceMode', e.target.checked);
                document.getElementById('maintenanceOverlay').classList.toggle('active', e.target.checked);
            });
        }

        if (lockdownMode) {
            lockdownMode.checked = savedLockdown;
            lockdownMode.addEventListener('change', (e) => {
                Utils.saveToStorage('lockdownMode', e.target.checked);
                document.getElementById('lockdownOverlay').classList.toggle('active', e.target.checked);
            });
        }

        if (autoUpdates) {
            autoUpdates.checked = savedAutoUpdates;
            autoUpdates.addEventListener('change', (e) => {
                Utils.saveToStorage('autoUpdates', e.target.checked);
            });
        }
    },

    // Settings
    initSettings() {
        const updateInterval = document.getElementById('updateInterval');
        const minConfidence = document.getElementById('minConfidence');

        const savedInterval = Utils.loadFromStorage('updateInterval', CONFIG.updateInterval / 1000);
        const savedConfidence = Utils.loadFromStorage('minConfidence', CONFIG.minConfidenceForWebhook);

        if (updateInterval) updateInterval.value = savedInterval;
        if (minConfidence) minConfidence.value = savedConfidence;

        document.getElementById('saveSettings')?.addEventListener('click', () => {
            const interval = parseInt(updateInterval?.value || 60) * 1000;
            const confidence = parseInt(minConfidence?.value || 70);

            Utils.saveToStorage('updateInterval', interval / 1000);
            Utils.saveToStorage('minConfidence', confidence);

            CONFIG.updateInterval = interval;
            CONFIG.minConfidenceForWebhook = confidence;

            alert('Settings saved! The system will use new settings on next update.');
        });
    }
};

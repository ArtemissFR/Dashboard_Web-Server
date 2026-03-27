document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Update Time and Date
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    const greetingElement = document.getElementById('greeting');

    function updateClock() {
        const now = new Date();
        
        // Time
        timeElement.textContent = now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Date
        dateElement.textContent = now.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Dynamic Greeting
        const hour = now.getHours();
        if (hour >= 5 && hour < 12) {
            greetingElement.textContent = "Bon matin, Administrateur";
        } else if (hour >= 12 && hour < 18) {
            greetingElement.textContent = "Bon après-midi, Administrateur";
        } else {
            greetingElement.textContent = "Bonsoir, Administrateur";
        }
    }

    setInterval(updateClock, 1000);
    updateClock();

    // Light/Dark Mode Logic
    const themeToggle = document.getElementById('theme-toggle');
    
    const savedMode = localStorage.getItem('it-lab-color-mode') || 'dark';
    if (savedMode === 'light') {
        document.documentElement.classList.add('light-mode');
        if (themeToggle) {
            themeToggle.innerHTML = '<i data-lucide="moon" id="theme-icon"></i>';
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('light-mode');
            const isLight = document.documentElement.classList.contains('light-mode');
            localStorage.setItem('it-lab-color-mode', isLight ? 'light' : 'dark');
            
            // Replaces the content entirely to allow Lucide to parse the new icon
            themeToggle.innerHTML = `<i data-lucide="${isLight ? 'moon' : 'sun'}" id="theme-icon"></i>`;
            lucide.createIcons();
        });
    }

    // Theme Management Logic (Accent Colors)
    const settingsToggle = document.getElementById('settings-toggle');
    const themePanel = document.getElementById('theme-panel');
    const themeDots = document.querySelectorAll('.theme-dot');
    
    const savedTheme = localStorage.getItem('it-lab-theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }

    if (settingsToggle) {
        settingsToggle.addEventListener('click', () => {
            themePanel.classList.toggle('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (themePanel && settingsToggle && !themePanel.contains(e.target) && !settingsToggle.contains(e.target)) {
            themePanel.classList.remove('active');
        }
    });

    themeDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const color = dot.dataset.color;
            setTheme(color);
            localStorage.setItem('it-lab-theme', color);
            
            themeDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });

    function setTheme(color) {
        document.documentElement.style.setProperty('--accent-main', color);
        themeDots.forEach(dot => {
            if (dot.dataset.color === color) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Dynamic Services and Search Logic
    const gridContainer = document.getElementById('services-grid');
    const searchInput = document.getElementById('search-input');
    const categoryTabsContainer = document.getElementById('category-tabs');
    let allCards = [];
    let dashboardServices = [];
    let currentCategory = 'all';

    fetch('config.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(services => {
            dashboardServices = services;
            generateCategoryTabs();
            generateCards();
            initializeSearchAndFilters();
            initializeAdminMode();
        })
        .catch(err => {
            console.error('Erreur de chargement de config.json:', err);
            gridContainer.innerHTML = '<p style="text-align:center; color:#ff4b2b; grid-column:1/-1;">Erreur de chargement. Vérifiez que vous utilisez un serveur web pour ouvrir ce fichier et que config.json existe.</p>';
        });

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function generateCategoryTabs() {
        if (!categoryTabsContainer) return;
        
        const types = new Set(dashboardServices.map(s => s.type || 'Autre'));
        let tabsHtml = `<button class="category-tab" data-category="all">Tous</button>`;
        types.forEach(type => {
            tabsHtml += `<button class="category-tab" data-category="${type.toLowerCase()}">${capitalize(type)}</button>`;
        });
        categoryTabsContainer.innerHTML = tabsHtml;

        const tabs = categoryTabsContainer.querySelectorAll('.category-tab');
        
        // Restore active state
        let foundActive = false;
        tabs.forEach(t => {
            if (t.dataset.category === currentCategory) {
                t.classList.add('active');
                foundActive = true;
            }
        });
        if (!foundActive && tabs.length > 0) {
            tabs[0].classList.add('active');
            currentCategory = 'all';
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentCategory = tab.dataset.category;
                filterCards();
            });
        });
    }

    function generateCards() {
        gridContainer.innerHTML = '';
        
        dashboardServices.forEach(service => {
            const card = document.createElement('div');
            card.className = `card card-${service.type || 'default'}`;
            card.dataset.service = service.name;
            card.dataset.category = (service.type || 'Autre').toLowerCase();
            
            let iconHtml = '';
            if (service.logo) {
                iconHtml = `<img src="${service.logo}" alt="${service.name} logo" class="icon-logo">`;
            } else if (service.icon) {
                iconHtml = `<i data-lucide="${service.icon}" class="icon"></i>`;
            } else {
                iconHtml = `<i data-lucide="server" class="icon"></i>`;
            }

            card.innerHTML = `
                <div class="card-actions">
                    <div class="action-btn edit-btn" title="Modifier" data-id="${service.id}"><i data-lucide="edit-2" style="width:16px;height:16px;"></i></div>
                    <div class="action-btn delete-btn" title="Supprimer" data-id="${service.id}"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></div>
                </div>
                <div class="card-glass"></div>
                <div class="card-content">
                    <div class="status-badge">
                        <span class="status-dot"></span>
                        <span class="status-text">Checking...</span>
                    </div>
                    ${iconHtml}
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <a href="${service.url}" class="btn" target="_blank" rel="noopener noreferrer">Accéder</a>
                </div>
            `;
            gridContainer.appendChild(card);
        });

        // Add the "Add New" card from template
        const addCardTemplate = document.getElementById('add-card-template');
        if (addCardTemplate) {
            gridContainer.insertAdjacentHTML('beforeend', addCardTemplate.innerHTML);
            const addNewBtn = document.getElementById('add-new-btn');
            if(addNewBtn) {
                addNewBtn.addEventListener('click', () => openAdminModal());
            }
        }
        
        lucide.createIcons();
        allCards = document.querySelectorAll('#services-grid .card:not(.add-new-card)');
        
        setupCardEvents();
        filterCards();
        checkAllServices();
        
        // Reveal animation
        allCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`;
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        });
    }

    function setupCardEvents() {
        allCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.card-actions')) return;
                
                if (e.target.tagName !== 'A') {
                    const link = card.querySelector('a');
                    if (link && !document.body.classList.contains('admin-mode')) {
                        window.open(link.href, '_blank');
                    }
                }
            });

            const editBtn = card.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openAdminModal(editBtn.dataset.id);
                });
            }

            const deleteBtn = card.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(confirm("Voulez-vous vraiment supprimer ce service ?")) {
                        dashboardServices = dashboardServices.filter(s => String(s.id) !== String(deleteBtn.dataset.id));
                        generateCategoryTabs();
                        generateCards();
                    }
                });
            }
        });
    }

    function initializeSearchAndFilters() {
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                filterCards();
            });
        }
    }

    function filterCards() {
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const addNewCard = document.getElementById('add-new-btn');
        
        allCards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();
            const cat = card.dataset.category;
            
            const matchSearch = name.includes(term) || desc.includes(term);
            const matchCategory = currentCategory === 'all' || cat === currentCategory;

            if (matchSearch && matchCategory) {
                card.style.display = 'flex';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function initializeAdminMode() {
        const adminToggle = document.getElementById('admin-toggle');
        const downloadBtn = document.getElementById('download-config');
        
        if (adminToggle) {
            adminToggle.addEventListener('click', () => {
                document.body.classList.toggle('admin-mode');
                const isAdmin = document.body.classList.contains('admin-mode');
                
                adminToggle.style.background = isAdmin ? 'var(--accent-main)' : '';
                adminToggle.style.color = isAdmin ? 'var(--bg-dark)' : '';
                
                if(downloadBtn) {
                    downloadBtn.style.display = isAdmin ? 'flex' : 'none';
                }
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dashboardServices, null, 4));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "config.json");
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            });
        }

        const cancelBtn = document.getElementById('btn-cancel-modal');
        const form = document.getElementById('service-form');

        if(cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('admin-modal').classList.remove('active');
            });
        }
        
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                saveService();
            });
        }
    }

    window.openAdminModal = function(serviceId = null) {
        const modal = document.getElementById('admin-modal');
        const title = document.getElementById('modal-title');
        
        const idField = document.getElementById('service-id');
        const nameField = document.getElementById('service-name');
        const typeField = document.getElementById('service-type');
        const descField = document.getElementById('service-desc');
        const urlField = document.getElementById('service-url');
        const iconField = document.getElementById('service-icon');

        if (serviceId) {
            const service = dashboardServices.find(s => String(s.id) === String(serviceId));
            if(service) {
                title.textContent = "Modifier le Service";
                idField.value = service.id;
                nameField.value = service.name || '';
                typeField.value = service.type || '';
                descField.value = service.description || '';
                urlField.value = service.url || '';
                iconField.value = service.logo || service.icon || '';
            }
        } else {
            title.textContent = "Ajouter un Service";
            idField.value = '';
            nameField.value = '';
            typeField.value = '';
            descField.value = '';
            urlField.value = '';
            iconField.value = '';
        }

        modal.classList.add('active');
    };

    function saveService() {
        const idVal = document.getElementById('service-id').value;
        const iconVal = document.getElementById('service-icon').value;
        
        const isUrl = iconVal.startsWith('http://') || iconVal.startsWith('https://');

        const newService = {
            id: idVal || 'srv-' + Date.now(),
            name: document.getElementById('service-name').value,
            type: document.getElementById('service-type').value.toLowerCase().replace(/\s+/g, '-'),
            description: document.getElementById('service-desc').value,
            url: document.getElementById('service-url').value,
        };

        if(isUrl) {
            newService.logo = iconVal;
        } else {
            newService.icon = iconVal;
        }

        if (idVal) {
            const index = dashboardServices.findIndex(s => String(s.id) === String(idVal));
            if(index > -1) {
                dashboardServices[index] = newService;
            }
        } else {
            dashboardServices.push(newService);
        }

        document.getElementById('admin-modal').classList.remove('active');
        generateCategoryTabs();
        generateCards();
    }

    function checkAllServices() {
        if (!allCards || allCards.length === 0) return;
        
        allCards.forEach(card => {
            const link = card.querySelector('a');
            const dot = card.querySelector('.status-dot');
            const statusText = card.querySelector('.status-text');
            
            if (link && dot && statusText) {
                const url = link.href;
                
                fetch(url, { mode: 'no-cors', cache: 'no-cache' })
                    .then(() => {
                        dot.classList.add('online');
                        dot.classList.remove('offline');
                        statusText.textContent = 'En ligne';
                    })
                    .catch(() => {
                        dot.classList.add('offline');
                        dot.classList.remove('online');
                        statusText.textContent = 'Hors ligne';
                    });
            }
        });
    }
});

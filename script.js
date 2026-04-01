document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Update Time and Date
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    const greetingElement = document.getElementById('greeting');
    let sortableInstance = null;

    // Initialize Particles.js
    window.initParticles = function() {
        const densityStr = localStorage.getItem('it-lab-part-density') || 'normal';
        const speedVal = parseFloat(localStorage.getItem('it-lab-part-speed') || '1.5');
        
        const container = document.getElementById('particles-js');
        if (!container) return;
        
        if (window.pJSDom && window.pJSDom.length > 0) {
            window.pJSDom[0].pJS.fn.vendors.destroypJS();
            window.pJSDom = [];
        }
        container.innerHTML = '';
        
        if (densityStr === 'disabled') {
            return;
        }
        
        let numberValue = 60;
        if (densityStr === 'low') numberValue = 30;
        else if (densityStr === 'high') numberValue = 120;
        
        const isLight = document.documentElement.classList.contains('light-mode');
        const pcolor = isLight ? "#000000" : "#ffffff";
        
        if (window.particlesJS) {
            particlesJS('particles-js', {
                "particles": {
                    "number": { "value": numberValue, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": pcolor },
                    "shape": { "type": "circle" },
                    "opacity": { "value": 0.2, "random": false },
                    "size": { "value": 3, "random": true },
                    "line_linked": { "enable": true, "distance": 150, "color": pcolor, "opacity": 0.1, "width": 1 },
                    "move": { "enable": true, "speed": speedVal, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": {
                        "onhover": { "enable": true, "mode": "grab" },
                        "onclick": { "enable": true, "mode": "push" },
                        "resize": true
                    },
                    "modes": {
                        "grab": { "distance": 180, "line_linked": { "opacity": 0.3 } },
                        "push": { "particles_nb": 3 }
                    }
                },
                "retina_detect": true
            });
        }
    };
    
    initParticles();

    // Initialize Tooltips for existing static elements
    const initTooltips = () => {
        if (window.tippy) {
            // Convert titles to data-tippy-content to prevent default browser tooltip
            document.querySelectorAll('[title]').forEach(el => {
                el.setAttribute('data-tippy-content', el.getAttribute('title'));
                el.removeAttribute('title');
            });
            tippy('[data-tippy-content]', {
                theme: 'glass',
                animation: 'scale',
                arrow: true
            });
        }
    };
    initTooltips();

    const time24h = document.getElementById('time-24h');
    const timeSec = document.getElementById('time-seconds');
    let is24h = localStorage.getItem('it-lab-24h') !== 'false';
    let isSec = localStorage.getItem('it-lab-sec') !== 'false';
    if (time24h) {
        time24h.checked = is24h;
        time24h.addEventListener('change', e => { is24h = e.target.checked; localStorage.setItem('it-lab-24h', is24h); updateClock(); });
    }
    if (timeSec) {
        timeSec.checked = isSec;
        timeSec.addEventListener('change', e => { isSec = e.target.checked; localStorage.setItem('it-lab-sec', isSec); updateClock(); });
    }

    function updateClock() {
        const now = new Date();
        
        // Time
        timeElement.textContent = now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: isSec ? '2-digit' : undefined,
            hour12: !is24h
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

    // Link opens config
    const linkNewTab = document.getElementById('link-newtab');
    const linkFullCard = document.getElementById('link-fullcard');
    window.isNewTab = localStorage.getItem('it-lab-newtab') !== 'false';
    window.isFullCard = localStorage.getItem('it-lab-fullcard') !== 'false';
    if(linkNewTab) {
        linkNewTab.checked = window.isNewTab;
        linkNewTab.addEventListener('change', e => { window.isNewTab = e.target.checked; localStorage.setItem('it-lab-newtab', window.isNewTab); if(typeof generateCards === 'function') generateCards(); });
    }
    if(linkFullCard) {
        linkFullCard.checked = window.isFullCard;
        linkFullCard.addEventListener('change', e => { window.isFullCard = e.target.checked; localStorage.setItem('it-lab-fullcard', window.isFullCard); });
    }

    // UI Scale / Zoom setup
    const uiScaleSelect = document.getElementById('ui-scale');
    const savedScale = localStorage.getItem('it-lab-ui-scale') || 'standard';
    if(savedScale === 'compact') document.documentElement.style.fontSize = '14px';
    if(savedScale === 'large') document.documentElement.style.fontSize = '18px';
    if(uiScaleSelect) {
        uiScaleSelect.value = savedScale;
        uiScaleSelect.addEventListener('change', (e) => {
            localStorage.setItem('it-lab-ui-scale', e.target.value);
            document.documentElement.style.fontSize = e.target.value === 'compact' ? '14px' : (e.target.value === 'large' ? '18px' : '16px');
        });
    }

    // Light/Dark Mode Logic (Auto Theme)
    const themeToggle = document.getElementById('theme-toggle');
    const colorModeSelect = document.getElementById('color-match-mode');
    const savedModeDef = localStorage.getItem('it-lab-color-def') || 'auto';

    function applyColorMode(modeSetting) {
        let finalMode = modeSetting;
        if (modeSetting === 'auto') {
            finalMode = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        if (finalMode === 'light') {
            document.documentElement.classList.add('light-mode');
            if(themeToggle) themeToggle.innerHTML = '<i data-lucide="moon" id="theme-icon"></i>';
        } else {
            document.documentElement.classList.remove('light-mode');
            if(themeToggle) themeToggle.innerHTML = '<i data-lucide="sun" id="theme-icon"></i>';
        }
        if(window.lucide) lucide.createIcons();
        if(window.pJSDom && window.pJSDom.length > 0) {
            const pJS = window.pJSDom[0].pJS;
            pJS.particles.color.value = finalMode==='light' ? "#000000" : "#ffffff";
            pJS.particles.line_linked.color = finalMode==='light' ? "#000000" : "#ffffff";
            pJS.fn.particlesRefresh();
        }
    }

    applyColorMode(savedModeDef);

    if (colorModeSelect) {
        colorModeSelect.value = savedModeDef;
        colorModeSelect.addEventListener('change', (e) => {
            localStorage.setItem('it-lab-color-def', e.target.value);
            applyColorMode(e.target.value);
        });
    }

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (localStorage.getItem('it-lab-color-def') === 'auto') {
            applyColorMode('auto');
        }
    });

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentIsLight = document.documentElement.classList.contains('light-mode');
            const newMode = currentIsLight ? 'dark' : 'light';
            localStorage.setItem('it-lab-color-def', newMode);
            if(colorModeSelect) colorModeSelect.value = newMode;
            applyColorMode(newMode);
        });
    }

    // Theme Management Logic (Settings Modal)
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const themeDots = document.querySelectorAll('.theme-dot');
    
    const savedTheme = localStorage.getItem('it-lab-theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }

    if (settingsToggle && settingsModal) {
        settingsToggle.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }
    
    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }

    // Connect Top Search Trigger to Cmd Palette
    const searchTrigger = document.getElementById('search-trigger');
    if (searchTrigger) {
        searchTrigger.addEventListener('click', () => {
            if (typeof openCommandPalette === 'function') openCommandPalette();
        });
    }

    // Modal Global out-click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
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

    // === Layout Settings ===
    const layoutGridBtn = document.getElementById('layout-grid');
    const layoutListBtn = document.getElementById('layout-list');
    const servicesGrid = document.getElementById('services-grid');

    const savedLayout = localStorage.getItem('it-lab-layout') || 'grid';
    if(savedLayout === 'list') {
        if(servicesGrid) servicesGrid.classList.add('list-view');
        if(layoutListBtn) layoutListBtn.classList.add('active');
        if(layoutGridBtn) layoutGridBtn.classList.remove('active');
    }

    if(layoutGridBtn && layoutListBtn) {
        layoutGridBtn.addEventListener('click', (e) => {
            if(servicesGrid) servicesGrid.classList.remove('list-view');
            layoutGridBtn.classList.add('active');
            layoutListBtn.classList.remove('active');
            localStorage.setItem('it-lab-layout', 'grid');
            if(window.createRipple) createRipple(e);
        });
        layoutListBtn.addEventListener('click', (e) => {
            if(servicesGrid) servicesGrid.classList.add('list-view');
            layoutListBtn.classList.add('active');
            layoutGridBtn.classList.remove('active');
            localStorage.setItem('it-lab-layout', 'list');
            if(window.createRipple) createRipple(e);
        });
    }

    // === Performance Setting ===
    const perfToggle = document.getElementById('perf-mode-toggle');
    const savedPerf = localStorage.getItem('it-lab-perf') === 'true';
    if (savedPerf) {
        document.body.classList.add('perf-mode');
        if (perfToggle) perfToggle.checked = true;
    }
    
    if (perfToggle) {
        perfToggle.addEventListener('change', (e) => {
            const isPerf = e.target.checked;
            if (isPerf) {
                document.body.classList.add('perf-mode');
            } else {
                document.body.classList.remove('perf-mode');
            }
            localStorage.setItem('it-lab-perf', isPerf);
        });
    }

    // === Particles Settings ===
    const densitySelect = document.getElementById('particles-density');
    const speedSelect = document.getElementById('particles-speed');
    
    const savedDensity = localStorage.getItem('it-lab-part-density') || 'normal';
    const savedSpeed = localStorage.getItem('it-lab-part-speed') || '1.5';
    
    if (densitySelect) densitySelect.value = savedDensity;
    if (speedSelect) speedSelect.value = savedSpeed;

    if (densitySelect) {
        densitySelect.addEventListener('change', (e) => {
            localStorage.setItem('it-lab-part-density', e.target.value);
            if(typeof initParticles === 'function') initParticles();
        });
    }
    if (speedSelect) {
        speedSelect.addEventListener('change', (e) => {
            localStorage.setItem('it-lab-part-speed', e.target.value);
            if(typeof initParticles === 'function') initParticles();
        });
    }

    // === Fallback Search Engine ===
    const fallbackSelect = document.getElementById('search-fallback');
    const savedFallback = localStorage.getItem('it-lab-search-fallback') || 'google';
    if(fallbackSelect) {
        fallbackSelect.value = savedFallback;
        fallbackSelect.addEventListener('change', e => localStorage.setItem('it-lab-search-fallback', e.target.value));
    }

    // === Custom Wallpaper ===
    const wpInput = document.getElementById('custom-wallpaper');
    const savedWp = localStorage.getItem('it-lab-wallpaper') || '';
    if(wpInput) {
        wpInput.value = savedWp;
        wpInput.addEventListener('input', e => {
            localStorage.setItem('it-lab-wallpaper', e.target.value);
            applyWallpaper(e.target.value);
        });
    }
    function applyWallpaper(url) {
        if(url) {
            document.body.style.backgroundImage = `url('${url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
            if(!document.getElementById('wp-overlay')) {
                const overlay = document.createElement('div');
                overlay.id = 'wp-overlay';
                overlay.style = 'position:fixed;inset:0;z-index:-1;background:var(--bg-base);opacity:0.85;';
                document.body.appendChild(overlay);
            }
            const pbg = document.querySelector('.particles-bg');
            if(pbg) pbg.style.zIndex = '0';
        } else {
            document.body.style.backgroundImage = '';
            const ol = document.getElementById('wp-overlay');
            if(ol) ol.remove();
        }
    }
    applyWallpaper(savedWp);

    // === Kiosk Mode ===
    const kioskBtn = document.getElementById('kiosk-mode-btn');
    if(kioskBtn) {
        kioskBtn.addEventListener('click', () => {
            document.body.classList.add('kiosk-mode');
            if(document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(e=>console.log(e));
            }
            const settingsModal = document.getElementById('settings-modal');
            if(settingsModal) settingsModal.classList.remove('active');
            
            const exitHandler = (e) => {
                if(e.key === 'Escape' || e.type === 'fullscreenchange') {
                    if(!document.fullscreenElement) {
                        document.body.classList.remove('kiosk-mode');
                        document.removeEventListener('keydown', exitHandler);
                        document.removeEventListener('fullscreenchange', exitHandler);
                    }
                }
            };
            document.addEventListener('keydown', exitHandler);
            document.addEventListener('fullscreenchange', exitHandler);
        });
    }

    // === Data Reset ===
    const resetBtn = document.getElementById('reset-data');
    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            if(confirm("Attention ! Toutes vos préférences locales et favoris seront effacés. Le fichier config.json restera intact. Continuer ?")) {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('it-lab-')) {
                        localStorage.removeItem(key);
                    }
                }
                location.reload();
            }
        });
    }

    // Dynamic Services and Search Logic
    const gridContainer = document.getElementById('services-grid');
    const searchInput = document.getElementById('search-input');
    const categoryTabsContainer = document.getElementById('category-tabs');
    let allCards = [];

    if (gridContainer) {
        gridContainer.addEventListener('mousemove', e => {
            const cards = gridContainer.querySelectorAll('.card');
            for(const card of cards) {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            }
        });
    }

    window.createRipple = function(event) {
        const button = event.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple");

        const existingRipple = button.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }
        button.appendChild(circle);
    };

    document.querySelectorAll('.btn, .icon-btn').forEach(btn => {
        btn.addEventListener('click', createRipple);
    });
    let dashboardServices = [];
    let currentCategory = 'all';

    function renderSkeletons() {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            gridContainer.innerHTML += `
                <div class="card" style="pointer-events: none; border-color: transparent;">
                    <div class="card-header">
                        <div class="card-icon-box skeleton-icon skeleton"></div>
                        <div class="status-badge skeleton-pill skeleton"></div>
                    </div>
                    <div class="card-body">
                        <div class="skeleton-title skeleton"></div>
                        <div class="skeleton-text skeleton"></div>
                        <div class="skeleton-text skeleton" style="width: 80%;"></div>
                    </div>
                    <div class="card-footer" style="padding-top:16px;">
                        <div class="skeleton-btn skeleton"></div>
                    </div>
                </div>
            `;
        }
    }

    renderSkeletons();

    window.saveFavoritesLocally = function() {
        const favIds = dashboardServices.filter(s => s.favorite).map(s => String(s.id));
        localStorage.setItem('it-lab-favorites', JSON.stringify(favIds));
    };

    window.loadFavoritesLocally = function() {
        try {
            const favIdsStr = localStorage.getItem('it-lab-favorites');
            if(favIdsStr) {
                const favIds = JSON.parse(favIdsStr);
                dashboardServices.forEach(s => {
                    s.favorite = favIds.includes(String(s.id));
                });
            }
        } catch(e) { console.error("Error loading favorites", e); }
    };

    fetch('config.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(services => {
            dashboardServices = services;
            loadFavoritesLocally();
            // Introduce a very small delay to show off the cool skeleton loader (only 500ms)
            setTimeout(() => {
                generateCategoryTabs();
                generateCards();
                initializeSearchAndFilters();
                initializeAdminMode();
            }, 500);
        })
        .catch(err => {
            console.error('Erreur de chargement de config.json:', err);
            gridContainer.innerHTML = '<p style="text-align:center; color:#ff4b2b; grid-column:1/-1;">Erreur de chargement. Vérifiez que vous utilisez un serveur web pour ouvrir ce fichier et que config.json existe.</p>';
        });

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function moveIndicator(tab) {
        if (!categoryTabsContainer) return;
        const indicator = categoryTabsContainer.querySelector('.tab-indicator');
        if(indicator && tab) {
            indicator.style.width = `${tab.offsetWidth}px`;
            indicator.style.transform = `translateX(${tab.offsetLeft - 4}px)`;
        }
    }

    window.addEventListener('resize', () => {
        const activeTab = categoryTabsContainer?.querySelector('.category-tab.active');
        if(activeTab) {
            setTimeout(() => moveIndicator(activeTab), 50);
        }
    });

    function generateCategoryTabs() {
        if (!categoryTabsContainer) return;
        
        const types = new Set(dashboardServices.map(s => s.type || 'Autre'));
        let tabsHtml = `<div class="tab-indicator"></div><button class="category-tab" data-category="all">Tous</button>`;
        types.forEach(type => {
            tabsHtml += `<button class="category-tab" data-category="${type.toLowerCase()}">${capitalize(type)}</button>`;
        });
        categoryTabsContainer.innerHTML = tabsHtml;

        const tabs = categoryTabsContainer.querySelectorAll('.category-tab');
        
        // Restore active state
        let foundActive = false;
        let activeTab = null;
        tabs.forEach(t => {
            if (t.dataset.category === currentCategory) {
                t.classList.add('active');
                activeTab = t;
                foundActive = true;
            }
        });
        if (!foundActive && tabs.length > 0) {
            tabs[0].classList.add('active');
            activeTab = tabs[0];
            currentCategory = 'all';
        }

        setTimeout(() => moveIndicator(activeTab), 50);

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                moveIndicator(tab);
                currentCategory = tab.dataset.category;
                filterCards();
                createRipple(e);
            });
        });
    }

    function generateCards() {
        gridContainer.innerHTML = '';
        
        const customOrderStr = localStorage.getItem('it-lab-custom-order');
        let customOrder = [];
        if (customOrderStr) {
            try { customOrder = JSON.parse(customOrderStr); } catch(e){}
        }

        dashboardServices.sort((a, b) => {
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            
            if (customOrder.length > 0) {
                const indexA = customOrder.indexOf(a.name);
                const indexB = customOrder.indexOf(b.name);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
            }
            return 0;
        });

        dashboardServices.forEach(service => {
            const card = document.createElement('div');
            card.className = `card card-${service.type || 'default'}`;
            card.dataset.service = service.name;
            card.dataset.category = (service.type || 'Autre').toLowerCase();
            card.dataset.id = service.id; // added for context menu
            card.dataset.url = service.url || '';
            
            let iconHtml = '';
            if (service.logo) {
                iconHtml = `<img src="${service.logo}" alt="${service.name} logo" class="icon-logo">`;
            } else if (service.icon) {
                iconHtml = `<i data-lucide="${service.icon}" class="icon"></i>`;
            } else {
                iconHtml = `<i data-lucide="server" class="icon"></i>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon-box">${iconHtml}</div>
                    <div class="status-badge">
                        <span class="status-dot"></span>
                        <span class="status-text">...</span>
                    </div>
                </div>
                <div class="card-body">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                </div>
                <div class="card-footer">
                    <a href="${service.url}" class="btn btn-outline" target="${window.isNewTab ? '_blank' : '_self'}" rel="noopener noreferrer">Aperçu</a>
                    <div class="action-bar">
                        <div class="action-sm fav-btn ${service.favorite ? 'favorited' : ''}" data-tippy-content="Favori" data-id="${service.id}"><i data-lucide="star" style="width:16px;height:16px;" fill="${service.favorite ? '#f59e0b' : 'none'}"></i></div>
                        <div class="action-sm edit-btn" data-tippy-content="Modifier" data-id="${service.id}"><i data-lucide="edit-2" style="width:16px;height:16px;"></i></div>
                        <div class="action-sm delete-btn" data-tippy-content="Supprimer" data-id="${service.id}"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></div>
                    </div>
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

        // Initialize drag and drop via Sortable
        if (sortableInstance) sortableInstance.destroy();
        if (window.Sortable && gridContainer) {
            sortableInstance = new Sortable(gridContainer, {
                animation: 200,
                filter: '.add-new-card',
                disabled: !document.body.classList.contains('admin-mode'),
                ghostClass: 'sortable-ghost',
                onEnd: function (evt) {
                    const newCards = Array.from(gridContainer.querySelectorAll('.card:not(.add-new-card)'));
                    const orderedNames = newCards.map(c => c.dataset.service);
                    
                    localStorage.setItem('it-lab-custom-order', JSON.stringify(orderedNames));

                    // Reorder dashboardServices internally relative to their displayed order
                    dashboardServices.sort((a, b) => {
                        const indexA = orderedNames.indexOf(a.name);
                        const indexB = orderedNames.indexOf(b.name);
                        // If one isn't in orderedNames (e.g. filtered out), leave it at the end
                        if(indexA === -1) return 1;
                        if(indexB === -1) return -1;
                        return indexA - indexB;
                    });
                }
            });
        }
        
        // Re-initialize tooltips for new dynamic elements
        initTooltips();
    }

    function setupCardEvents() {
        allCards.forEach(card => {
            card.querySelectorAll('.btn, .action-sm').forEach(btn => {
                btn.addEventListener('click', createRipple);
            });

            card.addEventListener('click', (e) => {
                if (e.target.closest('.action-bar') || e.target.closest('a')) return;
                
                if (window.isFullCard && !document.body.classList.contains('admin-mode') && e.target.tagName !== 'A' && !e.target.closest('button')) {
                    const link = card.querySelector('a');
                    if(link) window.open(link.href, window.isNewTab ? '_blank' : '_self');
                }
            });

            const editBtn = card.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!document.body.classList.contains('admin-mode')) {
                        alert("Vous devez activer le Mode Admin pour éditer un service.");
                        return;
                    }
                    openAdminModal(editBtn.dataset.id);
                });
            }

            const deleteBtn = card.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!document.body.classList.contains('admin-mode')) {
                        alert("Vous devez activer le Mode Admin pour supprimer un service.");
                        return;
                    }
                    if(confirm("Voulez-vous vraiment supprimer ce service ?")) {
                        dashboardServices = dashboardServices.filter(s => String(s.id) !== String(deleteBtn.dataset.id));
                        generateCategoryTabs();
                        generateCards();
                    }
                });
            }

            const favBtn = card.querySelector('.fav-btn');
            if (favBtn) {
                favBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const srv = dashboardServices.find(s => String(s.id) === String(favBtn.dataset.id));
                    if(srv) {
                        srv.favorite = !srv.favorite;
                        if(window.saveFavoritesLocally) window.saveFavoritesLocally();
                        if(srv.favorite && window.fireConfetti) window.fireConfetti(e.clientX, e.clientY);
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
                
                // Toggle drag & drop availability
                if(sortableInstance) {
                    sortableInstance.option('disabled', !isAdmin);
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
        if(cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const modal = document.getElementById('admin-modal');
                if(modal) modal.classList.remove('active');
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
                newService.favorite = dashboardServices[index].favorite;
                dashboardServices[index] = newService;
            }
        } else {
            dashboardServices.push(newService);
        }
        
        if (window.saveFavoritesLocally) window.saveFavoritesLocally();

        const modal = document.getElementById('admin-modal');
        if(modal) modal.classList.remove('active');
        
        generateCategoryTabs();
        generateCards();
    }
    
    // Bind form submission
    const form = document.getElementById('service-form');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveService();
        });
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

    // --- Command Palette (Ctrl+K) Logic ---
    const cmdOverlay = document.getElementById('command-palette-overlay');
    const cmdInput = document.getElementById('cmd-input');
    const cmdResults = document.getElementById('cmd-results');
    let cmdSelectedIndex = 0;
    let filteredCmdServices = [];

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openCommandPalette();
        }
        if (e.key === 'Escape' && cmdOverlay && cmdOverlay.classList.contains('active')) {
            closeCommandPalette();
        }
    });

    if(cmdOverlay) {
        cmdOverlay.addEventListener('click', (e) => {
            if(e.target === cmdOverlay) closeCommandPalette();
        });
    }

    function openCommandPalette() {
        if(!cmdOverlay) return;
        cmdOverlay.classList.add('active');
        cmdInput.value = '';
        filterCommandPalette('');
        setTimeout(() => cmdInput.focus(), 50);
    }

    function closeCommandPalette() {
        if(cmdOverlay) cmdOverlay.classList.remove('active');
    }

    if(cmdInput) {
        cmdInput.addEventListener('input', (e) => filterCommandPalette(e.target.value));
        cmdInput.addEventListener('keydown', (e) => {
            if(!filteredCmdServices.length) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                cmdSelectedIndex = (cmdSelectedIndex + 1) % filteredCmdServices.length;
                renderCommandResults();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                cmdSelectedIndex = (cmdSelectedIndex - 1 + filteredCmdServices.length) % filteredCmdServices.length;
                renderCommandResults();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = filteredCmdServices[cmdSelectedIndex];
                if(selected && selected.url) {
                    window.open(selected.url, window.isNewTab ? '_blank' : '_self');
                    closeCommandPalette();
                } else if (filteredCmdServices.length === 0) {
                    const fallbackStr = localStorage.getItem('it-lab-search-fallback') || 'google';
                    const term = encodeURIComponent(cmdInput.value);
                    if(fallbackStr === 'google') {
                        window.open('https://google.com/search?q=' + term, window.isNewTab ? '_blank' : '_self');
                    } else if(fallbackStr === 'duckduckgo') {
                        window.open('https://duckduckgo.com/?q=' + term, window.isNewTab ? '_blank' : '_self');
                    }
                    closeCommandPalette();
                }
            }
        });
    }

    function filterCommandPalette(term) {
        term = term.toLowerCase();
        filteredCmdServices = dashboardServices.filter(s => 
            s.name.toLowerCase().includes(term) || 
            (s.description && s.description.toLowerCase().includes(term)) ||
            (s.type && s.type.toLowerCase().includes(term))
        );
        cmdSelectedIndex = 0;
        renderCommandResults();
    }

    function renderCommandResults() {
        if(!cmdResults) return;
        cmdResults.innerHTML = '';
        if(filteredCmdServices.length === 0) {
            cmdResults.innerHTML = '<li class="cmd-item" style="justify-content:center;">Aucun résultat trouvé</li>';
            return;
        }

        filteredCmdServices.forEach((service, index) => {
            const li = document.createElement('li');
            li.className = `cmd-item ${index === cmdSelectedIndex ? 'selected' : ''}`;
            
            let iconHtml = service.icon ? `<i data-lucide="${service.icon}" class="cmd-item-icon"></i>` : `<i data-lucide="server" class="cmd-item-icon"></i>`;
            
            li.innerHTML = `
                ${iconHtml}
                <span class="cmd-item-title">${service.name}</span>
                <span class="cmd-item-cat">${service.type || 'Autre'}</span>
            `;
            
            li.addEventListener('mouseenter', () => {
                cmdSelectedIndex = index;
                renderCommandResults(); // Re-render to update selection visual
            });
            li.addEventListener('click', () => {
                if(service.url) {
                    window.open(service.url, '_blank');
                    closeCommandPalette();
                }
            });
            cmdResults.appendChild(li);
        });
        lucide.createIcons();
        
        // Auto scroll to selected
        const selectedEl = cmdResults.querySelector('.selected');
        if(selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }

    // --- Custom Context Menu Logic ---
    const ctxMenu = document.getElementById('custom-context-menu');
    let ctxTargetId = null;
    let ctxTargetUrl = null;

    document.addEventListener('contextmenu', (e) => {
        const cardTarget = e.target.closest('.card:not(.add-new-card)');
        
        if (cardTarget && ctxMenu) {
            e.preventDefault();
            ctxTargetId = cardTarget.dataset.id;
            ctxTargetUrl = cardTarget.dataset.url;
            
            ctxMenu.style.display = 'block';
            let x = e.pageX;
            let y = e.pageY;
            
            // Adjust bounds
            if (x + ctxMenu.offsetWidth > window.innerWidth) x -= ctxMenu.offsetWidth;
            if (y + ctxMenu.offsetHeight > window.innerHeight) y -= ctxMenu.offsetHeight;
            
            ctxMenu.style.left = `${x}px`;
            ctxMenu.style.top = `${y}px`;
            
            // small delay to allow display flex to apply before opacity transition
            setTimeout(() => ctxMenu.classList.add('active'), 10);
        } else if(ctxMenu) {
            closeContextMenu();
        }
    });

    document.addEventListener('click', () => closeContextMenu());
    document.addEventListener('scroll', () => closeContextMenu());

    function closeContextMenu() {
        if(ctxMenu) {
            ctxMenu.classList.remove('active');
            setTimeout(() => { if(!ctxMenu.classList.contains('active')) ctxMenu.style.display = 'none'; }, 100);
        }
    }

    if (ctxMenu) {
        document.getElementById('ctx-open').addEventListener('click', () => {
            if(ctxTargetUrl) window.open(ctxTargetUrl, '_blank');
        });
        document.getElementById('ctx-copy-url').addEventListener('click', () => {
            if(ctxTargetUrl) navigator.clipboard.writeText(ctxTargetUrl).then(() => alert("URL copiée !"));
        });
        document.getElementById('ctx-copy-ip').addEventListener('click', () => {
            if(ctxTargetUrl) {
                try {
                    const urlObj = new URL(ctxTargetUrl);
                    navigator.clipboard.writeText(urlObj.hostname).then(() => alert("IP/Hostname copiée !"));
                } catch(e) { }
            }
        });
        document.getElementById('ctx-fav').addEventListener('click', () => {
            if(ctxTargetId) {
                const srv = dashboardServices.find(s => String(s.id) === String(ctxTargetId));
                if(srv) {
                    srv.favorite = !srv.favorite;
                    if(window.saveFavoritesLocally) window.saveFavoritesLocally();
                    generateCards();
                }
            }
        });
        document.getElementById('ctx-edit').addEventListener('click', () => {
            if(!document.body.classList.contains('admin-mode')) {
                alert("Vous devez activer le Mode Admin pour éditer un service.");
                return;
            }
            if(ctxTargetId) openAdminModal(ctxTargetId);
        });
    }

    function initWeather() {
        const weatherWidget = document.getElementById('weather-widget');
        if (!weatherWidget) return;
        
        const weatherSpan = weatherWidget.querySelector('span');
        const weatherIcon = weatherWidget.querySelector('i');

        fetch('https://get.geojs.io/v1/ip/geo.json')
            .then(res => res.json())
            .then(data => {
                const lat = data.latitude;
                const lon = data.longitude;
                return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`).then(r => r.json()).then(w => ({city: data.city, weather: w}));
            })
            .then(data => {
                const temp = Math.round(data.weather.current_weather.temperature);
                const code = data.weather.current_weather.weathercode;
                
                weatherSpan.textContent = `${temp}°C (${data.city})`;
                
                let iconName = 'cloud';
                if (code === 0) iconName = 'sun';
                else if (code >= 1 && code <= 3) iconName = 'cloud-sun';
                else if (code >= 45 && code <= 48) iconName = 'cloud-fog';
                else if (code >= 51 && code <= 67) iconName = 'cloud-rain';
                else if (code >= 71 && code <= 77) iconName = 'snowflake';
                else if (code >= 80 && code <= 82) iconName = 'cloud-showers-heavy';
                else if (code >= 95) iconName = 'cloud-lightning';
                
                weatherIcon.setAttribute('data-lucide', iconName);
                if(window.lucide) lucide.createIcons();
            })
            .catch(err => {
                console.error("Météo erreur:", err);
                weatherSpan.textContent = "N/A";
            });
    }
    initWeather();
    setInterval(initWeather, 3600000);

    // === Custom Cursor ===
    const cursorDot = document.querySelector('.custom-cursor-dot');
    const cursorRing = document.querySelector('.custom-cursor-ring');

    if (cursorDot && cursorRing && window.matchMedia('(pointer: fine)').matches) {
        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top  = mouseY + 'px';
        });

        // Ring follows with smooth lerp
        function animateCursor() {
            ringX += (mouseX - ringX) * 0.12;
            ringY += (mouseY - ringY) * 0.12;
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top  = ringY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover state on interactive elements
        document.querySelectorAll('a, button, .card, .category-tab, .theme-dot, .action-sm').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });

        // Hide cursor when leaving window
        document.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
            cursorRing.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            cursorDot.style.opacity = '1';
            cursorRing.style.opacity = '1';
        });
    }

    // === Confetti on Favorite & Save ===
    window.fireConfetti = function(x, y) {
        if (typeof confetti !== 'function') return;
        confetti({
            particleCount: 60,
            spread: 70,
            origin: {
                x: x / window.innerWidth,
                y: y / window.innerHeight
            },
            colors: [getComputedStyle(document.documentElement).getPropertyValue('--accent-main').trim(), '#ffffff', '#9d50bb'],
            startVelocity: 30,
            ticks: 100,
            gravity: 0.8,
            scalar: 0.9
        });
    };

});

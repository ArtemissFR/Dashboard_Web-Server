if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('✅ PWA: Service Worker enregistré (', reg.scope, ')'))
        .catch(err => console.log('❌ PWA: Échec SW:', err));
    });
}

// Logic d'installation PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('✨ PWA: Dashboard prêt à être installé ! Cherchez l’icône "+" dans la barre d’adresse.');
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('📱 PWA: Satel Lab installé avec succès !');
});

// Typography loader
const savedFont = localStorage.getItem('it-lab-font') || "'Plus Jakarta Sans', sans-serif";
document.documentElement.style.setProperty('--ui-font', savedFont);

document.addEventListener('DOMContentLoaded', () => {
    // === PIN Verification ===
    const savedPin = localStorage.getItem('it-lab-pin');
    const pinLockOverlay = document.getElementById('pin-lock-overlay');
    const pinInputs = document.querySelectorAll('.pin-digit');
    if (savedPin && pinLockOverlay) {
        let currentPin = '';
        pinInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if(e.target.value) {
                    if (index < pinInputs.length - 1) pinInputs[index + 1].focus();
                    else {
                        currentPin = Array.from(pinInputs).map(i => i.value).join('');
                        if (currentPin === savedPin) {
                            pinLockOverlay.classList.add('hidden');
                            setTimeout(() => pinLockOverlay.remove(), 500);
                        } else {
                            document.getElementById('pin-error').style.display = 'block';
                            pinInputs.forEach(i => { i.classList.add('error'); i.value = ''; });
                            setTimeout(() => { pinInputs.forEach(i => i.classList.remove('error')); pinInputs[0].focus(); }, 400);
                        }
                    }
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) pinInputs[index - 1].focus();
            });
        });
    } else if(pinLockOverlay) {
        pinLockOverlay.classList.add('hidden');
        setTimeout(() => pinLockOverlay.remove(), 500);
    }

    // === Scratchpad Widget ===
    const scratchpadContent = document.getElementById('scratchpad-content');
    const scratchpadWidget = document.getElementById('scratchpad-widget');
    if(scratchpadContent) {
        scratchpadContent.value = localStorage.getItem('it-lab-notes') || '';
        document.getElementById('scratchpad-fab').addEventListener('click', () => {
            scratchpadWidget.classList.toggle('active');
            if(scratchpadWidget.classList.contains('active')) scratchpadContent.focus();
        });
        document.getElementById('close-scratchpad').addEventListener('click', () => scratchpadWidget.classList.remove('active'));
        scratchpadContent.addEventListener('input', (e) => localStorage.setItem('it-lab-notes', e.target.value));
    }

    // Initialize Lucide icons
    lucide.createIcons();

    // Update Time and Date
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    const greetingElement = document.getElementById('greeting');
    let sortableInstance = null;

    // === UI Sounds ===
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    window.playSound = function(type) {
        if(localStorage.getItem('it-lab-sounds') !== 'true') return;
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        if(type === 'hover') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.01, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            osc.start(); osc.stop(audioCtx.currentTime + 0.05);
        } else if(type === 'click') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        }
    };
    
    const uiSoundsToggle = document.getElementById('ui-sounds-toggle');
    if(uiSoundsToggle) {
        uiSoundsToggle.checked = localStorage.getItem('it-lab-sounds') === 'true';
        uiSoundsToggle.addEventListener('change', e => {
            localStorage.setItem('it-lab-sounds', e.target.checked);
            if(e.target.checked) window.playSound('click');
        });
    }

    // === Drag & Drop global pour ajout URL ===
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
        if(url && (url.startsWith('http://') || url.startsWith('https://'))) {
            openAdminModal();
            const urlField = document.getElementById('service-url');
            const nameField = document.getElementById('service-name');
            if(urlField) urlField.value = url;
            if(nameField) {
                try { nameField.value = new URL(url).hostname; } catch(err){}
            }
        }
    });

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
        
        speedVal = parseFloat(localStorage.getItem('it-lab-part-speed') || '1.5');
        const weatherFxToggle = localStorage.getItem('it-lab-weather-fx') !== 'false';
        const currentWeather = localStorage.getItem('it-lab-last-weather') || '';
        
        let shapeType = "circle";
        let direction = "none";
        let straight = false;
        
        if (weatherFxToggle && (currentWeather.includes('pluie') || currentWeather.includes('neige') || currentWeather.includes('averse'))) {
            shapeType = currentWeather.includes('neige') ? "circle" : "edge";
            direction = "bottom";
            straight = true;
            speedVal = currentWeather.includes('neige') ? speedVal * 2 : speedVal * 5;
            numberValue = currentWeather.includes('neige') ? numberValue * 2 : numberValue * 2.5;
        }

        if (window.particlesJS) {
            particlesJS('particles-js', {
                "particles": {
                    "number": { "value": numberValue, "density": { "enable": true, "value_area": 800 } },
                    "color": { "value": pcolor },
                    "shape": { "type": shapeType },
                    "opacity": { "value": shapeType === 'edge' ? 0.5 : 0.2, "random": false },
                    "size": { "value": shapeType === 'edge' ? 5 : 3, "random": true },
                    "line_linked": { "enable": !straight, "distance": 150, "color": pcolor, "opacity": 0.1, "width": 1 },
                    "move": { "enable": true, "speed": speedVal, "direction": direction, "random": true, "straight": straight, "out_mode": "out", "bounce": false }
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

    // Typography setup
    const fontSelect = document.getElementById('ui-font');
    if(fontSelect) {
        fontSelect.value = savedFont;
        fontSelect.addEventListener('change', (e) => {
            localStorage.setItem('it-lab-font', e.target.value);
            document.documentElement.style.setProperty('--ui-font', e.target.value);
        });
    }

    // Weather particles toggle
    const wFxToggle = document.getElementById('weather-fx-toggle');
    if(wFxToggle) {
        wFxToggle.checked = localStorage.getItem('it-lab-weather-fx') !== 'false';
        wFxToggle.addEventListener('change', e => {
            localStorage.setItem('it-lab-weather-fx', e.target.checked);
            initParticles();
        });
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
    document.addEventListener('mousemove', (e) => {
        if(e.target.closest('.card') || e.target.closest('.btn') || e.target.closest('.action-sm') || e.target.closest('.theme-dot')) {
            if(!e.target.dataset.hovered) {
                e.target.dataset.hovered = true;
                window.playSound('hover');
                e.target.addEventListener('mouseleave', () => e.target.dataset.hovered = '', {once: true});
            }
        }
    });

    const closeFolderBtn = document.getElementById('close-folder');
    if(closeFolderBtn) closeFolderBtn.addEventListener('click', () => {
        const modal = document.getElementById('folder-modal');
        if(modal) modal.classList.remove('active');
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
        window.playSound('click');
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
                
                const loader = document.getElementById('loader-overlay');
                if(loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.classList.add('hidden'), 800);
                }
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
        
        const types = new Set();
        dashboardServices.forEach(s => {
            if(s.type) s.type.split(',').forEach(t => types.add(t.trim().toLowerCase()));
            else types.add('autre');
        });
        
        let hasUsage = Object.keys(JSON.parse(localStorage.getItem('it-lab-usage') || '{}')).length > 0;
        
        let tabsHtml = `<div class="tab-indicator"></div><button class="category-tab" data-category="all">Tous</button>`;
        if(hasUsage) {
            tabsHtml += `<button class="category-tab" data-category="top">🔥 Top Consultés</button>`;
        }
        types.forEach(type => {
            tabsHtml += `<button class="category-tab" data-category="${type}">${capitalize(type)}</button>`;
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

        // Custom Color Picker
        const customColorPicker = document.getElementById('custom-color-picker');
        if(customColorPicker) {
            customColorPicker.value = savedTheme || '#00d2ff';
            customColorPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                setTheme(color);
                themeDots.forEach(d => d.classList.remove('active'));
            });
        }

        themeDots.forEach(dot => {
            dot.addEventListener('click', () => {
                themeDots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                
                const color = dot.dataset.color;
                if(customColorPicker) customColorPicker.value = color;
                setTheme(color);
                window.playSound('click');
            });
        });

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

        let processedFolders = new Set();

        dashboardServices.forEach(service => {
            if(service.folder && !document.body.classList.contains('admin-mode')) {
                if(processedFolders.has(service.folder)) return;
                processedFolders.add(service.folder);
                
                const card = document.createElement('div');
                card.className = `card folder-card`;
                card.dataset.category = (service.type || 'Autre').toLowerCase();
                
                const folderServices = dashboardServices.filter(s => s.folder === service.folder);
                
                card.innerHTML = `
                    <div class="card-sparkline" style="background:var(--text-muted)"></div>
                    <div class="card-header">
                        <div class="card-icon-box"><i data-lucide="folder" class="icon"></i></div>
                    </div>
                    <div class="card-body">
                        <h3>📁 ${service.folder}</h3>
                        <p>${folderServices.length} éléments</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-outline open-folder-btn" data-folder="${service.folder}"><i data-lucide="grid" style="width:16px;height:16px;"></i> Ouvrir Dossier</button>
                    </div>
                `;
                gridContainer.appendChild(card);
            } else {
                const card = document.createElement('div');
                card.className = `card card-${service.type ? service.type.split(',')[0].trim() : 'default'}`;
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
                    <div class="card-sparkline"></div>
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
                        ${service.folder && document.body.classList.contains('admin-mode') ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;"><i data-lucide="folder" style="width:12px;height:12px;vertical-align:-2px;"></i> ${service.folder}</div>` : ''}
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
                
                // Set usage badge overlay inside card header if it exists
                const usageStats = JSON.parse(localStorage.getItem('it-lab-usage') || '{}');
                if (usageStats[service.id]) {
                    const badge = document.createElement('div');
                    badge.className = 'top-badge';
                    badge.textContent = usageStats[service.id];
                    badge.style.display = 'none'; // Only show if we toggle "Top Consultés"? Very cool.
                    card.querySelector('.card-header').appendChild(badge);
                }

                gridContainer.appendChild(card);
            }
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
                
                // Track usage
                if(card.dataset.id && !card.classList.contains('folder-card')) {
                    const clicks = JSON.parse(localStorage.getItem('it-lab-usage') || '{}');
                    clicks[card.dataset.id] = (clicks[card.dataset.id] || 0) + 1;
                    localStorage.setItem('it-lab-usage', JSON.stringify(clicks));
                }

                if (window.isFullCard && !document.body.classList.contains('admin-mode') && e.target.tagName !== 'A' && !e.target.closest('button')) {
                    const link = card.querySelector('a');
                    if(link) window.open(link.href, window.isNewTab ? '_blank' : '_self');
                }
            });

            const folderBtn = card.querySelector('.open-folder-btn');
            if(folderBtn) {
                folderBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const fname = folderBtn.dataset.folder;
                    document.getElementById('folder-modal-title').textContent = `📁 ${fname}`;
                    const fGrid = document.getElementById('folder-grid');
                    fGrid.innerHTML = '';
                    
                    const folderItems = dashboardServices.filter(s => s.folder === fname);
                    folderItems.forEach(item => {
                        const fi = document.createElement('div');
                        fi.className = 'card';
                        fi.style.padding = '16px';
                        let iHtml = item.logo ? `<img src="${item.logo}" class="icon-logo">` : `<i data-lucide="${item.icon || 'server'}" class="icon"></i>`;
                        fi.innerHTML = `
                            <div class="card-sparkline" style="height:30px;"></div>
                            <div class="card-header" style="margin-bottom:12px;">
                                <div class="card-icon-box" style="width:36px;height:36px;">${iHtml}</div>
                                <h4>${item.name}</h4>
                            </div>
                            <div class="card-footer" style="padding-top:0; border:none; display:block;">
                                <a href="${item.url}" class="btn btn-outline" target="${window.isNewTab ? '_blank' : '_self'}" style="width:100%; justify-content:center;">Ouvrir</a>
                            </div>
                        `;
                        fGrid.appendChild(fi);
                        fi.addEventListener('mouseenter', () => window.playSound('hover'));
                    });
                    lucide.createIcons();
                    document.getElementById('folder-modal').classList.add('active');
                });
            }

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
        
        if (currentCategory === 'top') {
            const usage = JSON.parse(localStorage.getItem('it-lab-usage') || '{}');
            allCards.forEach(card => {
                const uses = usage[card.dataset.id] || 0;
                const badge = card.querySelector('.top-badge');
                if (badge) badge.style.display = 'block';

                if (uses > 0 && !card.classList.contains('folder-card')) {
                    card.style.display = 'flex';
                    card.style.order = -uses;
                    card.style.opacity = '1';
                } else {
                    card.style.display = 'none';
                }
            });
            return;
        }

        allCards.forEach(card => {
            const badge = card.querySelector('.top-badge');
            if (badge) badge.style.display = 'none';
            card.style.order = 0;

            const name = card.querySelector('h3').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();
            const catStr = card.dataset.category || '';
            const catsArr = catStr.split(',').map(c => c.trim().toLowerCase());
            
            const matchSearch = name.includes(term) || desc.includes(term);
            const matchCategory = currentCategory === 'all' || catsArr.includes(currentCategory);

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
        const exportBtn = document.getElementById('export-profile');
        const importBtn = document.getElementById('import-profile');
        const importFile = document.getElementById('import-profile-file');
        
        const pinSet = document.getElementById('admin-pin-set');
        if(pinSet) {
            pinSet.value = localStorage.getItem('it-lab-pin') || '';
            pinSet.addEventListener('change', (e) => localStorage.setItem('it-lab-pin', e.target.value));
        }

        if (adminToggle) {
            adminToggle.addEventListener('click', () => {
                document.body.classList.toggle('admin-mode');
                const isAdmin = document.body.classList.contains('admin-mode');
                
                adminToggle.style.background = isAdmin ? 'var(--accent-main)' : '';
                adminToggle.style.color = isAdmin ? 'var(--bg-dark)' : '';
                
                if(exportBtn) exportBtn.style.display = isAdmin ? 'block' : 'none';
                if(importBtn) importBtn.style.display = isAdmin ? 'block' : 'none';
                
                // Toggle drag & drop availability
                if(sortableInstance) {
                    sortableInstance.option('disabled', !isAdmin);
                }
                
                generateCards(); // Re-render to show hidden add buttons
            });
        }

        if(exportBtn) {
            exportBtn.addEventListener('click', () => {
                const profile = {};
                for(let i=0; i<localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if(key.startsWith('it-lab-')) profile[key] = localStorage.getItem(key);
                }
                profile['dashboardServices'] = dashboardServices;
                
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile));
                const dlAnchorElem = document.createElement('a');
                dlAnchorElem.setAttribute("href", dataStr);
                dlAnchorElem.setAttribute("download", "profile.itlab");
                dlAnchorElem.click();
            });
        }

        if(importFile) {
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = function(evt) {
                    try {
                        const profile = JSON.parse(evt.target.result);
                        Object.keys(profile).forEach(k => {
                            if(k.startsWith('it-lab-')) localStorage.setItem(k, profile[k]);
                        });
                        alert("Profil IT-Lab importé ! (Note: Rechargez et vérifiez votre config.json côté serveur si de nouveaux services ont été ajoutés)");
                        window.location.reload();
                    } catch(err) { alert("Fichier .itlab invalide"); }
                };
                reader.readAsText(file);
            });
        }

        const downloadBtn = document.getElementById('download-config');
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
        const folderField = document.getElementById('service-folder');

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
                if(folderField) folderField.value = service.folder || '';
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
            type: document.getElementById('service-type').value.toLowerCase(),
            description: document.getElementById('service-desc').value,
            url: document.getElementById('service-url').value,
        };
        const folderVal = document.getElementById('service-folder') ? document.getElementById('service-folder').value.trim() : '';
        if(folderVal) newService.folder = folderVal;

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

    if (cursorDot && window.matchMedia('(pointer: fine)').matches) {
        let mouseX = 0, mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top  = mouseY + 'px';
        });

        // Hover state on interactive elements
        document.querySelectorAll('a, button, .card, .category-tab, .theme-dot, .action-sm').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });

        // Hide cursor when leaving window
        document.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            cursorDot.style.opacity = '1';
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

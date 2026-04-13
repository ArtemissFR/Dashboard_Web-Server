/**
 * script.js — Satel Lab Premium Dashboard
 * Refactored Architecture
 */

(function () {
    'use strict';

    // ==========================================
    // PWA & Core Initialization
    // ==========================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('✅ PWA: SW registered', reg.scope))
                .catch(err => console.log('❌ PWA: SW failed', err));
        });
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    // ==========================================
    // Core State
    // ==========================================
    const State = {
        services: [],
        categories: new Set(),
        currentCategory: 'all',
        sortableInstance: null,
        isAdmin: false
    };

    // ==========================================
    // Audio Manager
    // ==========================================
    const AudioManager = {
        ctx: new (window.AudioContext || window.webkitAudioContext)(),
        play(type) {
            if (localStorage.getItem('it-lab-sounds') !== 'true') return;
            if (this.ctx.state === 'suspended') this.ctx.resume();
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            if (type === 'hover') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                osc.start(); osc.stop(this.ctx.currentTime + 0.05);
            } else if (type === 'click') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
                osc.start(); osc.stop(this.ctx.currentTime + 0.1);
            }
        }
    };

    // ==========================================
    // Theme & Settings Manager
    // ==========================================
    const ThemeManager = {
        init() {
            // Typography
            const savedFont = localStorage.getItem('it-lab-font') || "'Plus Jakarta Sans', sans-serif";
            document.documentElement.style.setProperty('--ui-font', savedFont);
            const fontEl = document.getElementById('ui-font');
            if (fontEl) {
                fontEl.value = savedFont;
                fontEl.addEventListener('change', e => {
                    localStorage.setItem('it-lab-font', e.target.value);
                    document.documentElement.style.setProperty('--ui-font', e.target.value);
                });
            }

            // Scale
            const savedScale = localStorage.getItem('it-lab-ui-scale') || 'standard';
            this.applyScale(savedScale);
            const scaleEl = document.getElementById('ui-scale');
            if (scaleEl) {
                scaleEl.value = savedScale;
                scaleEl.addEventListener('change', e => {
                    localStorage.setItem('it-lab-ui-scale', e.target.value);
                    this.applyScale(e.target.value);
                });
            }

            // Accent Color
            const savedColor = localStorage.getItem('it-lab-theme') || '#00d2ff';
            this.setAccent(savedColor);
            
            const colorPicker = document.getElementById('custom-color-picker');
            const themeDots = document.querySelectorAll('.theme-dot');
            
            if (colorPicker) {
                colorPicker.value = savedColor;
                colorPicker.addEventListener('input', e => {
                    this.setAccent(e.target.value);
                    themeDots.forEach(d => d.classList.remove('active'));
                });
            }

            themeDots.forEach(dot => {
                if (dot.dataset.color === savedColor) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    themeDots.forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                    const c = dot.dataset.color;
                    if(colorPicker) colorPicker.value = c;
                    this.setAccent(c);
                    AudioManager.play('click');
                });
            });

            // Light/Dark Mode
            const savedMode = localStorage.getItem('it-lab-color-def') || 'auto';
            const modeEl = document.getElementById('color-match-mode');
            if (modeEl) {
                modeEl.value = savedMode;
                modeEl.addEventListener('change', e => {
                    localStorage.setItem('it-lab-color-def', e.target.value);
                    this.applyColorMode(e.target.value);
                });
            }
            this.applyColorMode(savedMode);
            
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
                if (localStorage.getItem('it-lab-color-def') === 'auto') this.applyColorMode('auto');
            });
            
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    const isLight = document.documentElement.classList.contains('light-mode');
                    const newMode = isLight ? 'dark' : 'light';
                    localStorage.setItem('it-lab-color-def', newMode);
                    if (modeEl) modeEl.value = newMode;
                    this.applyColorMode(newMode);
                });
            }
        },
        applyScale(scale) {
            if(scale === 'compact') document.documentElement.style.fontSize = '14px';
            else if(scale === 'large') document.documentElement.style.fontSize = '18px';
            else document.documentElement.style.fontSize = '16px';
        },
        setAccent(color) {
            document.documentElement.style.setProperty('--accent-main', color);
            localStorage.setItem('it-lab-theme', color);
        },
        applyColorMode(mode) {
            let finalMode = mode;
            if (mode === 'auto') {
                finalMode = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
            }
            const themeIcon = document.getElementById('theme-icon');
            if (finalMode === 'light') {
                document.documentElement.classList.add('light-mode');
                if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
            } else {
                document.documentElement.classList.remove('light-mode');
                if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
            }
            if (window.lucide) lucide.createIcons();
            
            // Re-init particles if changed
            if (window.pJSDom && window.pJSDom.length > 0) {
                const pJS = window.pJSDom[0].pJS;
                const pcolor = finalMode === 'light' ? "#000000" : "#ffffff";
                pJS.particles.color.value = pcolor;
                pJS.particles.line_linked.color = pcolor;
                pJS.fn.particlesRefresh();
            }
        }
    };

    const SettingsManager = {
        init() {
            // Layout
            const gridContainer = document.getElementById('services-grid');
            const layoutGrid = document.getElementById('layout-grid');
            const layoutList = document.getElementById('layout-list');
            
            const savedLayout = localStorage.getItem('it-lab-layout') || 'grid';
            if (savedLayout === 'list' && gridContainer) {
                gridContainer.classList.add('list-view');
                if(layoutList) layoutList.classList.add('active');
                if(layoutGrid) layoutGrid.classList.remove('active');
            }

            if(layoutGrid && layoutList) {
                layoutGrid.addEventListener('click', e => {
                    gridContainer?.classList.remove('list-view');
                    layoutGrid.classList.add('active');
                    layoutList.classList.remove('active');
                    localStorage.setItem('it-lab-layout', 'grid');
                });
                layoutList.addEventListener('click', e => {
                    gridContainer?.classList.add('list-view');
                    layoutList.classList.add('active');
                    layoutGrid.classList.remove('active');
                    localStorage.setItem('it-lab-layout', 'list');
                });
            }

            // Toggles
            this.bindToggle('time-24h', 'it-lab-24h', true);
            this.bindToggle('time-seconds', 'it-lab-sec', true);
            this.bindToggle('link-newtab', 'it-lab-newtab', true, val => window.isNewTab = val);
            this.bindToggle('link-fullcard', 'it-lab-fullcard', true, val => window.isFullCard = val);
            this.bindToggle('ui-sounds-toggle', 'it-lab-sounds', false);
            this.bindToggle('weather-fx-toggle', 'it-lab-weather-fx', true, () => ParticleManager.init());
            this.bindToggle('perf-mode-toggle', 'it-lab-perf', false, val => {
                if(val) document.body.classList.add('perf-mode');
                else document.body.classList.remove('perf-mode');
            });

            // Fallback Search
            const fallbackEl = document.getElementById('search-fallback');
            if(fallbackEl) {
                fallbackEl.value = localStorage.getItem('it-lab-search-fallback') || 'google';
                fallbackEl.addEventListener('change', e => localStorage.setItem('it-lab-search-fallback', e.target.value));
            }

            // Wallpaper
            const wpEl = document.getElementById('custom-wallpaper');
            if(wpEl) {
                const savedWp = localStorage.getItem('it-lab-wallpaper') || '';
                wpEl.value = savedWp;
                this.applyWallpaper(savedWp);
                wpEl.addEventListener('input', e => {
                    localStorage.setItem('it-lab-wallpaper', e.target.value);
                    this.applyWallpaper(e.target.value);
                });
            }

            // Kiosk
            const kioskBtn = document.getElementById('kiosk-mode-btn');
            if(kioskBtn) {
                kioskBtn.addEventListener('click', () => {
                    document.body.classList.add('kiosk-mode');
                    if(document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(err => console.log(err));
                    }
                    UIManager.closeSettings();
                    
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

            // Reset Data
            const resetBtn = document.getElementById('reset-data');
            if(resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if(confirm("Attention ! Toutes vos préférences locales et favoris seront effacés. Le fichier config.json restera intact. Continuer ?")) {
                        Object.keys(localStorage).forEach(key => {
                            if(key.startsWith('it-lab-')) localStorage.removeItem(key);
                        });
                        location.reload();
                    }
                });
            }
        },
        bindToggle(id, storageKey, defVal, callback = null) {
            const el = document.getElementById(id);
            if (!el) return;
            const saved = localStorage.getItem(storageKey);
            const isChecked = saved !== null ? saved === 'true' : defVal;
            el.checked = isChecked;
            if (callback) callback(isChecked);
            
            el.addEventListener('change', e => {
                localStorage.setItem(storageKey, e.target.checked);
                if (callback) callback(e.target.checked);
            });
        },
        applyWallpaper(url) {
            if (url) {
                document.body.style.backgroundImage = `url('${url}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
                
                let overlay = document.getElementById('wp-overlay');
                if(!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'wp-overlay';
                    overlay.style = 'position:fixed;inset:0;z-index:-1;background:var(--bg-base);opacity:0.85;';
                    document.body.appendChild(overlay);
                }
            } else {
                document.body.style.backgroundImage = '';
                const ol = document.getElementById('wp-overlay');
                if(ol) ol.remove();
            }
        }
    };

    // ==========================================
    // Particles 
    // ==========================================
    const ParticleManager = {
        init() {
            const container = document.getElementById('particles-js');
            if (!container) return;
            
            const densitySelect = document.getElementById('particles-density');
            const speedSelect = document.getElementById('particles-speed');
            
            if (densitySelect) {
                if(!densitySelect.dataset.bound) {
                    densitySelect.value = localStorage.getItem('it-lab-part-density') || 'normal';
                    densitySelect.addEventListener('change', e => {
                        localStorage.setItem('it-lab-part-density', e.target.value);
                        this.init();
                    });
                    densitySelect.dataset.bound = 'true';
                }
            }
            if (speedSelect) {
                if(!speedSelect.dataset.bound) {
                    speedSelect.value = localStorage.getItem('it-lab-part-speed') || '1.5';
                    speedSelect.addEventListener('change', e => {
                        localStorage.setItem('it-lab-part-speed', e.target.value);
                        this.init();
                    });
                    speedSelect.dataset.bound = 'true';
                }
            }

            if (window.pJSDom && window.pJSDom.length > 0) {
                window.pJSDom[0].pJS.fn.vendors.destroypJS();
                window.pJSDom = [];
            }
            container.innerHTML = '';

            const densityStr = localStorage.getItem('it-lab-part-density') || 'normal';
            if (densityStr === 'disabled') return;
            
            let numberValue = 60;
            if (densityStr === 'low') numberValue = 30;
            else if (densityStr === 'high') numberValue = 120;
            
            let speedVal = parseFloat(localStorage.getItem('it-lab-part-speed') || '1.5');
            const isLight = document.documentElement.classList.contains('light-mode');
            const pcolor = isLight ? "#000000" : "#ffffff";
            
            const weatherFx = localStorage.getItem('it-lab-weather-fx') !== 'false';
            const cw = localStorage.getItem('it-lab-last-weather') || '';
            
            let shapeType = "circle";
            let direction = "none";
            let straight = false;

            if (weatherFx && (cw.includes('pluie') || cw.includes('neige') || cw.includes('averse'))) {
                shapeType = cw.includes('neige') ? "circle" : "edge";
                direction = "bottom";
                straight = true;
                speedVal = cw.includes('neige') ? speedVal * 2 : speedVal * 5;
                numberValue = cw.includes('neige') ? numberValue * 2 : numberValue * 2.5;
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
        }
    };

    // ==========================================
    // UI Events & Management
    // ==========================================
    const UIManager = {
        init() {
            // Ripple
            document.addEventListener('click', e => {
                const btn = e.target.closest('.btn, .icon-btn, .category-tab');
                if (btn) this.createRipple(e, btn);
            });

            // Hover sound
            document.addEventListener('mousemove', e => {
                const el = e.target.closest('.card, .btn, .action-sm, .theme-dot, .category-tab');
                if (el && !el.dataset.hovered) {
                    el.dataset.hovered = 'true';
                    AudioManager.play('hover');
                    el.addEventListener('mouseleave', () => el.dataset.hovered = '', {once: true});
                }
            });

            // Modals Logic
            document.getElementById('settings-toggle')?.addEventListener('click', () => {
                document.getElementById('settings-modal').classList.add('active');
            });
            document.getElementById('close-settings')?.addEventListener('click', () => this.closeSettings());
            
            document.addEventListener('click', e => {
                if(e.target.classList.contains('modal-overlay')) {
                    e.target.classList.remove('active');
                }
            });

            // Tooltips
            this.initTooltips();

            // Clock update
            setInterval(() => this.updateClock(), 1000);
            this.updateClock();

            // Command Palette (Ctrl+K)
            this.initCommandPalette();

            // Context Menu
            this.initContextMenu();

            // Scratchpad
            this.initScratchpad();

            // PIN Lock
            this.initPinLock();
            
            // Mouse tracker for cards (Glow)
            const grid = document.getElementById('services-grid');
            if (grid) {
                grid.addEventListener('mousemove', e => {
                    const cards = grid.querySelectorAll('.card');
                    for(const card of cards) {
                        const rect = card.getBoundingClientRect();
                        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                    }
                });
            }

            // Drag & Drop external URL
            document.body.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
            document.body.addEventListener('drop', e => {
                e.preventDefault();
                const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
                if(url && url.startsWith('http')) {
                    ServiceManager.openAdminModal();
                    document.getElementById('service-url').value = url;
                    try { document.getElementById('service-name').value = new URL(url).hostname; } catch(err){}
                }
            });
        },
        createRipple(e, button) {
            const circle = document.createElement("span");
            const d = Math.max(button.clientWidth, button.clientHeight);
            const r = d / 2;
            const rect = button.getBoundingClientRect();
            
            circle.style.width = circle.style.height = `${d}px`;
            circle.style.left = `${e.clientX - rect.left - r}px`;
            circle.style.top = `${e.clientY - rect.top - r}px`;
            circle.classList.add("ripple");
            
            const existing = button.querySelector('.ripple');
            if(existing) existing.remove();
            button.appendChild(circle);
            AudioManager.play('click');
        },
        closeSettings() {
            document.getElementById('settings-modal')?.classList.remove('active');
        },
        initTooltips() {
            if (window.tippy) {
                document.querySelectorAll('[title]').forEach(el => {
                    el.setAttribute('data-tippy-content', el.getAttribute('title'));
                    el.removeAttribute('title');
                });
                tippy('[data-tippy-content]', { theme: 'glass', animation: 'scale', arrow: true });
            }
        },
        updateClock() {
            const timeEl = document.getElementById('current-time');
            const dateEl = document.getElementById('current-date');
            const greetingEl = document.getElementById('greeting');
            if (!timeEl || !dateEl) return;
            
            const now = new Date();
            const is24h = localStorage.getItem('it-lab-24h') !== 'false';
            const isSec = localStorage.getItem('it-lab-sec') !== 'false';
            
            timeEl.textContent = now.toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
                second: isSec ? '2-digit' : undefined,
                hour12: !is24h
            });
            dateEl.textContent = now.toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });

            if (greetingEl) {
                const hour = now.getHours();
                if (hour >= 5 && hour < 12) greetingEl.textContent = "Bon matin, Administrateur";
                else if (hour >= 12 && hour < 18) greetingEl.textContent = "Bon après-midi, Administrateur";
                else greetingEl.textContent = "Bonsoir, Administrateur";
            }
        },
        initCommandPalette() {
            const overlay = document.getElementById('command-palette-overlay');
            const input = document.getElementById('cmd-input');
            const results = document.getElementById('cmd-results');
            if (!overlay || !input || !results) return;

            let selectedIndex = 0;
            let filtered = [];

            const render = () => {
                results.innerHTML = '';
                if(!filtered.length) {
                    results.innerHTML = '<li class="cmd-item" style="justify-content:center;">Aucun résultat</li>';
                    return;
                }
                filtered.forEach((s, i) => {
                    const li = document.createElement('li');
                    li.className = `cmd-item ${i === selectedIndex ? 'selected' : ''}`;
                    const icon = s.icon ? `<i data-lucide="${s.icon}" class="cmd-item-icon"></i>` : `<i data-lucide="server" class="cmd-item-icon"></i>`;
                    li.innerHTML = `${icon}<span class="cmd-item-title">${s.name}</span><span class="cmd-item-cat">${s.type || 'Autre'}</span>`;
                    
                    li.addEventListener('mouseenter', () => { selectedIndex = i; render(); });
                    li.addEventListener('click', () => {
                        if(s.url) window.open(s.url, window.isNewTab ? '_blank' : '_self');
                        overlay.classList.remove('active');
                    });
                    results.appendChild(li);
                });
                lucide.createIcons();
                const sel = results.querySelector('.selected');
                if(sel) sel.scrollIntoView({block: 'nearest'});
            };

            const filter = term => {
                term = term.toLowerCase();
                filtered = State.services.filter(s => 
                    s.name.toLowerCase().includes(term) || 
                    (s.description && s.description.toLowerCase().includes(term))
                );
                selectedIndex = 0;
                render();
            };

            document.addEventListener('keydown', e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    overlay.classList.add('active');
                    input.value = '';
                    filter('');
                    setTimeout(() => input.focus(), 50);
                }
                if (e.key === 'Escape' && overlay.classList.contains('active')) {
                    overlay.classList.remove('active');
                }
            });

            document.getElementById('search-trigger')?.addEventListener('click', () => {
                overlay.classList.add('active');
                input.value = '';
                filter('');
                setTimeout(() => input.focus(), 50);
            });

            input.addEventListener('input', e => filter(e.target.value));
            input.addEventListener('keydown', e => {
                if(!filtered.length) {
                    if (e.key === 'Enter') {
                        const fb = localStorage.getItem('it-lab-search-fallback') || 'google';
                        const t = encodeURIComponent(input.value);
                        if(fb === 'google') window.open('https://google.com/search?q=' + t, '_blank');
                        else if(fb === 'duckduckgo') window.open('https://duckduckgo.com/?q=' + t, '_blank');
                        overlay.classList.remove('active');
                    }
                    return;
                }
                if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = (selectedIndex + 1) % filtered.length; render(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length; render(); }
                else if (e.key === 'Enter') {
                    e.preventDefault();
                    const s = filtered[selectedIndex];
                    if(s && s.url) window.open(s.url, window.isNewTab ? '_blank' : '_self');
                    overlay.classList.remove('active');
                }
            });
            overlay.addEventListener('click', e => { if(e.target === overlay) overlay.classList.remove('active'); });
        },
        initContextMenu() {
            const menu = document.getElementById('custom-context-menu');
            if(!menu) return;
            let targetCard = null;

            document.addEventListener('contextmenu', e => {
                const card = e.target.closest('.card:not(.add-new-card)');
                if (card) {
                    e.preventDefault();
                    targetCard = card;
                    menu.style.display = 'block';
                    let x = e.pageX; let y = e.pageY;
                    if (x + menu.offsetWidth > window.innerWidth) x -= menu.offsetWidth;
                    if (y + menu.offsetHeight > window.innerHeight) y -= menu.offsetHeight;
                    menu.style.left = `${x}px`; menu.style.top = `${y}px`;
                    setTimeout(() => menu.classList.add('active'), 10);
                } else {
                    menu.classList.remove('active');
                    setTimeout(() => menu.style.display = 'none', 100);
                }
            });

            document.addEventListener('click', () => { menu.classList.remove('active'); setTimeout(() => menu.style.display = 'none', 100); });
            document.addEventListener('scroll', () => { menu.classList.remove('active'); setTimeout(() => menu.style.display = 'none', 100); });

            document.getElementById('ctx-open')?.addEventListener('click', () => { if(targetCard?.dataset.url) window.open(targetCard.dataset.url, '_blank'); });
            document.getElementById('ctx-copy-url')?.addEventListener('click', () => { if(targetCard?.dataset.url) navigator.clipboard.writeText(targetCard.dataset.url).then(() => alert('URL copiée')); });
            document.getElementById('ctx-copy-ip')?.addEventListener('click', () => { 
                try { navigator.clipboard.writeText(new URL(targetCard.dataset.url).hostname).then(()=>alert('IP sauvegardée')); } catch(e){} 
            });
            document.getElementById('ctx-fav')?.addEventListener('click', () => {
                if(targetCard?.dataset.id) {
                    const s = State.services.find(x => String(x.id) === targetCard.dataset.id);
                    if(s) { s.favorite = !s.favorite; ServiceManager.saveFavorites(); ServiceManager.renderCards(); }
                }
            });
            document.getElementById('ctx-edit')?.addEventListener('click', () => {
                if(!State.isAdmin) return alert("Mode Admin requis.");
                if(targetCard?.dataset.id) ServiceManager.openAdminModal(targetCard.dataset.id);
            });
        },
        initScratchpad() {
            const content = document.getElementById('scratchpad-content');
            const widget = document.getElementById('scratchpad-widget');
            if(!content || !widget) return;

            content.value = localStorage.getItem('it-lab-notes') || '';
            document.getElementById('scratchpad-fab')?.addEventListener('click', () => {
                widget.classList.toggle('active');
                if(widget.classList.contains('active')) content.focus();
            });
            document.getElementById('close-scratchpad')?.addEventListener('click', () => widget.classList.remove('active'));
            content.addEventListener('input', e => localStorage.setItem('it-lab-notes', e.target.value));
        },
        initPinLock() {
            const savedPin = localStorage.getItem('it-lab-pin');
            const overlay = document.getElementById('pin-lock-overlay');
            const inputs = document.querySelectorAll('.pin-digit');
            if (savedPin && overlay && savedPin.trim() !== '') {
                inputs.forEach((input, index) => {
                    input.addEventListener('input', e => {
                        if(e.target.value) {
                            if (index < inputs.length - 1) inputs[index + 1].focus();
                            else {
                                const currentPin = Array.from(inputs).map(i => i.value).join('');
                                if (currentPin === savedPin) {
                                    overlay.classList.add('hidden');
                                    setTimeout(() => overlay.remove(), 400);
                                } else {
                                    document.getElementById('pin-error').style.display = 'block';
                                    inputs.forEach(i => { i.classList.add('error'); i.value = ''; });
                                    setTimeout(() => { inputs.forEach(i => i.classList.remove('error')); inputs[0].focus(); }, 400);
                                }
                            }
                        }
                    });
                    input.addEventListener('keydown', e => {
                        if (e.key === 'Backspace' && !e.target.value && index > 0) inputs[index - 1].focus();
                    });
                });
            } else if (overlay) {
                overlay.classList.add('hidden');
                setTimeout(() => overlay.remove(), 400);
            }
        }
    };

    // ==========================================
    // Weather Component
    // ==========================================
    const WeatherManager = {
        init() {
            this.fetchData();
            setInterval(() => this.fetchData(), 3600000);
        },
        fetchData() {
            const textEl = document.getElementById('weather-text');
            const iconEl = document.querySelector('.weather-icon');
            if (!textEl || !iconEl) return;

            fetch('https://get.geojs.io/v1/ip/geo.json')
                .then(res => res.json())
                .then(d => fetch(`https://api.open-meteo.com/v1/forecast?latitude=${d.latitude}&longitude=${d.longitude}&current_weather=true`).then(r => r.json()).then(w => ({city: d.city, weather: w})))
                .then(data => {
                    const temp = Math.round(data.weather.current_weather.temperature);
                    const code = data.weather.current_weather.weathercode;
                    textEl.textContent = `${temp}°C (${data.city})`;
                    
                    let iconName = 'cloud';
                    if (code === 0) iconName = 'sun';
                    else if (code >= 1 && code <= 3) iconName = 'cloud-sun';
                    else if (code >= 45 && code <= 48) iconName = 'cloud-fog';
                    else if (code >= 51 && code <= 67) iconName = 'cloud-rain';
                    else if (code >= 71 && code <= 77) iconName = 'snowflake';
                    else if (code >= 80 && code <= 82) iconName = 'cloud-showers-heavy';
                    else if (code >= 95) iconName = 'cloud-lightning';
                    
                    iconEl.setAttribute('data-lucide', iconName);
                    if(window.lucide) lucide.createIcons();
                })
                .catch(() => textEl.textContent = "N/A");
        }
    };

    // ==========================================
    // Services & Cards Manager
    // ==========================================
    const ServiceManager = {
        init() {
            this.loadConfig();
            this.bindEventDelegation();
            this.initAdminFeatures();
        },
        loadConfig() {
            fetch('config.json')
                .then(r => r.ok ? r.json() : Promise.reject('Erreur HTTP'))
                .then(data => {
                    State.services = data;
                    this.loadFavorites();
                    setTimeout(() => {
                        this.renderCategories();
                        this.renderCards();
                        
                        const loader = document.getElementById('loader-overlay');
                        if (loader) {
                            loader.style.opacity = '0';
                            setTimeout(() => loader.classList.add('hidden'), 800);
                        }
                    }, 300); // Small delay for skeleton showcase
                })
                .catch(err => {
                    document.getElementById('services-grid').innerHTML = '<p style="color:#ef4444;text-align:center;width:100%">Erreur load config.json</p>';
                });
        },
        loadFavorites() {
            try {
                const favIds = JSON.parse(localStorage.getItem('it-lab-favorites') || '[]');
                State.services.forEach(s => s.favorite = favIds.includes(String(s.id)));
            } catch(e){}
        },
        saveFavorites() {
            const favIds = State.services.filter(s => s.favorite).map(s => String(s.id));
            localStorage.setItem('it-lab-favorites', JSON.stringify(favIds));
        },
        renderCategories() {
            const container = document.getElementById('category-tabs');
            if(!container) return;
            
            State.categories.clear();
            State.services.forEach(s => {
                if(s.type) s.type.split(',').forEach(t => State.categories.add(t.trim().toLowerCase()));
                else State.categories.add('autre');
            });

            const hasUsage = Object.keys(JSON.parse(localStorage.getItem('it-lab-usage') || '{}')).length > 0;
            
            let html = `<div class="tab-indicator"></div><button class="category-tab active" data-category="all">Tous</button>`;
            if (hasUsage) html += `<button class="category-tab" data-category="top">🔥 Top Consultés</button>`;
            State.categories.forEach(c => html += `<button class="category-tab" data-category="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`);
            
            container.innerHTML = html;

            container.addEventListener('click', e => {
                const btn = e.target.closest('.category-tab');
                if(!btn) return;
                
                container.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                
                const ind = container.querySelector('.tab-indicator');
                if(ind) {
                    ind.style.width = `${btn.offsetWidth}px`;
                    ind.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
                }
                
                State.currentCategory = btn.dataset.category;
                this.renderCards();
            });

            // Initial indicator
            setTimeout(() => {
                const ind = container.querySelector('.tab-indicator');
                const btn = container.querySelector('.category-tab.active');
                if(ind && btn) {
                    ind.style.width = `${btn.offsetWidth}px`;
                    ind.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
                }
            }, 50);
        },
        renderCards() {
            const grid = document.getElementById('services-grid');
            if(!grid) return;

            // Sort logic
            const customOrderStr = localStorage.getItem('it-lab-custom-order');
            let customOrder = [];
            try { if(customOrderStr) customOrder = JSON.parse(customOrderStr); } catch(e){}

            State.services.sort((a,b) => {
                if(a.favorite && !b.favorite) return -1;
                if(!a.favorite && b.favorite) return 1;
                if(customOrder.length) {
                    const iA = customOrder.indexOf(a.name);
                    const iB = customOrder.indexOf(b.name);
                    if(iA !== -1 && iB !== -1) return iA - iB;
                    if(iA !== -1) return -1;
                    if(iB !== -1) return 1;
                }
                return 0;
            });

            const template = document.createDocumentFragment();
            const usage = JSON.parse(localStorage.getItem('it-lab-usage') || '{}');
            const processedFolders = new Set();
            let visibleCount = 0;

            State.services.forEach(s => {
                const cats = (s.type || 'autre').split(',').map(c => c.trim().toLowerCase());
                const matchCat = State.currentCategory === 'all' || cats.includes(State.currentCategory);
                
                if (State.currentCategory === 'top' && !(usage[s.id] > 0)) return;
                if (!matchCat && State.currentCategory !== 'top') return;

                if (s.folder && !State.isAdmin) {
                    if (processedFolders.has(s.folder)) return;
                    processedFolders.add(s.folder);
                    const folderItems = State.services.filter(x => x.folder === s.folder);
                    
                    const el = document.createElement('div');
                    el.className = 'card folder-card';
                    el.innerHTML = `
                        <div class="card-sparkline" style="background:var(--text-muted)"></div>
                        <div class="card-header">
                            <div class="card-icon-box"><i data-lucide="folder"></i></div>
                        </div>
                        <div class="card-body">
                            <h3>📁 ${s.folder}</h3>
                            <p>${folderItems.length} éléments</p>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-outline open-folder-btn" data-folder="${s.folder}"><i data-lucide="grid"></i> Ouvrir</button>
                        </div>
                    `;
                    if (State.currentCategory === 'top') el.style.order = -(usage[s.id] || 0);
                    template.appendChild(el);
                    visibleCount++;
                } else {
                    const el = document.createElement('div');
                    el.className = `card`;
                    el.dataset.id = s.id;
                    el.dataset.url = s.url || '';
                    el.dataset.service = s.name;
                    
                    let iconHtml = s.logo ? `<img src="${s.logo}" alt="">` : `<i data-lucide="${s.icon || 'server'}"></i>`;
                    
                    el.innerHTML = `
                        <div class="card-sparkline"></div>
                        <div class="card-header">
                            <div class="card-icon-box">${iconHtml}</div>
                            <div class="status-badge"><span class="status-dot tooltiped" title="Checking..."></span></div>
                            ${usage[s.id] && State.currentCategory === 'top' ? `<div class="top-badge">${usage[s.id]}</div>` : ''}
                        </div>
                        <div class="card-body">
                            <h3>${s.name}</h3>
                            <p>${s.description}</p>
                            ${s.folder && State.isAdmin ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;"><i data-lucide="folder" style="width:12px;height:12px;vertical-align:-2px;"></i> ${s.folder}</div>` : ''}
                        </div>
                        <div class="card-footer">
                            <a href="${s.url}" class="btn btn-outline launch-btn" target="${window.isNewTab ? '_blank' : '_self'}">Aperçu</a>
                            <div class="action-bar">
                                <button class="action-sm fav-btn ${s.favorite ? 'favorited' : ''}" data-id="${s.id}" title="Favori"><i data-lucide="star" fill="${s.favorite ? '#f59e0b' : 'none'}"></i></button>
                                <button class="action-sm edit-btn" data-id="${s.id}" title="Modifier"><i data-lucide="edit-2"></i></button>
                                <button class="action-sm delete-btn" data-id="${s.id}" title="Supprimer"><i data-lucide="trash-2"></i></button>
                            </div>
                        </div>
                    `;
                    if (State.currentCategory === 'top') el.style.order = -(usage[s.id] || 0);
                    template.appendChild(el);
                    visibleCount++;
                }
            });

            // Add Template
            const tpl = document.getElementById('add-card-template');
            if (tpl && State.isAdmin) {
                const clone = tpl.content.cloneNode(true);
                template.appendChild(clone);
            }

            grid.innerHTML = '';
            grid.appendChild(template);
            
            if (window.lucide) lucide.createIcons();
            UIManager.initTooltips();
            
            // Re-init sortable
            if (State.sortableInstance) State.sortableInstance.destroy();
            if (window.Sortable) {
                State.sortableInstance = new Sortable(grid, {
                    animation: 200,
                    filter: '.add-new-card, .folder-card',
                    disabled: !State.isAdmin,
                    ghostClass: 'sortable-ghost',
                    onEnd: () => {
                        const newCards = Array.from(grid.querySelectorAll('.card:not(.add-new-card):not(.folder-card)'));
                        localStorage.setItem('it-lab-custom-order', JSON.stringify(newCards.map(c => c.dataset.service)));
                    }
                });
            }
            
            this.checkStatusThrottled();
        },
        bindEventDelegation() {
            const grid = document.getElementById('services-grid');
            if(!grid) return;

            grid.addEventListener('click', e => {
                const card = e.target.closest('.card');
                if(!card) return;

                // Open Folder
                if(e.target.closest('.open-folder-btn')) {
                    const folder = e.target.closest('.open-folder-btn').dataset.folder;
                    this.openFolderModal(folder);
                    return;
                }

                // Add card
                if(card.classList.contains('add-new-card')) {
                    this.openAdminModal();
                    return;
                }

                const id = card.dataset.id;
                
                // Card actions
                if(e.target.closest('.fav-btn')) {
                    const s = State.services.find(x => String(x.id) === id);
                    if(s) { 
                        s.favorite = !s.favorite; 
                        this.saveFavorites(); 
                        if(s.favorite && window.confetti) window.fireConfetti?.(e.clientX, e.clientY);
                        this.renderCards(); 
                    }
                    return;
                }
                if(e.target.closest('.edit-btn')) {
                    this.openAdminModal(id);
                    return;
                }
                if(e.target.closest('.delete-btn')) {
                    if(confirm('Supprimer ce service ?')) {
                        State.services = State.services.filter(x => String(x.id) !== id);
                        this.renderCategories();
                        this.renderCards();
                    }
                    return;
                }

                // Record usage & Full card click
                if(!e.target.closest('a') && !e.target.closest('button') && !card.classList.contains('folder-card') && id) {
                    const usage = JSON.parse(localStorage.getItem('it-lab-usage') || '{}');
                    usage[id] = (usage[id] || 0) + 1;
                    localStorage.setItem('it-lab-usage', JSON.stringify(usage));

                    if(window.isFullCard && !State.isAdmin && card.dataset.url) {
                        window.open(card.dataset.url, window.isNewTab ? '_blank' : '_self');
                    }
                }
            });

            // Folder modal close
            document.getElementById('close-folder')?.addEventListener('click', () => {
                document.getElementById('folder-modal')?.classList.remove('active');
            });
        },
        openFolderModal(folderName) {
            document.getElementById('folder-modal-title').textContent = `📁 ${folderName}`;
            const fGrid = document.getElementById('folder-grid');
            fGrid.innerHTML = '';
            
            const items = State.services.filter(s => s.folder === folderName);
            items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'card';
                el.style.padding = '16px';
                el.innerHTML = `
                    <div class="card-sparkline" style="height:30px;"></div>
                    <div class="card-header" style="margin-bottom:12px;">
                        <div class="card-icon-box" style="width:36px;height:36px;">
                            ${item.logo ? `<img src="${item.logo}">` : `<i data-lucide="${item.icon||'server'}"></i>`}
                        </div>
                        <h4 style="font-size:1rem;">${item.name}</h4>
                    </div>
                    <div class="card-footer" style="padding:0; border:none; display:block;">
                        <a href="${item.url}" class="btn btn-outline" target="${window.isNewTab ? '_blank' : '_self'}" style="width:100%; justify-content:center;">Ouvrir</a>
                    </div>
                `;
                fGrid.appendChild(el);
            });
            if(window.lucide) lucide.createIcons();
            document.getElementById('folder-modal').classList.add('active');
        },
        checkStatusThrottled() {
            const cards = Array.from(document.querySelectorAll('#services-grid .card:not(.folder-card):not(.add-new-card)'));
            if(!cards.length) return;
            
            // Queue simple pour éviter de spammer le réseau
            let i = 0;
            const checkNext = () => {
                if(i >= cards.length) return;
                const card = cards[i];
                const url = card.dataset.url;
                const dot = card.querySelector('.status-dot');
                if(url && dot) {
                    fetch(url, { mode: 'no-cors', cache: 'no-cache' })
                        .then(() => { dot.className = 'status-dot online'; dot.setAttribute('data-tippy-content', 'En ligne'); })
                        .catch(() => { dot.className = 'status-dot offline'; dot.setAttribute('data-tippy-content', 'Hors ligne'); })
                        .finally(() => {
                            if(window.tippy) tippy(dot);
                            i++;
                            setTimeout(checkNext, 50); // 50ms throttle
                        });
                } else {
                    i++;
                    checkNext();
                }
            };
            checkNext();
        },
        initAdminFeatures() {
            const toggle = document.getElementById('admin-toggle');
            if(toggle) {
                toggle.addEventListener('click', () => {
                    State.isAdmin = !State.isAdmin;
                    document.body.classList.toggle('admin-mode', State.isAdmin);
                    toggle.classList.toggle('btn-primary', State.isAdmin);
                    toggle.classList.toggle('btn-outline', !State.isAdmin);
                    
                    document.getElementById('export-profile')?.classList.toggle('btn-hidden', !State.isAdmin);
                    document.getElementById('import-profile')?.classList.toggle('btn-hidden', !State.isAdmin);
                    
                    this.renderCards();
                });
            }

            // form bindings
            document.getElementById('btn-cancel-modal')?.addEventListener('click', () => {
                document.getElementById('admin-modal').classList.remove('active');
            });
            document.getElementById('service-form')?.addEventListener('submit', e => {
                e.preventDefault();
                this.saveService();
            });

            // Export / Import
            document.getElementById('export-profile')?.addEventListener('click', () => {
                const profile = {};
                for(let i=0; i<localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if(key.startsWith('it-lab-')) profile[key] = localStorage.getItem(key);
                }
                profile['dashboardServices'] = State.services;
                const blob = new Blob([JSON.stringify(profile)], {type: 'application/json'});
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'profile.itlab';
                a.click();
            });

            document.getElementById('import-profile-file')?.addEventListener('change', e => {
                const file = e.files?.[0];
                if(!file) return;
                const r = new FileReader();
                r.onload = ev => {
                    try {
                        const profile = JSON.parse(ev.target.result);
                        Object.keys(profile).forEach(k => {
                            if(k.startsWith('it-lab-')) localStorage.setItem(k, profile[k]);
                        });
                        alert("Profil importé ! Rechargez la page.");
                        location.reload();
                    } catch(e) { alert("Fichier invalide"); }
                };
                r.readAsText(file);
            });
        },
        openAdminModal(id = null) {
            const modal = document.getElementById('admin-modal');
            const title = document.getElementById('modal-title');
            const form = document.getElementById('service-form');
            form.reset();
            
            if (id) {
                const s = State.services.find(x => String(x.id) === String(id));
                if(s) {
                    title.textContent = "Modifier le Service";
                    document.getElementById('service-id').value = s.id;
                    document.getElementById('service-name').value = s.name || '';
                    document.getElementById('service-type').value = s.type || '';
                    document.getElementById('service-desc').value = s.description || '';
                    document.getElementById('service-url').value = s.url || '';
                    document.getElementById('service-icon').value = s.logo || s.icon || '';
                    const folderField = document.getElementById('service-folder');
                    if(folderField) folderField.value = s.folder || '';
                }
            } else {
                title.textContent = "Ajouter un Service";
                document.getElementById('service-id').value = '';
            }
            modal.classList.add('active');
        },
        saveService() {
            const idVal = document.getElementById('service-id').value;
            const iconVal = document.getElementById('service-icon').value;
            const isUrl = iconVal.startsWith('http');

            const srv = {
                id: idVal || 'srv-' + Date.now(),
                name: document.getElementById('service-name').value,
                type: document.getElementById('service-type').value.toLowerCase(),
                description: document.getElementById('service-desc').value,
                url: document.getElementById('service-url').value,
                folder: document.getElementById('service-folder')?.value.trim() || ''
            };
            if(isUrl) srv.logo = iconVal; else srv.icon = iconVal;

            if(idVal) {
                const index = State.services.findIndex(x => String(x.id) === String(idVal));
                if(index > -1) {
                    srv.favorite = State.services[index].favorite;
                    State.services[index] = srv;
                }
            } else {
                State.services.push(srv);
            }

            document.getElementById('admin-modal').classList.remove('active');
            this.renderCategories();
            this.renderCards();
        }
    };

    // ==========================================
    // Confetti global wrapper
    // ==========================================
    window.fireConfetti = function(x, y) {
        if (typeof confetti !== 'function') return;
        confetti({
            particleCount: 60, spread: 70,
            origin: { x: x / window.innerWidth, y: y / window.innerHeight },
            colors: [getComputedStyle(document.documentElement).getPropertyValue('--accent-main').trim(), '#ffffff', '#9d50bb'],
            startVelocity: 30, ticks: 100, gravity: 0.8, scalar: 0.9
        });
    };

    // ==========================================
    // Bootstrap
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        ThemeManager.init();
        SettingsManager.init();
        ParticleManager.init();
        UIManager.init();
        WeatherManager.init();
        ServiceManager.init();
        
        if (window.lucide) lucide.createIcons();
    });

})();

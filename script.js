/**
 * script.js — Satel Lab Dashboard v5 — FUTURISTIC EDITION
 */

(function () {
    'use strict';

    // ==========================================
    // PWA
    // ==========================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(r => console.log('✅ PWA:', r.scope))
                .catch(e => console.log('❌ PWA:', e));
        });
    }
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });

    // ==========================================
    // Global State
    // ==========================================
    const State = {
        services: [],
        currentCategory: 'all',
        sortableInstance: null,
        isAdmin: false,
        tabListenerBound: false
    };

    // Global flags (used in card rendering)
    window.isNewTab  = localStorage.getItem('it-lab-newtab')    !== 'false';
    window.isFullCard = localStorage.getItem('it-lab-fullcard') !== 'false';

    // ==========================================
    // Audio
    // ==========================================
    const AudioManager = {
        _ctx: null,
        get ctx() {
            if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            return this._ctx;
        },
        play(type) {
            if (localStorage.getItem('it-lab-sounds') !== 'true') return;
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain); gain.connect(this.ctx.destination);
                if (type === 'hover') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.05);
                    gain.gain.setValueAtTime(0.008, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                    osc.start(); osc.stop(this.ctx.currentTime + 0.05);
                } else if (type === 'click') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.08);
                    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
                    osc.start(); osc.stop(this.ctx.currentTime + 0.08);
                }
            } catch(e) {}
        }
    };

    // ==========================================
    // Theme Manager
    // ==========================================
    const ThemeManager = {
        init() {
            // Font — default Space Grotesk for the new design
            const savedFont = localStorage.getItem('it-lab-font') || "'Space Grotesk', sans-serif";
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
            const savedColor = localStorage.getItem('it-lab-theme') || '#00d4ff';
            this.setAccent(savedColor, false);

            const colorPicker = document.getElementById('custom-color-picker');
            const themeDots   = document.querySelectorAll('.theme-dot');

            if (colorPicker) {
                colorPicker.value = savedColor;
                colorPicker.addEventListener('input', e => {
                    this.setAccent(e.target.value, false);
                    themeDots.forEach(d => d.classList.remove('active'));
                });
            }

            themeDots.forEach(dot => {
                if (dot.dataset.color === savedColor) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    themeDots.forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                    const c = dot.dataset.color;
                    if (colorPicker) colorPicker.value = c;
                    this.setAccent(c);
                    AudioManager.play('click');
                });
            });

            // Color mode (dark/light/auto)
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
            if (scale === 'compact') document.documentElement.style.fontSize = '14px';
            else if (scale === 'large') document.documentElement.style.fontSize = '18px';
            else document.documentElement.style.fontSize = '16px';
        },

        setAccent(color, save = true) {
            document.documentElement.style.setProperty('--accent-main', color);
            // Compute glow from accent
            document.documentElement.style.setProperty('--accent-glow',  `${color}30`);
            document.documentElement.style.setProperty('--accent-pulse', `${color}55`);
            document.documentElement.style.setProperty('--accent-dim',   `${color}12`);
            if (save) localStorage.setItem('it-lab-theme', color);
        },

        applyColorMode(mode) {
            let final = mode;
            if (mode === 'auto') final = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

            const icon = document.querySelector('#theme-toggle svg') || document.getElementById('theme-icon');
            if (final === 'light') {
                document.documentElement.classList.add('light-mode');
                document.getElementById('theme-toggle')?.querySelector?.('i')?.setAttribute('data-lucide', 'moon');
            } else {
                document.documentElement.classList.remove('light-mode');
                document.getElementById('theme-toggle')?.querySelector?.('i')?.setAttribute('data-lucide', 'sun');
            }
            if (window.lucide) lucide.createIcons();

            // Update particles color
            if (window.pJSDom?.length > 0) {
                const pJS = window.pJSDom[0].pJS;
                const pc = final === 'light' ? '#000000' : '#ffffff';
                pJS.particles.color.value = pc;
                pJS.particles.line_linked.color = pc;
                pJS.fn.particlesRefresh();
            }
        }
    };

    // ==========================================
    // Settings Manager
    // ==========================================
    const SettingsManager = {
        init() {
            // Layout
            const grid = document.getElementById('services-grid');
            const btnGrid = document.getElementById('layout-grid');
            const btnList = document.getElementById('layout-list');
            const savedLayout = localStorage.getItem('it-lab-layout') || 'grid';
            if (savedLayout === 'list' && grid) {
                grid.classList.add('list-view');
                btnList?.classList.add('active');
                btnGrid?.classList.remove('active');
            }
            btnGrid?.addEventListener('click', () => {
                grid?.classList.remove('list-view');
                btnGrid.classList.add('active'); btnList?.classList.remove('active');
                localStorage.setItem('it-lab-layout', 'grid');
            });
            btnList?.addEventListener('click', () => {
                grid?.classList.add('list-view');
                btnList.classList.add('active'); btnGrid?.classList.remove('active');
                localStorage.setItem('it-lab-layout', 'list');
            });

            // Toggles
            this.bindToggle('time-24h',        'it-lab-24h',           true);
            this.bindToggle('time-seconds',    'it-lab-sec',           true);
            this.bindToggle('link-newtab',     'it-lab-newtab',        true,  v => window.isNewTab   = v);
            this.bindToggle('link-fullcard',   'it-lab-fullcard',      true,  v => window.isFullCard  = v);
            this.bindToggle('ui-sounds-toggle','it-lab-sounds',        false);
            this.bindToggle('weather-fx-toggle','it-lab-weather-fx',   true,  () => ParticleManager.init());
            this.bindToggle('perf-mode-toggle','it-lab-perf',          false, v => document.body.classList.toggle('perf-mode', v));

            // Fallback search engine
            const fbEl = document.getElementById('search-fallback');
            if (fbEl) {
                fbEl.value = localStorage.getItem('it-lab-search-fallback') || 'google';
                fbEl.addEventListener('change', e => localStorage.setItem('it-lab-search-fallback', e.target.value));
            }

            // Wallpaper
            const wpEl = document.getElementById('custom-wallpaper');
            if (wpEl) {
                const saved = localStorage.getItem('it-lab-wallpaper') || '';
                wpEl.value = saved;
                this.applyWallpaper(saved);
                wpEl.addEventListener('input', e => {
                    localStorage.setItem('it-lab-wallpaper', e.target.value);
                    this.applyWallpaper(e.target.value);
                });
            }


            // Kiosk mode
            document.getElementById('kiosk-mode-btn')?.addEventListener('click', () => {
                document.body.classList.add('kiosk-mode');
                document.documentElement.requestFullscreen?.().catch(() => {});
                document.getElementById('settings-modal')?.classList.remove('active');
                const exit = e => {
                    if (e.key === 'Escape' || e.type === 'fullscreenchange') {
                        if (!document.fullscreenElement) {
                            document.body.classList.remove('kiosk-mode');
                            document.removeEventListener('keydown', exit);
                            document.removeEventListener('fullscreenchange', exit);
                        }
                    }
                };
                document.addEventListener('keydown', exit);
                document.addEventListener('fullscreenchange', exit);
            });

            // Reset
            document.getElementById('reset-data')?.addEventListener('click', () => {
                if (confirm('Toutes vos préférences seront effacées. Continuer ?')) {
                    Object.keys(localStorage).filter(k => k.startsWith('it-lab-')).forEach(k => localStorage.removeItem(k));
                    location.reload();
                }
            });
        },

        bindToggle(id, key, def, cb = null) {
            const el = document.getElementById(id);
            if (!el) return;
            const saved = localStorage.getItem(key);
            const val = saved !== null ? saved === 'true' : def;
            el.checked = val;
            if (cb) cb(val);
            el.addEventListener('change', e => {
                localStorage.setItem(key, e.target.checked);
                if (cb) cb(e.target.checked);
            });
        },

        applyWallpaper(url) {
            if (url) {
                document.body.style.backgroundImage = `url('${url}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
                if (!document.getElementById('wp-overlay')) {
                    const el = document.createElement('div');
                    el.id = 'wp-overlay';
                    el.style.cssText = 'position:fixed;inset:0;z-index:-1;background:var(--bg-base);opacity:0.88;';
                    document.body.appendChild(el);
                }
            } else {
                document.body.style.backgroundImage = '';
                document.getElementById('wp-overlay')?.remove();
            }
        }
    };

    // ==========================================
    // Particle Manager
    // ==========================================
    const ParticleManager = {
        _bound: false,
        init() {
            const container = document.getElementById('particles-js');
            if (!container) return;

            // Bind settings controls once
            if (!this._bound) {
                const dEl = document.getElementById('particles-density');
                const sEl = document.getElementById('particles-speed');
                if (dEl) { dEl.value = localStorage.getItem('it-lab-part-density') || 'normal'; dEl.addEventListener('change', e => { localStorage.setItem('it-lab-part-density', e.target.value); this.init(); }); }
                if (sEl) { sEl.value = localStorage.getItem('it-lab-part-speed')   || '1.5';   sEl.addEventListener('change', e => { localStorage.setItem('it-lab-part-speed',   e.target.value); this.init(); }); }
                this._bound = true;
            }

            // Destroy existing
            if (window.pJSDom?.length > 0) {
                window.pJSDom[0].pJS.fn.vendors.destroypJS();
                window.pJSDom = [];
            }
            container.innerHTML = '';

            const density = localStorage.getItem('it-lab-part-density') || 'normal';
            if (density === 'disabled') return;

            let count = density === 'low' ? 25 : density === 'high' ? 100 : 50;
            let speed = parseFloat(localStorage.getItem('it-lab-part-speed') || '1.5');
            const isLight = document.documentElement.classList.contains('light-mode');
            const pcolor  = isLight ? '#000000' : '#ffffff';

            // Weather FX
            const weatherFx = localStorage.getItem('it-lab-weather-fx') !== 'false';
            const cw = localStorage.getItem('it-lab-last-weather') || '';
            let shape = 'circle', direction = 'none', straight = false;

            if (weatherFx && (cw.includes('pluie') || cw.includes('neige') || cw.includes('averse'))) {
                shape = cw.includes('neige') ? 'circle' : 'edge';
                direction = 'bottom'; straight = true;
                speed  = cw.includes('neige') ? speed * 2 : speed * 5;
                count  = cw.includes('neige') ? count * 2 : Math.floor(count * 2.5);
            }

            if (window.particlesJS) {
                particlesJS('particles-js', {
                    particles: {
                        number: { value: count, density: { enable: true, value_area: 900 } },
                        color: { value: pcolor },
                        shape: { type: shape },
                        opacity: { value: shape === 'edge' ? 0.5 : 0.15, random: false },
                        size:    { value: shape === 'edge' ? 4 : 2, random: true },
                        line_linked: { enable: !straight, distance: 140, color: pcolor, opacity: 0.07, width: 1 },
                        move: { enable: true, speed, direction, random: true, straight, out_mode: 'out', bounce: false }
                    },
                    interactivity: {
                        detect_on: 'canvas',
                        events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' }, resize: true },
                        modes:  { grab: { distance: 160, line_linked: { opacity: 0.25 } }, push: { particles_nb: 2 } }
                    },
                    retina_detect: true
                });
            }
        }
    };

    // ==========================================
    // UI Manager
    // ==========================================
    const UIManager = {
        init() {
            // Ripple on all interactive elements
            document.addEventListener('click', e => {
                const el = e.target.closest('.btn, .nav-btn, .category-tab');
                if (el) this.ripple(e, el);
            });

            // Hover sound
            document.addEventListener('mousemove', e => {
                const el = e.target.closest('.card, .btn, .action-sm, .theme-dot, .category-tab, .nav-btn');
                if (el && !el.dataset.hovered) {
                    el.dataset.hovered = '1';
                    AudioManager.play('hover');
                    el.addEventListener('mouseleave', () => delete el.dataset.hovered, { once: true });
                }
            });

            // Settings modal
            document.getElementById('settings-toggle')?.addEventListener('click', () =>
                document.getElementById('settings-modal').classList.add('active'));
            document.getElementById('close-settings')?.addEventListener('click', () =>
                document.getElementById('settings-modal').classList.remove('active'));

            // Close modal on backdrop click
            document.addEventListener('click', e => {
                if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active');
            });

            // Close folder
            document.getElementById('close-folder')?.addEventListener('click', () =>
                document.getElementById('folder-modal')?.classList.remove('active'));

            // Card mouse-follow glow
            const grid = document.getElementById('services-grid');
            if (grid) {
                grid.addEventListener('mousemove', e => {
                    for (const card of grid.querySelectorAll('.card')) {
                        const r = card.getBoundingClientRect();
                        card.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
                        card.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
                    }
                });
            }

            // Drag & drop URL
            document.body.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
            document.body.addEventListener('drop', e => {
                e.preventDefault();
                const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
                if (url?.startsWith('http')) {
                    ServiceManager.openAdminModal();
                    const urlF = document.getElementById('service-url');
                    const nameF = document.getElementById('service-name');
                    if (urlF) urlF.value = url;
                    if (nameF) { try { nameF.value = new URL(url).hostname; } catch(ex){} }
                }
            });

            // Tooltips
            this.initTooltips();

            // Clock
            setInterval(() => this.updateClock(), 1000);
            this.updateClock();

            // Command palette
            this.initCommandPalette();

            // Context menu
            this.initContextMenu();

            // Scratchpad
            this.initScratchpad();

            // Custom cursor
            this.initCursor();

        },

        ripple(e, btn) {
            const d = Math.max(btn.clientWidth, btn.clientHeight);
            const r = d / 2;
            const rect = btn.getBoundingClientRect();
            const span = document.createElement('span');
            span.classList.add('ripple');
            span.style.width = span.style.height = `${d}px`;
            span.style.left  = `${e.clientX - rect.left - r}px`;
            span.style.top   = `${e.clientY - rect.top - r}px`;
            btn.querySelector('.ripple')?.remove();
            btn.appendChild(span);
            AudioManager.play('click');
        },

        initTooltips() {
            if (!window.tippy) return;
            document.querySelectorAll('[title]').forEach(el => {
                el.setAttribute('data-tippy-content', el.getAttribute('title'));
                el.removeAttribute('title');
            });
            tippy('[data-tippy-content]', { theme: 'glass', animation: 'scale', arrow: true });
        },

        updateClock() {
            const timeEl     = document.getElementById('current-time');
            const dateEl     = document.getElementById('current-date');
            const greetingEl = document.getElementById('greeting');

            const now  = new Date();
            const is24 = localStorage.getItem('it-lab-24h') !== 'false';
            const isSec = localStorage.getItem('it-lab-sec') !== 'false';

            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit',
                    second: isSec ? '2-digit' : undefined,
                    hour12: !is24
                });
            }
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });
            }
            if (greetingEl) {
                const h = now.getHours();
                if (h >= 5  && h < 12) greetingEl.textContent = '// MORNING SESSION';
                else if (h >= 12 && h < 18) greetingEl.textContent = '// MIDDAY OPS';
                else greetingEl.textContent = '// NIGHT SHIFT';
            }
        },

        initCommandPalette() {
            const overlay  = document.getElementById('command-palette-overlay');
            const input    = document.getElementById('cmd-input');
            const results  = document.getElementById('cmd-results');
            if (!overlay || !input || !results) return;

            let selected = 0;
            let filtered = [];

            const render = () => {
                results.innerHTML = '';
                if (!filtered.length) {
                    results.innerHTML = '<li class="cmd-item" style="justify-content:center;color:var(--text-muted)">// AUCUN RÉSULTAT</li>';
                    return;
                }
                filtered.forEach((s, i) => {
                    const li = document.createElement('li');
                    li.className = `cmd-item${i === selected ? ' selected' : ''}`;
                    const icon = s.icon ? `<i data-lucide="${s.icon}" class="cmd-item-icon"></i>` : `<i data-lucide="server" class="cmd-item-icon"></i>`;
                    li.innerHTML = `${icon}<span class="cmd-item-title">${s.name}</span><span class="cmd-item-cat">${s.type || 'SVC'}</span>`;
                    li.addEventListener('mouseenter', () => { selected = i; render(); });
                    li.addEventListener('click', () => {
                        if (s.url) window.open(s.url, window.isNewTab ? '_blank' : '_self');
                        overlay.classList.remove('active');
                    });
                    results.appendChild(li);
                });
                lucide.createIcons();
                results.querySelector('.selected')?.scrollIntoView({ block: 'nearest' });
            };

            const filter = (term) => {
                term = term.toLowerCase();
                filtered = State.services.filter(s =>
                    s.name.toLowerCase().includes(term) ||
                    s.description?.toLowerCase().includes(term) ||
                    s.type?.toLowerCase().includes(term)
                );
                selected = 0;
                render();
            };

            const open = () => {
                overlay.classList.add('active');
                input.value = '';
                filter('');
                setTimeout(() => input.focus(), 50);
            };
            const close = () => overlay.classList.remove('active');

            document.addEventListener('keydown', e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); open(); }
                if (e.key === 'Escape' && overlay.classList.contains('active')) close();
            });

            document.getElementById('search-trigger')?.addEventListener('click', open);
            overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

            input.addEventListener('input', e => filter(e.target.value));
            input.addEventListener('keydown', e => {
                if (e.key === 'ArrowDown')  { e.preventDefault(); selected = (selected + 1) % (filtered.length || 1); render(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); selected = (selected - 1 + (filtered.length || 1)) % (filtered.length || 1); render(); }
                else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered[selected]?.url) {
                        window.open(filtered[selected].url, window.isNewTab ? '_blank' : '_self');
                        close();
                    } else if (!filtered.length && input.value) {
                        const fb = localStorage.getItem('it-lab-search-fallback') || 'google';
                        const q  = encodeURIComponent(input.value);
                        if (fb === 'google')     window.open(`https://google.com/search?q=${q}`, '_blank');
                        if (fb === 'duckduckgo') window.open(`https://duckduckgo.com/?q=${q}`,   '_blank');
                        close();
                    }
                }
            });
        },

        initContextMenu() {
            const menu = document.getElementById('custom-context-menu');
            if (!menu) return;
            let target = null;

            document.addEventListener('contextmenu', e => {
                const card = e.target.closest('.card:not(.add-new-card)');
                if (card) {
                    e.preventDefault();
                    target = card;
                    menu.style.display = 'block';
                    let x = e.pageX, y = e.pageY;
                    if (x + 200 > window.innerWidth)  x -= 200;
                    if (y + 200 > window.innerHeight)  y -= 200;
                    menu.style.left = `${x}px`;
                    menu.style.top  = `${y}px`;
                    setTimeout(() => menu.classList.add('active'), 10);
                } else {
                    this._closeCtx(menu);
                }
            });

            document.addEventListener('click',  () => this._closeCtx(menu));
            document.addEventListener('scroll', () => this._closeCtx(menu));

            document.getElementById('ctx-open')?.addEventListener('click', () => {
                if (target?.dataset.url) window.open(target.dataset.url, '_blank');
            });
            document.getElementById('ctx-copy-url')?.addEventListener('click', () => {
                if (target?.dataset.url) navigator.clipboard.writeText(target.dataset.url).then(() => alert('URL copiée !'));
            });
            document.getElementById('ctx-copy-ip')?.addEventListener('click', () => {
                try { navigator.clipboard.writeText(new URL(target.dataset.url).hostname).then(() => alert('Hostname copié !')); } catch(ex){}
            });
            document.getElementById('ctx-fav')?.addEventListener('click', () => {
                if (!target?.dataset.id) return;
                const s = State.services.find(x => String(x.id) === target.dataset.id);
                if (s) { s.favorite = !s.favorite; ServiceManager.saveFavorites(); ServiceManager.renderCards(); }
            });
            document.getElementById('ctx-edit')?.addEventListener('click', () => {
                if (!State.isAdmin) { alert('Mode Admin requis.'); return; }
                if (target?.dataset.id) ServiceManager.openAdminModal(target.dataset.id);
            });
        },

        _closeCtx(menu) {
            menu.classList.remove('active');
            setTimeout(() => { if (!menu.classList.contains('active')) menu.style.display = 'none'; }, 110);
        },

        initScratchpad() {
            const content = document.getElementById('scratchpad-content');
            const widget  = document.getElementById('scratchpad-widget');
            if (!content || !widget) return;
            content.value = localStorage.getItem('it-lab-notes') || '';
            document.getElementById('scratchpad-fab')?.addEventListener('click', () => {
                widget.classList.toggle('active');
                if (widget.classList.contains('active')) content.focus();
            });
            document.getElementById('close-scratchpad')?.addEventListener('click', () => widget.classList.remove('active'));
            content.addEventListener('input', e => localStorage.setItem('it-lab-notes', e.target.value));
        },

        initCursor() {
            const dot = document.querySelector('.custom-cursor-dot');
            if (!dot || !window.matchMedia('(pointer: fine)').matches) return;
            document.addEventListener('mousemove', e => {
                dot.style.left = `${e.clientX}px`;
                dot.style.top  = `${e.clientY}px`;
            });
            document.querySelectorAll('a, button, .card, .category-tab, .theme-dot, .action-sm, .nav-btn').forEach(el => {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
            });
            document.addEventListener('mouseleave', () => dot.style.opacity = '0');
            document.addEventListener('mouseenter',  () => dot.style.opacity = '1');
        },


    };

    // ==========================================
    // Weather Manager
    // ==========================================
    const WeatherManager = {
        init() { this.fetch(); setInterval(() => this.fetch(), 3_600_000); },
        fetch() {
            const textEl = document.getElementById('weather-text');
            const iconEl = document.querySelector('.weather-icon');
            if (!textEl || !iconEl) return;

            fetch('https://get.geojs.io/v1/ip/geo.json')
                .then(r => r.json())
                .then(d => fetch(`https://api.open-meteo.com/v1/forecast?latitude=${d.latitude}&longitude=${d.longitude}&current_weather=true`)
                    .then(r => r.json()).then(w => ({ city: d.city, w })))
                .then(({ city, w }) => {
                    const temp = Math.round(w.current_weather.temperature);
                    const code = w.current_weather.weathercode;
                    textEl.textContent = `${temp}°C  ${city}`;

                    let icon = 'cloud';
                    if (code === 0) icon = 'sun';
                    else if (code <= 3) icon = 'cloud-sun';
                    else if (code <= 48) icon = 'cloud-fog';
                    else if (code <= 67) icon = 'cloud-rain';
                    else if (code <= 77) icon = 'snowflake';
                    else if (code <= 82) icon = 'cloud-showers-heavy';
                    else icon = 'cloud-lightning';

                    iconEl.setAttribute('data-lucide', icon);
                    if (window.lucide) lucide.createIcons();
                })
                .catch(() => { textEl.textContent = 'N/A'; });
        }
    };

    // ==========================================
    // Service Manager
    // ==========================================
    const ServiceManager = {
        init() {
            this.showSkeletons();
            this.loadConfig();
            this.bindDelegation();
            this.initAdminPanel();
        },

        showSkeletons() {
            const grid = document.getElementById('services-grid');
            if (!grid) return;
            grid.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                grid.innerHTML += `
                <div class="card" style="pointer-events:none;">
                    <div class="card-header">
                        <div class="skeleton-icon skeleton"></div>
                        <div class="skeleton-pill skeleton"></div>
                    </div>
                    <div class="card-body">
                        <div class="skeleton-title skeleton"></div>
                        <div class="skeleton-text skeleton"></div>
                        <div class="skeleton-text skeleton" style="width:70%;"></div>
                    </div>
                    <div class="card-footer" style="padding-top:14px;">
                        <div class="skeleton-btn skeleton"></div>
                    </div>
                </div>`;
            }
        },

        loadConfig() {
            fetch('config.json')
                .then(r => r.ok ? r.json() : Promise.reject('HTTP error'))
                .then(data => {
                    State.services = data;
                    this.loadFavorites();
                    setTimeout(() => {
                        this.renderCategories();
                        this.renderCards();
                        const loader = document.getElementById('loader-overlay');
                        if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.classList.add('hidden'), 700); }
                    }, 400);
                })
                .catch(() => {
                    const grid = document.getElementById('services-grid');
                    if (grid) grid.innerHTML = '<p style="color:var(--red);text-align:center;grid-column:1/-1;font-family:var(--font-mono);">// ERROR: config.json introuvable</p>';
                });
        },

        loadFavorites() {
            try {
                const ids = JSON.parse(localStorage.getItem('it-lab-favorites') || '[]');
                State.services.forEach(s => s.favorite = ids.includes(String(s.id)));
            } catch(e) {}
        },

        saveFavorites() {
            const ids = State.services.filter(s => s.favorite).map(s => String(s.id));
            localStorage.setItem('it-lab-favorites', JSON.stringify(ids));
        },

        renderCategories() {
            const container = document.getElementById('category-tabs');
            if (!container) return;

            const cats = new Set();
            State.services.forEach(s => {
                if (s.type) s.type.split(',').forEach(t => cats.add(t.trim().toLowerCase()));
                else cats.add('autre');
            });

            const hasUsage = Object.keys(JSON.parse(localStorage.getItem('it-lab-usage') || '{}')).length > 0;
            let html = `<button class="category-tab active" data-category="all">Tous</button>`;
            if (hasUsage) html += `<button class="category-tab" data-category="top">▲ Top</button>`;
            cats.forEach(c => { html += `<button class="category-tab" data-category="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`; });
            container.innerHTML = html;

            // Bind click — only once thanks to State flag reset on each render
            container.addEventListener('click', e => {
                const btn = e.target.closest('.category-tab');
                if (!btn) return;
                container.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                State.currentCategory = btn.dataset.category;
                this.renderCards();
            });
        },

        renderCards() {
            const grid = document.getElementById('services-grid');
            if (!grid) return;

            // Sort
            const order = JSON.parse(localStorage.getItem('it-lab-custom-order') || '[]');
            const usage = JSON.parse(localStorage.getItem('it-lab-usage') || '{}');
            State.services.sort((a, b) => {
                if (a.favorite && !b.favorite) return -1;
                if (!a.favorite && b.favorite) return 1;
                if (order.length) {
                    const ia = order.indexOf(a.name), ib = order.indexOf(b.name);
                    if (ia !== -1 && ib !== -1) return ia - ib;
                    if (ia !== -1) return -1; if (ib !== -1) return 1;
                }
                return 0;
            });

            const frag = document.createDocumentFragment();
            const processed = new Set();
            let visible = 0;

            State.services.forEach(s => {
                const cats = (s.type || 'autre').split(',').map(c => c.trim().toLowerCase());
                const matchCat = State.currentCategory === 'all' || cats.includes(State.currentCategory);
                const matchTop = State.currentCategory === 'top' ? usage[s.id] > 0 : true;
                if (!matchCat || !matchTop) return;

                if (s.folder && !State.isAdmin) {
                    if (processed.has(s.folder)) return;
                    processed.add(s.folder);
                    const items = State.services.filter(x => x.folder === s.folder);
                    const el = this._makeCard('folder', s, items, usage);
                    frag.appendChild(el);
                } else {
                    const el = this._makeCard('service', s, null, usage);
                    frag.appendChild(el);
                }
                visible++;
            });

            // Add card (admin only)
            if (State.isAdmin) {
                const tpl = document.getElementById('add-card-template');
                if (tpl) frag.appendChild(tpl.content.cloneNode(true));
            }

            grid.innerHTML = '';
            grid.appendChild(frag);
            if (window.lucide) lucide.createIcons();
            UIManager.initTooltips();
            this.updateCount(visible);
            this.checkStatus();

            // Sortable
            if (State.sortableInstance) { State.sortableInstance.destroy(); State.sortableInstance = null; }
            if (window.Sortable) {
                State.sortableInstance = new Sortable(grid, {
                    animation: 180, filter: '.add-new-card, .folder-card',
                    disabled: !State.isAdmin, ghostClass: 'sortable-ghost',
                    onEnd: () => {
                        const names = Array.from(grid.querySelectorAll('.card:not(.add-new-card):not(.folder-card)')).map(c => c.dataset.service);
                        localStorage.setItem('it-lab-custom-order', JSON.stringify(names));
                    }
                });
            }
        },

        _makeCard(type, s, folderItems, usage) {
            const el = document.createElement('div');
            if (type === 'folder') {
                el.className = 'card folder-card';
                el.innerHTML = `
                    <div class="card-sparkline"></div>
                    <div class="card-header">
                        <div class="card-icon-box"><i data-lucide="folder"></i></div>
                    </div>
                    <div class="card-body">
                        <h3>📁 ${s.folder}</h3>
                        <p style="font-family:var(--font-mono);font-size:0.75rem;">${folderItems.length} SERVICES</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-outline open-folder-btn" data-folder="${s.folder}" style="font-size:0.75rem;">
                            <i data-lucide="grid"></i> OUVRIR
                        </button>
                    </div>`;
            } else {
                el.className = 'card';
                el.dataset.id  = s.id;
                el.dataset.url = s.url || '';
                el.dataset.service = s.name;
                const icon = s.logo ? `<img src="${s.logo}" alt="">` : `<i data-lucide="${s.icon || 'server'}"></i>`;
                const usageBadge = (State.currentCategory === 'top' && usage[s.id])
                    ? `<div class="top-badge">${usage[s.id]}</div>` : '';

                el.innerHTML = `
                    <div class="card-sparkline"></div>
                    <div class="card-header">
                        <div class="card-icon-box">${icon}</div>
                        <div class="status-badge">
                            <span class="status-dot" title="Vérification..."></span>
                        </div>
                        ${usageBadge}
                    </div>
                    <div class="card-body">
                        <h3>${s.name}</h3>
                        <p>${s.description}</p>
                        ${s.folder && State.isAdmin ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:6px;font-family:var(--font-mono);">📁 ${s.folder}</div>` : ''}
                    </div>
                    <div class="card-footer">
                        <a href="${s.url}" class="btn btn-outline"
                           target="${window.isNewTab ? '_blank' : '_self'}" rel="noopener noreferrer"
                           style="font-size:0.75rem;">OUVRIR</a>
                        <div class="action-bar">
                            <button class="action-sm fav-btn ${s.favorite ? 'favorited' : ''}" data-id="${s.id}" title="Favori">
                                <i data-lucide="star" fill="${s.favorite ? 'var(--amber)' : 'none'}"></i>
                            </button>
                            <button class="action-sm edit-btn"   data-id="${s.id}" title="Modifier"><i data-lucide="edit-2"></i></button>
                            <button class="action-sm delete-btn" data-id="${s.id}" title="Supprimer"><i data-lucide="trash-2"></i></button>
                        </div>
                    </div>`;
            }
            return el;
        },

        bindDelegation() {
            const grid = document.getElementById('services-grid');
            if (!grid) return;
            grid.addEventListener('click', e => {
                const card = e.target.closest('.card');
                if (!card) return;
                if (e.target.closest('.open-folder-btn')) { this.openFolder(e.target.closest('.open-folder-btn').dataset.folder); return; }
                if (card.classList.contains('add-new-card')) { this.openAdminModal(); return; }
                if (e.target.closest('.fav-btn')) {
                    const s = State.services.find(x => String(x.id) === card.dataset.id);
                    if (s) {
                        s.favorite = !s.favorite;
                        this.saveFavorites();
                        if (s.favorite) window.fireConfetti?.(e.clientX, e.clientY);
                        this.renderCards();
                    }
                    return;
                }
                if (e.target.closest('.edit-btn')) { this.openAdminModal(card.dataset.id); return; }
                if (e.target.closest('.delete-btn')) {
                    if (confirm('Supprimer ce service ?')) {
                        State.services = State.services.filter(x => String(x.id) !== card.dataset.id);
                        this.renderCategories(); this.renderCards();
                    }
                    return;
                }
                // Usage tracking & full-card click
                if (!e.target.closest('a') && !e.target.closest('button') && !card.classList.contains('folder-card') && card.dataset.id) {
                    const u = JSON.parse(localStorage.getItem('it-lab-usage') || '{}');
                    u[card.dataset.id] = (u[card.dataset.id] || 0) + 1;
                    localStorage.setItem('it-lab-usage', JSON.stringify(u));
                    if (window.isFullCard && !State.isAdmin && card.dataset.url) {
                        window.open(card.dataset.url, window.isNewTab ? '_blank' : '_self');
                    }
                }
            });
        },

        openFolder(name) {
            document.getElementById('folder-modal-title').textContent = `📁 ${name}`;
            const fGrid = document.getElementById('folder-grid');
            fGrid.innerHTML = '';
            State.services.filter(s => s.folder === name).forEach(s => {
                const el = document.createElement('div');
                el.className = 'card';
                el.style.padding = '14px';
                el.innerHTML = `
                    <div class="card-sparkline"></div>
                    <div class="card-header" style="margin-bottom:10px;">
                        <div class="card-icon-box" style="width:36px;height:36px;">
                            ${s.logo ? `<img src="${s.logo}">` : `<i data-lucide="${s.icon || 'server'}"></i>`}
                        </div>
                        <span style="font-size:0.9rem;font-weight:600;">${s.name}</span>
                    </div>
                    <div class="card-footer" style="padding:0;border:none;">
                        <a href="${s.url}" class="btn btn-outline btn-full" target="${window.isNewTab?'_blank':'_self'}" style="font-size:0.75rem;">OUVRIR</a>
                    </div>`;
                fGrid.appendChild(el);
            });
            if (window.lucide) lucide.createIcons();
            document.getElementById('folder-modal').classList.add('active');
        },

        updateCount(n) {
            const el = document.getElementById('services-count');
            if (el) el.textContent = `// ${n} SERVICE${n !== 1 ? 'S' : ''} ACTIF${n !== 1 ? 'S' : ''}`;
        },

        checkStatus() {
            const cards = Array.from(document.querySelectorAll('#services-grid .card:not(.folder-card):not(.add-new-card)'));
            let i = 0;
            const next = () => {
                if (i >= cards.length) return;
                const card = cards[i];
                const dot  = card.querySelector('.status-dot');
                const url  = card.dataset.url;
                if (url && dot) {
                    fetch(url, { mode: 'no-cors', cache: 'no-cache' })
                        .then(() => { dot.className = 'status-dot online'; })
                        .catch(() => { dot.className = 'status-dot offline'; })
                        .finally(() => { i++; setTimeout(next, 60); });
                } else { i++; next(); }
            };
            next();
        },

        initAdminPanel() {
            const toggle = document.getElementById('admin-toggle');
            if (toggle) {
                toggle.addEventListener('click', () => {
                    State.isAdmin = !State.isAdmin;
                    document.body.classList.toggle('admin-mode', State.isAdmin);
                    toggle.textContent = '';
                    const icon = document.createElement('i'); icon.setAttribute('data-lucide', 'shield-alert');
                    toggle.appendChild(icon);
                    toggle.append(` ${State.isAdmin ? 'DÉSACTIVER ADMIN' : 'MODE ADMINISTRATEUR'}`);
                    toggle.classList.toggle('btn-primary', State.isAdmin);
                    toggle.classList.toggle('btn-outline', !State.isAdmin);
                    document.getElementById('export-profile')?.classList.toggle('btn-hidden', !State.isAdmin);
                    document.getElementById('import-profile')?.classList.toggle('btn-hidden', !State.isAdmin);
                    if (window.lucide) lucide.createIcons();
                    if (State.sortableInstance) State.sortableInstance.option('disabled', !State.isAdmin);
                    this.renderCards();
                });
            }

            document.getElementById('btn-cancel-modal')?.addEventListener('click', () =>
                document.getElementById('admin-modal').classList.remove('active'));

            document.getElementById('service-form')?.addEventListener('submit', e => {
                e.preventDefault(); this.saveService();
            });

            // Export
            document.getElementById('export-profile')?.addEventListener('click', () => {
                const p = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k.startsWith('it-lab-')) p[k] = localStorage.getItem(k);
                }
                p.dashboardServices = State.services;
                const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob); a.download = 'profile.itlab'; a.click();
            });

            // Import — fixed: e.target.files (not e.files)
            document.getElementById('import-profile-file')?.addEventListener('change', e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    try {
                        const p = JSON.parse(ev.target.result);
                        Object.keys(p).filter(k => k.startsWith('it-lab-')).forEach(k => localStorage.setItem(k, p[k]));
                        alert('Profil importé ! Rechargement en cours...');
                        location.reload();
                    } catch(ex) { alert('Fichier .itlab invalide'); }
                };
                reader.readAsText(file);
            });
        },

        openAdminModal(id = null) {
            const modal = document.getElementById('admin-modal');
            const title = document.getElementById('modal-title');
            document.getElementById('service-form').reset();
            if (id) {
                const s = State.services.find(x => String(x.id) === String(id));
                if (s) {
                    title.textContent = 'Modifier le Service';
                    document.getElementById('service-id').value    = s.id;
                    document.getElementById('service-name').value  = s.name || '';
                    document.getElementById('service-type').value  = s.type || '';
                    document.getElementById('service-desc').value  = s.description || '';
                    document.getElementById('service-url').value   = s.url || '';
                    document.getElementById('service-icon').value  = s.logo || s.icon || '';
                    const ff = document.getElementById('service-folder');
                    if (ff) ff.value = s.folder || '';
                }
            } else {
                title.textContent = 'Ajouter un Service';
            }
            modal.classList.add('active');
        },

        saveService() {
            const id  = document.getElementById('service-id').value;
            const ico = document.getElementById('service-icon').value;
            const s = {
                id:          id || `srv-${Date.now()}`,
                name:        document.getElementById('service-name').value,
                type:        document.getElementById('service-type').value.toLowerCase(),
                description: document.getElementById('service-desc').value,
                url:         document.getElementById('service-url').value,
                folder:      document.getElementById('service-folder')?.value.trim() || ''
            };
            if (ico.startsWith('http')) s.logo = ico; else s.icon = ico;
            if (!s.folder) delete s.folder;

            if (id) {
                const idx = State.services.findIndex(x => String(x.id) === String(id));
                if (idx > -1) { s.favorite = State.services[idx].favorite; State.services[idx] = s; }
            } else { State.services.push(s); }

            document.getElementById('admin-modal').classList.remove('active');
            this.renderCategories();
            this.renderCards();
        }
    };

    // ==========================================
    // Confetti
    // ==========================================
    window.fireConfetti = function(x, y) {
        if (typeof confetti !== 'function') return;
        confetti({
            particleCount: 55, spread: 65,
            origin: { x: x / window.innerWidth, y: y / window.innerHeight },
            colors: [getComputedStyle(document.documentElement).getPropertyValue('--accent-main').trim(), '#ffffff', '#a78bfa'],
            startVelocity: 28, ticks: 90, gravity: 0.8, scalar: 0.88
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

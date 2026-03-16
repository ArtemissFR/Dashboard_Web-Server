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

    // Hover sound effect or click animation placeholder
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Potential for sound effects or micro-interactions
        });

        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') {
                const link = card.querySelector('a');
                if (link) {
                    window.open(link.href, '_blank');
                }
            }
        });
    });

    // Reveal animation for cards on load
    const revealCards = () => {
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`;
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        });
    };

    revealCards();

    // Theme Management Logic
    const settingsToggle = document.getElementById('settings-toggle');
    const themePanel = document.getElementById('theme-panel');
    const themeDots = document.querySelectorAll('.theme-dot');
    
    // Load saved theme
    const savedTheme = localStorage.getItem('it-lab-theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }

    // Toggle Panel
    settingsToggle.addEventListener('click', () => {
        themePanel.classList.toggle('active');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!themePanel.contains(e.target) && !settingsToggle.contains(e.target)) {
            themePanel.classList.remove('active');
        }
    });

    // Change Theme
    themeDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const color = dot.dataset.color;
            setTheme(color);
            localStorage.setItem('it-lab-theme', color);
            
            // UI Feedback
            themeDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });

    function setTheme(color) {
        document.documentElement.style.setProperty('--accent-main', color);
        
        // Update active state of dots
        themeDots.forEach(dot => {
            if (dot.dataset.color === color) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Health Check Logic
    function checkAllServices() {
        cards.forEach(card => {
            const link = card.querySelector('a');
            const dot = card.querySelector('.status-dot');
            const statusText = card.querySelector('.status-text');
            
            if (link && dot && statusText) {
                const url = link.href;
                
                // Use fetch with no-cors to check if server is reachable
                // This is a "silent ping" technique
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

    // Initial check and every 60 seconds
    checkAllServices();
    setInterval(checkAllServices, 60000);
});

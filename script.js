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
                    window.location.href = link.href;
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
});

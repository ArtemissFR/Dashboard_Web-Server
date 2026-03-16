# Satel Lab Dashboard

Un tableau de bord moderne, stylisé et interactif pour superviser et accéder rapidement aux services de votre infrastructure IT Lab.

## 🚀 Fonctionnalités

- **Interface Dynamique** : Design premium avec effets de verre (glassmorphism), animations fluides et arrière-plan animé.
- **Tuiles de Services** : Accès rapide à XCP-NG, TrueNAS, Xen Orchestra (XOA) et PfSense.
- **Vérification d'État (Health Check)** : Surveillance en temps réel de la disponibilité des services (En ligne / Hors ligne).
- **Personnalisation** : Sélecteur de couleurs d'accentuation avec sauvegarde locale (localStorage).
- **Navigation Optimisée** : Ouverture automatique des liens dans de nouveaux onglets pour ne pas perdre la vue d'ensemble.
- **Widgets Temps Réel** : Horloge et date dynamiques avec salutations personnalisées selon l'heure de la journée.

## 🛠️ Stack Technique

- **HTML5** : Structure sémantique et SEO-friendly.
- **Vanilla CSS** : Design système personnalisé, variables CSS, et responsive design.
- **JavaScript (ES6)** : Logique de dashboard, gestion d'état, et interactions.
- **Lucide Icons** : Bibliothèque d'icônes vectorielles élégantes.
- **Google Fonts** : Typographie "Outfit" pour un look moderne et professionnel.

## 📁 Structure du Projet

```text
Dashboard_Web-Server/
├── index.html      # Structure principale du dashboard
├── style.css       # Styles, animations et thématique
├── script.js       # Logique, horloge, health checks et thèmes
├── favicon.ico     # Icône du site
└── README.md       # Documentation du projet (ce fichier)
```

## ⚙️ Installation & Utilisation

1. Clonez ou téléchargez les fichiers dans le répertoire racine de votre serveur web (Nginx, Apache, etc.).
2. Modifiez les liens `href` dans `index.html` pour qu'ils correspondent aux adresses IP ou DNS de vos services locaux.
3. Ouvrez le dashboard dans n'importe quel navigateur moderne.

## 📸 Aperçu

Le dashboard utilise un thème sombre par défaut avec des accents de couleur modifiables via le panneau de paramètres (icône engrenage).

---
*© 2025-2026 Satel Lab Infrastructure | Dashboard*

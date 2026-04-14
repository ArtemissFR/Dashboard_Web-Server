# Satel Lab Dashboard

Un tableau de bord Web moderne, stylisé et interactif pour superviser et accéder rapidement à toute l'infrastructure (XCP-NG, TrueNAS, PfSense, etc.).

## 🚀 Fonctionnalités Principales

- **Interface Futuriste & Premium** : Design de type NOC (Network Operations Center) avec effets glassmorphism, thème sombre par défaut, et particules interactives en arrière-plan.
- **Gestion Dynamique des Services (Admin Mode)** : Ajoutez, éditez, supprimez et réorganisez (Drag & Drop) les services en temps réel. Organisation possible via un système de **Dossiers**.
- **Palette de Commande (Ctrl+K)** : Outil de recherche intégré pour trouver un service, filtrer par catégorie et exécuter des actions rapidement. Recherche de secours intégrée via Google ou DuckDuckGo.
- **Bloc-Notes Intégré (Scratchpad)** : Widget flottant persisté localement pour noter rapidement des adresses IP ou des commandes.
- **Paramètres Avancés** :
  - *Personnalisation Visuelle* : Sélection de couleurs d'accentuation, polices personnalisables (Inter, Roboto, Outfit, Fira Code, Space Grotesk), densité et vitesse des particules.
  - *Affichage* : Changement d'échelle UI (Compact/Standard/Large), disposition Grille ou Liste, Mode Kiosque (plein écran).
  - *Modes Sombre / Clair* automatique ou forcé.
- **Import / Export** : Sauvegardez et restaurez vos configurations de dashboard au format JSON / ITLAB.
- **Système de Favoris** : Mettez en avant vos hôtes les plus critiques. Menu contextuel personnalisé (clic droit) pour copier l'URL ou ouvrir le service.
- **Widgets Intégrés** : Horloge, date et intégration de la météo temps réel (geo IP locale) et de ses effets (pluie/neige sur les particules).

## 🛠️ Stack Technique

- **Code Frontend** : HTML5, Vanilla JavaScript (ES6+), Vanilla CSS (variables natives).
- **Icônes** : Lucide Icons (vecteurs légers et propres).
- **Bibliothèques externes** : Tippy.js (Tooltips), SortableJS (Drag & Drop), Particles.js (Arrière-plan).

## 📁 Structure du Projet

```text
Dashboard_Web-Server/
├── index.html      # Structure UI, panneaux de configuration
├── style.css       # Design System complet, animations et responsivité
├── script.js       # Logique (Services, Widgets, Command Palette, Stockage local)
├── config.json     # Fichier de base de données (généré à l'export)
├── favicon.png     # Icône de l'application
└── README.md       # Documentation
```

## ⚙️ Installation & Utilisation

1. Placez l'ensemble des fichiers dans le dossier source de votre serveur Web (Apache, Nginx, ou un simple Caddy Server).
2. Vérifiez la présence et la mise en forme initiale de `config.json` afin de charger vos services primaires.
3. Chargez l'interface. Cliquez sur le bouton "Paramètres" en haut à droite, puis sur "**Mode Administrateur**" pour commencer à ajouter et structurer vos services directement depuis le tableau de bord.
4. Les préférences utilisateurs (Thème, favoris, disposition, bloc-notes) sont stockées dans le `localStorage` de votre navigateur.

---
*© 2025-2026 Satel Lab Infrastructure | Dashboard*

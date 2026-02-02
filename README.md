# Système de Gestion de Projets Fullstack

Ce projet est une application complète de gestion de tâches et de projets utilisant **Laravel** (Backend) et **Angular** (Frontend), le tout orchestré par **Docker**.

##  Fonctionnalités
- Gestion complète (CRUD) des projets et des tâches.
- Système d'authentification sécurisé.
- Architecture micro-services avec Docker Compose.

##  Installation et Lancement

### Prérequis
- **Docker Desktop** installé et démarré.

### Étapes pour lancer le projet
1. **Cloner le projet :**
   ```bash
   git clone https://github.com/emna-selmi/projet-fullstack.git
   cd projet-fullstack
   ```

2. **Lancer les conteneurs :**
   ```bash
   docker-compose up -d --build
   ```

3. **Initialiser la base de données :**
   ```bash
   docker exec -it laravel_app php artisan migrate --seed
   ```

4. **Accès :**
   - **Frontend :** http://localhost:4200
   - **Backend :** http://localhost:8000

---
*Projet réalisé par Emna Selmi.*

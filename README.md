# Systeme de Gestion de Projets Fullstack

Ce projet est une application de gestion de projets et de taches developpee avec une architecture decouplee. Le backend est propulse par le framework Laravel et le frontend par Angular. L'ensemble de l'infrastructure est virtualise a l'aide de Docker pour garantir une coherence entre les environnements de developpement.

## Architecture Technique

Le projet repose sur trois services principaux orchestres par Docker Compose :
1. Un serveur web Apache avec PHP 8.2 pour l'API Laravel.
2. Un serveur de base de données MySQL 8.0.
3. Un serveur de developpement Node.js pour l'application Angular.

## Installation et Configuration

### Prerequis
L'installation de Docker Desktop est imperative. Le moteur Docker doit etre actif avant de proceder aux etapes suivantes.

### Procedure de deploiement

1. Recuperation du code source :
git clone https://github.com/emna-selmi/projet-fullstack.git
cd projet-fullstack

2. Configuration des variables d'environnement :
cp backend/.env.example backend/.env

3. Construction et demarrage des conteneurs :
docker-compose up -d --build

4. Initialisation de l'application :
docker-compose exec backend composer install
docker-compose exec backend php artisan key:generate
docker-compose exec backend php artisan migrate:fresh --seed

## Acces a l'application

Interface utilisateur (Angular) : http://localhost:4200
Interface API (Laravel) : http://localhost:8000

## Identifiants de test

Identifiant : admin@system.com
Mot de passe : admin123

Identifiant : test@dev.com
Mot de passe : user123



## Maintenance et depannage

En cas de probleme de synchronisation des donnees, il est recommande de reinitialiser les volumes Docker :
docker-compose down -v
docker-compose up -d
docker-compose exec backend php artisan migrate:fresh --seed

Realise par Emna Selmi.

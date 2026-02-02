
FROM php:8.2-apache

# 1. Mise à jour du système et installation des outils de base
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    curl

# 2. Installation des extensions PHP indispensables pour Laravel et MySQL
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# 3. Activation du module "Rewrite" d'Apache pour les URLs de Laravel
RUN a2enmod rewrite

# 4. Changement du document root d'Apache pour pointer vers le dossier 'public' de Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 5. Installation de Composer (pour que l'utilisateur puisse installer les packages)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 6. Dossier de travail
WORKDIR /var/www/html

# 7. Copie du code (le dossier backend actuel) vers le conteneur
COPY . .

# 8. Permissions pour les dossiers de stockage de Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80
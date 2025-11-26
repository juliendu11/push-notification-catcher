FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port 6555
EXPOSE 6555

# Démarrer l'application
CMD ["npm", "start"]

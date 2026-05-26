FROM node:20-alpine

WORKDIR /app

# Installer les dépendances en premier (cache Docker layer)
COPY package*.json ./
RUN npm install --omit=dev

COPY src/ ./src/

EXPOSE 8000

CMD ["node", "src/app.js"]

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install
COPY src/ ./src/
COPY tests/ ./tests/
CMD ["node", "src/server.js"]

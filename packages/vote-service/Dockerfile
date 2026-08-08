FROM node:20-alpine
WORKDIR /app

# Install shared package dependencies
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm install --production

# Copy shared source
WORKDIR /app
COPY shared ./shared

COPY packages/vote-service/package*.json ./packages/vote-service/
WORKDIR /app/packages/vote-service
RUN npm install --production
COPY packages/vote-service/src ./src
EXPOSE 3003
CMD ["node", "src/index.js"]

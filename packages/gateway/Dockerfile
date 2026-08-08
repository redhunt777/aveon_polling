FROM node:20-alpine
WORKDIR /app

# Install shared package dependencies
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm install --production

# Copy shared source
WORKDIR /app
COPY shared ./shared

COPY packages/gateway/package*.json ./packages/gateway/
WORKDIR /app/packages/gateway
RUN npm install --production
COPY packages/gateway/src ./src
EXPOSE 3000
CMD ["node", "src/index.js"]

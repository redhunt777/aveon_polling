FROM node:20-alpine
WORKDIR /app

# Install shared package dependencies
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm install --production

# Copy shared source
WORKDIR /app
COPY shared ./shared

# Copy service package and install
COPY packages/auth-service/package*.json ./packages/auth-service/
WORKDIR /app/packages/auth-service
RUN npm install --production

# Copy source
COPY packages/auth-service/src ./src

EXPOSE 3001
CMD ["node", "src/index.js"]

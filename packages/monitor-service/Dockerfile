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
COPY packages/monitor-service/package*.json ./packages/monitor-service/
WORKDIR /app/packages/monitor-service
RUN npm install --production

# Copy source
COPY packages/monitor-service/src ./src

EXPOSE 3005
CMD ["node", "src/index.js"]

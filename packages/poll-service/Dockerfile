FROM node:20-alpine
WORKDIR /app

# Install shared package dependencies
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm install --production

# Copy shared source
WORKDIR /app
COPY shared ./shared

COPY packages/poll-service/package*.json ./packages/poll-service/
WORKDIR /app/packages/poll-service
RUN npm install --production
COPY packages/poll-service/src ./src
EXPOSE 3002
CMD ["node", "src/index.js"]

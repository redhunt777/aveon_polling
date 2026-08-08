FROM node:20-alpine
WORKDIR /app
COPY packages/notification-service/package*.json ./
RUN npm install --production
COPY packages/notification-service/src ./src
EXPOSE 3004
CMD ["node", "src/index.js"]

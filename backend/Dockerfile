FROM node:22-slim
WORKDIR /app
COPY package.json ./
COPY src ./src
ENV PORT=8080 DATABASE_PATH=/data/speedcap.db
VOLUME /data
EXPOSE 8080
CMD ["npm", "start"]

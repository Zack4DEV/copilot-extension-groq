FROM node:23.11.0-alpine AS builder
USER node
WORKDIR /usr/src/app
ENV NODE_ENV production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
COPY /usr/src/app/dist ./dist

ENV PORT=8080
EXPOSE 8080
CMD [ "node", "dist/index.js" ]

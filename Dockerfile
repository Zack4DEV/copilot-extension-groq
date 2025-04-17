FROM node:23.11.0-alpine AS builder
USER node
COPY . /usr/src/app
WORKDIR /usr/src/app
ADD . /usr/src/app
ENV NODE_ENV production
RUN npm install --force
RUN npm run build

ENV PORT=8080
EXPOSE 8080
CMD [ "node", "dist/index.js" ]

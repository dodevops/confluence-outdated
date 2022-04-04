FROM node:12-alpine

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN npm install && \
    npx grunt build

ENTRYPOINT ["node", "index.js"]

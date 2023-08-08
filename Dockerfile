FROM node:alpine
LABEL name "Sakura Bot"
LABEL version "0.0.2"
LABEL maintainer "Kevin <akira.antisocialsociety@gmail.com>"
ARG VERSION
ENV NODE_ENV= \
    BOT_TOKEN= \
    BOT_OWNERS= \
    DB_USER= \
    DB_PASSWORD= \
    DB_NAME= \
    DB_HOST= \
    DB_PORT= \
    RAVEN= \
    PATREON_TOKEN= \
    VERSION=$VERSION

RUN apk update

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

#  Install dependencies
RUN apk add --no-cache ffmpeg

RUN apk add --update \
    && apk add --no-cache --virtual .build-deps git curl python g++ make \
    \
    # Install node.js dependencies
    && yarn install \
    \
    # Clean up build dependencies
    && apk del .build-deps

COPY --chown=node:node . .

USER node
CMD [ "node", "src/index.js" ]
FROM node:20-alpine AS development-dependencies-env

COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env

COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:20-alpine

RUN apk update && apk add --no-cache \
    bash \
    build-base python3 py3-pip \
    ffmpeg \
    ca-certificates \
    g++ make gcc libffi-dev openssl-dev

ENV PIP_NO_CACHE_DIR=off
RUN pip install packaging --break-system-packages
RUN pip install https://github.com/yt-dlp/yt-dlp/archive/master.zip --break-system-packages

COPY ./package.json package-lock.json /app/
COPY ./bin /app/bin/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app

EXPOSE 3000

CMD ["npm", "run", "start"]
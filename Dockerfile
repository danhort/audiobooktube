FROM node:20-alpine AS base

RUN apk update && apk add --no-cache \
    bash \
    findutils \
    build-base python3 py3-pip \
    ffmpeg \
    ca-certificates \
    g++ make gcc libffi-dev openssl-dev

ENV PIP_NO_CACHE_DIR=off
RUN pip install packaging --break-system-packages
RUN pip install https://github.com/yt-dlp/yt-dlp/archive/master.zip --break-system-packages

FROM base AS dev

COPY . /app
WORKDIR /app
RUN npm ci

FROM base AS prod

COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM base AS build
COPY . /app/
COPY --from=dev /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM base

COPY ./package.json package-lock.json /app/
COPY ./bin /app/bin/
COPY --from=prod /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
WORKDIR /app

EXPOSE 3000

CMD ["npm", "run", "start"]
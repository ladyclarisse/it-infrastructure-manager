FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_APP_ID
ARG VITE_OAUTH_PORTAL_URL
ENV VITE_APP_ID=$VITE_APP_ID
ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=build /app/dist/public /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1

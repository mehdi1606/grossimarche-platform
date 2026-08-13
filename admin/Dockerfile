# Grossimarché back-office (Vite SPA). Build with base=/admin/ so it lives under the
# gateway's /admin path, then serve the static bundle with nginx.
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts --no-audit --no-fund

COPY . .
# All admin API calls go same-origin through the gateway.
ENV VITE_APP_API_BASE_URL=/api/v1
RUN npm run build -- --base=/admin/

FROM nginx:alpine
# Built assets live under /admin/ (base), so serve them from a matching subdirectory.
COPY --from=build /app/dist /usr/share/nginx/html/admin
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Grossimarché storefront (Next.js). Single stage: install (incl. devDeps for the build),
# build, then run `next start`. Native `sharp` build is skipped (--ignore-scripts) - Next
# falls back for image optimization; the storefront's product images come from the backend.
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts --no-audit --no-fund

COPY . .
# Browser calls the API same-origin through the nginx gateway.
ENV NEXT_PUBLIC_API_BASE_URL=/api/v1
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]

# Production image: a standalone Next.js server with the SQLite database in /app/data.
FROM node:22-bookworm-slim AS build
WORKDIR /app
# npm builds better-sqlite3 from source.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 DATABASE_PATH=/app/data/crm.db
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# For resetting a password: docker exec -it <container> node scripts/reset-password.mts <email>
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/lib/password.ts ./lib/password.ts
RUN mkdir data && chown node:node data
USER node
VOLUME /app/data
EXPOSE 3000
CMD ["node", "server.js"]

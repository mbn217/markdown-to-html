# syntax=docker/dockerfile:1

# Keep build and runtime on the same libc and Node major for native dependencies.
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

LABEL org.opencontainers.image.title="Markdown to HTML" \
      org.opencontainers.image.description="Private, client-side Markdown to standalone HTML converter"

# Next's standalone output excludes public files and browser/worker chunks.
# Copy both explicitly; do not install the full dependency tree in the runtime.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "const http=require('node:http');const req=http.get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/'},res=>{res.resume();process.exit(res.statusCode===200?0:1)});req.setTimeout(3000,()=>{req.destroy();process.exit(1)});req.on('error',()=>process.exit(1));"
CMD ["node", "server.js"]
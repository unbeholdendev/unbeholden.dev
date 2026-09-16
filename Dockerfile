FROM oven/bun:1.4-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG UMAMI_WEBSITE_ID
RUN bun run build

FROM oven/bun:1.4-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/dist ./dist
# The adapter binds loopback unless told otherwise, which nothing outside the container can reach.
ENV HOST=0.0.0.0
EXPOSE 4321
CMD ["bun", "run", "dist/server/entry.mjs"]

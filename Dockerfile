FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Source code
COPY . .

# Prisma Generate & Production Build
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]

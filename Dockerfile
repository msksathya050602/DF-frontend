# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY . .

ENV HUSKY=0
COPY package*.json ./
RUN npm install
RUN npm run build

# Production Stage
FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]


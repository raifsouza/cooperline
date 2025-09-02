    # # --- Estágio 1: Builder ---
    # # Compila a aplicação Angular
    # FROM node:18-alpine AS build
    # WORKDIR /app

    # COPY package*.json ./
    # # Usa 'npm ci' para uma instalação limpa e rápida de dependências
    # RUN npm ci

    # COPY . .
    # RUN npm run build

    # # --- Estágio 2: Runner ---
    # # Prepara o ambiente de produção para RODAR o servidor Node.js
    # FROM node:18-alpine
    # WORKDIR /app

    # # Copia apenas as dependências de produção do estágio anterior
    # COPY --from=build /app/package*.json ./
    # RUN npm ci --omit=dev

    # # Copia a pasta 'dist' inteira, que contém as builds de 'browser' e 'server'
    # # ATENÇÃO: O nome da pasta deve ser o nome do seu projeto, ex: 'cooperline'
    # COPY --from=build /app/dist/copperline ./dist/coperline

    # # Expõe a porta que o servidor Angular SSR geralmente usa (padrão 4200)
    # EXPOSE 4200

    # # Comando para INICIAR o servidor Node.js da sua aplicação Angular.
    # # Este é o comando que executa o seu aplicativo.
    # CMD ["node", "dist/cooperline/server/server.mjs"]

    # Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the SSR application
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 4200
EXPOSE 4200

# Start the SSR server
CMD ["node", "dist/cooperline/server/server.mjs"]
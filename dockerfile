    # --- Estágio 1: Builder ---
    # Compila a aplicação Angular
    FROM node:18-alpine AS build
    WORKDIR /app

    COPY package*.json ./
    # Usa 'npm ci' para uma instalação limpa e rápida de dependências
    RUN npm ci

    COPY . .
    
    RUN npm run build

    # --- Estágio 2: Runner ---
    # Prepara o ambiente de produção para RODAR o servidor Node.js
    FROM node:18-alpine
    WORKDIR /app

    # Copia apenas as dependências de produção do estágio anterior
    COPY --from=build /app/package*.json ./
    RUN npm ci --omit=dev

    # Copia a pasta 'dist' inteira, que contém as builds de 'browser' e 'server'
    # ATENÇÃO: O nome da pasta deve ser o nome do seu projeto, ex: 'cooperline'
    COPY --from=build /app/dist/copperline ./dist/copperline

    # Expõe a porta que o servidor Angular SSR geralmente usa (padrão 4200)
    EXPOSE 4000

    # Comando para INICIAR o servidor Node.js da sua aplicação Angular.
    # Este é o comando que executa o seu aplicativo.
    CMD ["node", "dist/copperline/server/server.mjs"]
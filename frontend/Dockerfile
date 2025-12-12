FROM node:20-alpine

WORKDIR /app

# Kopiujemy pliki definicji pakietów
COPY package.json package-lock.json* ./

# Instalacja zależności
RUN npm install

# Reszta kodu będzie montowana przez wolumen w docker-compose,
# ale kopiujemy na wypadek budowania obrazu produkcyjnego.
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
# Builder
FROM node:19-slim AS BUILDER

WORKDIR /app

RUN apt update && apt install -y build-essential libtool

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json .
COPY src  ./src
RUN npm run build

# Runner
FROM node:19-slim
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

WORKDIR /app
COPY --from=BUILDER /app/ ./

CMD ["npm", "run", "start"]

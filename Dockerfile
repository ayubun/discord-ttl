# Source: https://towardsdev.com/writing-a-docker-file-for-your-node-js-typescript-micro-service-c5170b957893
# STAGE 1
FROM node:16-alpine as builder
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN npm config set unsafe-perm true
USER node
RUN yarn
COPY --chown=node:node . .
RUN yarn build

# STAGE 2
FROM node:16-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package.json yarn.lock ./
USER node

RUN yarn install --production
COPY --from=builder /home/node/app/dist ./dist

CMD [ "node", "dist/app.js" ]

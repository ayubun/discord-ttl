FROM node:current-alpine
WORKDIR /usr/src/app
COPY yarn.lock package.json tsconfig.json /usr/src/app/
ADD src /usr/src/app/src
RUN yarn install && yarn build

FROM node:current-alpine
WORKDIR /usr/src/app
COPY --from=0 /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=0 /usr/src/app/dist /usr/src/app/dist
CMD node /usr/src/app/dist/app.js
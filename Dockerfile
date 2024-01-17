###
###  layer 1: install deps & compile typescript
###
FROM oven/bun:alpine
#
WORKDIR /usr/app
COPY bun.lockb package.json tsconfig.json /usr/app/
ADD src /usr/app/src
# drizzle orm requires node :c
RUN apk add nodejs
#
RUN bun install 
RUN bun compile

###
###    (final)
###  layer 2: run
###
FROM oven/bun:alpine
#
WORKDIR /usr/app
COPY --from=0 /usr/app/node_modules /usr/app/node_modules
COPY --from=0 /usr/app/dist /usr/app/dist
#
CMD bun run /usr/app/dist/app.js

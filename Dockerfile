###
###  layer 1: install deps & compile typescript
###
FROM oven/bun:alpine
#
WORKDIR /usr/app
COPY bun.lockb package.json tsconfig.json /usr/app/
ADD drizzle /usr/app/drizzle
ADD src /usr/app/src
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
COPY --from=0 /usr/app/drizzle /usr/app/drizzle
#
CMD bun run /usr/app/dist/app.js

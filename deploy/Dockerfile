FROM mhart/alpine-node:8.14.0

# alpine deps
RUN apk --update add bash git

RUN apk add --virtual build-deps --no-cache \
  python \
  build-base \
  make

# get code in there (this can be shared b/t staging and prod if it goes before args)
ADD . /snack/app/
ENV APP_PATH "/snack/app"

WORKDIR /
RUN tar xzf /snack/app/web-snack-libraries.tar.gz && rm /snack/app/web-snack-libraries.tar.gz

# set up the webpack/next.js build variables
ENV NODE_ENV "production"

ARG APP_VERSION
ENV APP_VERSION ${APP_VERSION}

ARG API_SERVER_URL
ENV API_SERVER_URL ${API_SERVER_URL}

ARG IMPORT_SERVER_URL
ENV IMPORT_SERVER_URL ${IMPORT_SERVER_URL}

ARG CDN_URL
ENV CDN_URL ${CDN_URL}

ARG SNACK_SEGMENT_KEY
ENV SNACK_SEGMENT_KEY ${SNACK_SEGMENT_KEY}

WORKDIR /snack/app
# build the js
RUN yarn --frozen-lockfile --production=false && \
  yarn run build

EXPOSE 3011
CMD ["node", "."]

# Snack

Snack lets you to run complete React Native projects in the browser. This is the web app for [snack.expo.io](https://snack.expo.io/).

## Pre-requisites

Before running the web app, make sure to have the following packages installed globally on your system:

- [nodejs](https://nodejs.org/)
- [yarn](https://yarnpkg.com/lang/en/)
- [direnv](https://direnv.net/)

If you don't want to install `direnv`, check the [.envrc](.envrc) file and make sure you have the environment variables available.

## Getting started

### Quick start

After cloning the repo, open a terminal in the directory and run following to install the dependencies and start the server:

```sh
# Install dependencies
yarn

# Start the server
yarn start
```

Now you can access the web app at [localhost:3011](http://localhost:3011).

### Using the `snack.expo.test` domain

We develop Snack under [snack.expo.test](https://snack/expo.test). We use [hotel](https://github.com/typicode/hotel) to do that. To set it up, open the file `~/.hotel/conf.json` and make sure you have the `tld` set to `test`:

```json
{
  "tld": "test"
}
```

Also add the following to `~/.hotel/servers/snack.expo.json`:

```json
{
  "target": "http://localhost:3011"
}
```

Configure your system to use configure proxies automatically following [these instructions](https://github.com/typicode/hotel/blob/master/docs/README.md#system-configuration-recommended).

Now you should be able to access the snack server at [http://snack.expo.test](http://snack/expo.test).

### Setting up HTTPS with self-signed certifcate

The service worker needs HTTPS to work on the `snack.expo.test` domain. To set it up with Hotel, we need to add the `cert.pem` and `key.pem` files under the `~/.hotel` directory. To create these files, first create a configuration file for the certificate with the following content (let's call it `req.conf`):

```ini
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
[req_distinguished_name]
C = US
ST = Oregon
L = Portland
O = Expo
OU = Org
CN = expo.test
[v3_req]
keyUsage = critical, digitalSignature, keyAgreement
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = expo.test
DNS.2 = snack.expo.test
```

Then run the following command  in the same directory where you created the file to generate the certificate:

```sh
openssl req -x509 -newkey rsa:4096 -sha256 -keyout key.pem -out cert.pem -days 365 -nodes -config req.conf
```

Place the generated `cert.pem` and `key.pem` files under the `~/.hotel` directory and `hotel` should be setup to work with SSL.

You'll also need to add the certificate to the system. Under `Keychain Access` > `Certificates`, drag and drop the `cert.pem` file to do that. Double click the certificate and mark it as trusted under the "Trust" section. You'll also need to add the certificate as an exception in the browser. You can do that by clicking the padlock in the URL bar.

Now you should be able to access the snack server at [https://snack.expo.test](https://snack/expo.test).

## File organization

The web server is under `server`, which has a `src/` subdirectory where the source code resides. The build scripts also generate a `build` subdirectory with the compiled JS; this is the JS that actually runs.

The code for the client is located under `snack/`. The webpack build creates a `dist/` folder which is ignored from version control.

Scripts related to deployment, like the Dockerfile, are under `deploy`. Note: even though the scripts are under `deploy`, you must run them from this directory; they are sensitive to `cwd`.

Files related to Jest tests, like the Jest configuration, are under `jest`.

Local environment variables for development are set up in `.envrc`.

## Developing

The server uses a Koa server on production and `webpack-serve` in development.

To start the server, run `yarn start`. If you have access to the monorepo, to test with the local API server, you need to run `yarn start` in `www/` in another terminal, and make sure the `API_SERVER_URL` environment variable is set to `http://localhost:3000`. Visit `http://snack.expo.test` or `http://localhost:3011` in your browser to load the site.

`yarn start` runs a Gulp pipeline that compiles the server JavaScript, sets up a file watcher to compile changes on the fly, and starts a Koa server listening on port 3011 with Nodemon. The server is responsible for routing, serving the assets and running the weback server in development mode.

Nodemon is also configured with the `--inspect` flag, which lets you debug Node from Chrome. We use a non-default port for the inspector (9311 instead of 9229) since www's inspector uses the default port.

The page is rendered fully on the client. The server serves a HTML page for all the routes and the client handles the routing. During development, webpack will watch and rebuild client side files. The client uses a service worker, which means you need some extra steps to get it setup for development.

### Disabling cache with Service Worker

In chrome devtools, check "Bypass for network" under `Application` > `Service workers` to skip the service worker cache when working on the page.

### Running the tests

We run unit tests with Jest. Run `yarn test` in another terminal to start Jest and have it continuously watch for changes. You also can run `yarn jest` if you want to run Jest without the watcher. Keep unit tests fast so that the feedback loop from them is fast.

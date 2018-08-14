# Snack

This is the Snack website. The server uses a Koa server on production and `webpack-serve` in development.

## File organization

The web server is under `server`, which has a `src/` subdirectory where the source code resides. The build scripts also generate a `build` subdirectory with the compiled JS; this is the JS that actually runs.

The code for the client is located under `snack/`. The webpack build creates a `dist/` folder and a `static/` folder (when `ASSET_PREFIX` environment variable is set) which are ignored from version control.

Scripts related to deployment, like the Dockerfile, are under `deploy`. Note: even though the scripts are under `deploy`, you must run them from this directory; they are sensitive to `cwd`.

Files related to Jest tests, like the Jest configuration, are under `jest`.

Local environment variables for development are set up in `.envrc`.

## Developing

To start the server, run `yarn start`. You must also start the www server by running `yarn start` in `www` in another terminal. Visit `http://snack.expo.test` or `http://localhost:3011` in your browser to load the site.

`yarn start` runs a Gulp pipeline that compiles the server JS, sets up a file watcher to compile changes on the fly, and starts a Koa server listening on port 3011 in Nodemon. The server is primarily responsible for routing and setting some HTTP headers (ex: for CORS). It also sets up Next.js in development mode and runs it in the same Node process.

Nodemon is also configured with the `--inspect` flag, which lets you debug Node from Chrome. We use a non-default port for the inspector (9311 instead of 9229) since www's inspector uses the default port.

The page is rendered fully on the client. The server serves a HTML page for all the routes and the client handles the routing. During development, webpack will watch and rebuild client side files. The client uses a service worker, which means you need some extra steps to get it setup for development:

### Setup HTTPS with self-signed certifcate

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

### Disabling cache with Service Worker

In chrome devtools, check "Bypass for network" under `Application` > `Service workers` to skip the service worker cache when working on the page.

## Testing

We run unit tests with Jest. Run `yarn test` in another terminal to start Jest and have it continuously watch for changes. You also can run `yarn jest` if you want to run Jest without the watcher. Keep unit tests fast so that the feedback loop from them is fast.

## Deploying

The website is deployed using CircleCI and Kubernetes. We build a Docker image with `deploy/build_image.sh`. The image contains the built site, ready to run. Before we run it, though, we use the image to export the static assets that Next.js created, and then upload those static assets to S3.

The generated static assets are served from CloudFront, which reads from the S3 bucket. The key thing is that, because the generated assets aren't served from Node, whether someone has loaded the older version of a site before a deploy or a newer version after a deploy, when their browser makes a request to fetch JS for the page, CloudFront is able to serve both the old and new JS assets.

To deploy the server, we push the Docker image to our registry in Google Cloud and then update our Kubernetes deployment to use the new image. Kubernetes then gracefully starts new containers and drains traffic from the old ones.

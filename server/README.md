# Snack Web Server

Code inside this folder runs only on the server and should not require code outside of this
folder, aside from npm packages. It is designed to be a thin layer in front of the Next.js site,
which does most of the work.

The `server/src` directory contains the source code. The `build` script for the Snack website will
create a `server/build` directory with compiled code that Node can run. The `clean` script removes
the `server/build` directory.

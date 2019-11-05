# Including Snacks in your documentation

Snacks are a great way to show off what your library can do and let users explore how to work with it.
By letting them try out your library without installing locally you can make it easier to explore your library and ensure that they have a good first impression.

## Via embed

```<div data-snack-id="@react-navigation/basic-scrollview-tab-v3" data-snack-platform="web" data-snack-preview="true" data-snack-theme="light" style="overflow:hidden;background:#fafafa;border:1px solid rgba(0,0,0,.08);border-radius:4px;height:505px;width:100%"></div><script async src="https://snack.expo.io/embed.js"></script>```

Any elements with a `data-snack-id` or `data-snack-code` attributes will be populated with an iframe displaying the App.js file and a simulator running the snack

## Via link

https://snack.expo.io/?platform=android&name=Hello%20World&dependencies=react-navigation%40%5E4.0.10%2Creact-navigation-tabs%40%5E2.5.6%2Creact-navigation-stack%40%5E1.10.3%2Creact-navigation-drawer%40%5E2.3.3&sourceUrl=https%3A%2F%2Freactnavigation.org%2Fexamples%2F4.x%2Fhello-react-navigation.js



## Parameters

### id:
Every snack you create is available at `https://snack.expo.io/@YOUR_USERNAME/PROJECT_NAME`
Passing `@YOUR_USERNAME/PROJECT_NAME` to `data-snack-id` of an embedded snack will display the most recently saved version of your snack

### code:
If your example only requires a single file of source, you can provide it as a url encoded string to the `code` attribute 

### sourceUrl:
You can host your own code for a snack anywhere you like.  Just provide a url for a publicly accessible resource to the sourceUrl attribute.

### name:
Pass a name to provide context for your example

### dependencies:
You'll want to include dependencies in your example.  Provide a comma seperated list of `MODULE_NAME@VERSION_PIN` to the dependencies attriute to install modules into your snack

### platform:
`web|ios|android` The default platform to display your example on.  Defaults to `web` which will run as soon as your users see the snack 


# Updating dependencies

In ordinary usage, Snack only looks for new dependencies once per hour.  If you want to use snack to test a release candidate or test your documentation with your newer release, you can force an update by sending a GET request to `https://snackager.expo.io/bundle/MODULE_NAME@VERSION_PIN?bypassCache=true`


# Using Snacks for bug reports

Requesting snacks in bug reports gives your users an easy, lightweight way to give you a minimal, complete, and verifiable example (https://stackoverflow.com/help/minimal-reproducible-example) and allows you to spend more time fixing real issues in your project rather than staring at copy pasted code or cloning someone's repository that may or may not demonstrate a real issue with your project.

You may want to include a link to snack that already includes the most recent version of your library to improve 



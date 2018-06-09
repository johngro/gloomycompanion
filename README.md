# Gloomy Companion

This is a web-app for managing the monster ability decks in the board game [Gloomhaven](https://boardgamegeek.com/boardgame/174430/gloomhaven).

This is a fork of [johreh's Gloomy Companion](https://johreh.github.io/gloomycompanion/).  This fork focuses on adding support for synchronized game state across browsers, in order to support remote play.  It can be configured to store the state in [Firebase](https://firebase.google.com), and can manage multiple game states at the same time.  Each game session is identified by a unique URL, which is generated on initial visit to the game site.

## Local testing

1) Open a shell to your source checkout.
2) Run `yarn` to install all dependencies
3) Run `yarn run serve` to build the project and launch a local webserver.  The webserver will monitor the source files for changes and rebuild the code automatically.

If you would prefer to use a docker environment for testing, the `docker.sh` script provides a convenient way of launching a docker instance and running the yarn commands above.

## Deployment

1) Open a shell to your source checkout.
2) Run `mv index.prod.html index.html`
3) Run `yarn` to install all dependencies.
4) Run `yarn run build:prod` to build the project.
5) Point your webserver of choice at the source checkout.

## Configuration (necessary for Firebase support)

To make a custom configuration, create a file in the source directory named "config.local.js". 
```javascript
export const localConfig = {
  useFirebase: true,
  firebase: {
      apiKey: "your apiKey here",
      authDomain: "your authDomain here",
      databaseURL: "your databaseURL here",
      projectId: "your projectId here",
      storageBucket: "your storageBucket here",
      messagingSenderId: "your messagingSenderId here"
  }
};
```

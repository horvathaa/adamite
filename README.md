# Adamite

## Features

For developing Adamite, we use a Chrome Extensions boilerplate that helps you write modular and modern Javascript code, load CSS easily and [automatically reload the browser on code changes](https://webpack.github.io/docs/webpack-dev-server.html#automatic-refresh).

This project is built with:

- [React 16.13](https://reactjs.org)
- [Webpack 4](https://webpack.js.org/)
- [React Hot Loader](https://github.com/gaearon/react-hot-loader)
- [eslint-config-react-app](https://www.npmjs.com/package/eslint-config-react-app)
- [Prettier](https://prettier.io/)

The project structure is heavily inspired by and adapted from [https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate](https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate), with additional support for React 16.13 features and Webpack 4.


## Installing and Running

### Procedures:

1. Check if your [Node.js](https://nodejs.org/) version is >= **10.13**.
2. Clone this repository.
3. Change the name of your extension on `src/manifest.json`.
4. Run `npm install` to install the dependencies.
5. Run `npm start`
6. Load your extension on Chrome following:
   1. Access `chrome://extensions/`
   2. Check `Developer mode`
   3. Click on `Load unpacked extension`
   4. Select the `build` folder.

## Structure

All of the code is placed in the `src` folder.

The code is structured with an options page, Sidebar (which contains React components for each individual part of the Sidebar), a content scripts folder (for parts of the application that require access to the current webpage), and a background page (for connecting to the Firestore backend and connecting to ElasticSearch).

## Webpack auto-reload and HRM

This application uses webpack auto-reload so whenever you save a file that is not in the content script directory, the app will reload using the webpack development server.

If you want to run the development mode on another port, just specify the env var `port` like this:

```
$ PORT=6002 npm run start
```


## Resources:

- [Webpack documentation](https://webpack.js.org/concepts/)
- [Chrome Extension documentation](https://developer.chrome.com/extensions/getstarted)

---

Thanks, Michael Liu, for setting up this extension! Check him out. | [Website](https://lxieyang.github.io)

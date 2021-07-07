## Overview
The web app is written in the [React](https://reactjs.org/) framework and the [Material UI](https://material-ui.com/) library for styling.


## Getting started
We use npm to manage JavaScript packages, which depends on and distributes with Node.js, 
so the first step is to download and install [Node.js](https://nodejs.org/en/download/).

Then, open a new command line session, navigate to this directory, and install all requirements by:
```
npm install package.json
```

To get the frontend running, simply execute
```
npm start
```

After you see `Server running at http://localhost:1234`, you are ready to go!

To access the user-facing page, go to http://localhost:1234/index.html

To access the recommendation management portal (currently support Chrome only), go to http://localhost:1234/addReco/addReco.html

*Note that to use all features, the backend also needs to be running. See [../backend/README.md](../backend/README.md) for details*


## CORS
Sexy Tofu makes an API call to [GHGI's web API](api.ghgi.org), which requires "cross-origin resource sharing" (CORS). 
Currently, you need to add this [Chrome plugin](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf?hl=en) 
and enable Access-Control-Allow-Origin in order to test the site locally. We are still working on the long-term alternative.
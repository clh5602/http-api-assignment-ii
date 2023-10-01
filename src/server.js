const http = require('http'); // pull in the http server module
const url = require('url'); // pull in the url module
// pull in the query string module
const query = require('querystring');

// pull in the response handler files
const htmlHandler = require('./htmlResponses.js');
// pull in our json response handler file
const requestHandler = require('./dataResponses.js');

// set the port. process.env.PORT and NODE_PORT are for servers like heroku
const port = process.env.PORT || process.env.NODE_PORT || 3000;

// key:value object to look up URL routes to specific functions
const urlStruct = {
  GET: {
    '/getUsers': requestHandler.getUsers,
    '/': htmlHandler.getIndex,
    '/style.css': htmlHandler.getIndexCSS,
    notFound: requestHandler.notFound,
  },
  HEAD: {
    '/getUsers': requestHandler.getUsersMeta,
    notFound: requestHandler.notFoundMeta,
  },
  POST: {
    '/addUser': requestHandler.addUser,
  },
};

const parseBody = (request, response, callback) => {
  const body = [];

  // if an error occurs, handle it
  request.on('error', (err) => {
    console.dir(err);
    response.statusCode = 400;
    response.end();
  });

  // called when receiving a piece of the data.
  // it comes in order, so we just push the data onto the body array.
  request.on('data', (chunk) => {
    body.push(chunk);
  });

  // when the data is complete
  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const bodyParams = query.parse(bodyString);

    callback(request, response, bodyParams);
  });
};

// handle HTTP requests. In node the HTTP server will automatically
// send this function request and pre-filled response objects.
const onRequest = (request, response) => {
  // parse the url using the url module
  const parsedUrl = url.parse(request.url);

  // only support GET, HEAD, and POST
  if (!urlStruct[request.method]) {
    return urlStruct.HEAD.notFound(request, response);
  }

  // if function exists, call it!
  if (urlStruct[request.method][parsedUrl.pathname]) {
    // post is special
    if (request.method === 'POST') {
      return parseBody(request, response, urlStruct[request.method][parsedUrl.pathname]);
    }
    return urlStruct[request.method][parsedUrl.pathname](request, response);
  }

  return urlStruct[request.method].notFound(request, response);
};

// start HTTP server
http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on 127.0.0.1: ${port}`);
});

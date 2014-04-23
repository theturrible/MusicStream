
/**
 * Module dependencies.
 */

var express = require('express.io');
var http = require('http');
var path = require('path');
var util = require(__dirname + '/util.js');

//user DB
var sessionStore     = require('connect-mongo'), // find a working session store (have a look at the readme)
    passportSocketIo = require("passport.socketio");

var app = express();
app.http().io();
// make sure the dbs directory is present
util.mkdir(__dirname + '/dbs', function(){
  // attach the db to the app
  require(__dirname + '/db.js')(app);
  // make sure the cover directory is present
  util.mkdir(__dirname + '/dbs/covers', function(){});
});

app.io.set('authorization', passportSocketIo.authorize({
  cookieParser: express.cookieParser,
  key:         'express.sid',       // the name of the cookie where express/connect stores its session_id
  secret:      'shhh-much-secret',    // the session_secret to parse the cookie
  store:       sessionStore,        // we NEED to use a sessionstore. no memorystore please
  success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
  fail:        onAuthorizeFail,     // *optional* callback on fail/error - read more below
}));

function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');

  // The accept-callback still allows us to decide whether to
  // accept the connection or not.
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept){
  if(error)
    throw new Error(message);
  console.log('failed connection to socket.io:', message);

  // We use this callback to log all of our failed connections.
  accept(null, false);
}


console.log(__dirname);
// all environments
app.set('port', process.env.PORT || 9200);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('swig').renderFile);
//app.use(express.favicon());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret: 'maisecret'}));
app.use(app.router);
app.use('/static', express.static(__dirname + '/static'));

// development only
if ('development' == app.get('env')) {
  // uncomment to nuke songs database
  // app.db.songs.remove({}, { multi: true }, function(err, numRemoved){
  //   console.log(numRemoved + " songs removed");
  // })
  app.use(express.errorHandler());
}

require(__dirname + '/routes').createRoutes(app);

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

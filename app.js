
/**
 * Module dependencies.
 */

var express = require('express.io'),
    http = require('http'),
    session = require('express-session'),
    path = require('path'),
    util = require(__dirname + '/util.js'),
    MongoStore = require('connect-mongo')({ session: session }),
    mongoose = require('mongoose'),
    passportSocketIo = require("passport.socketio"),
    xtend = require('xtend'),
    app = express();
    fs = require('fs');
    var https = require('https');

var options = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
};
var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);


app.https(options).io();


// make sure the dbs directory is present(this is used for playlist and music lib storage.)
util.mkdir(__dirname + '/dbs', function(){
  // attach the db to the app
  require(__dirname + '/db.js')(app);
  // make sure the cover directory is present
  util.mkdir(__dirname + '/dbs/covers', function(){});
});

//connect to the db, on error, notify console. 
mongoose.connect("127.0.0.1:27017");

mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});
//print home dir. p

console.log(__dirname);
// all environments

//set the port to 9200.
app.set('port', process.env.PORT || 9200);
//set paths for the views
app.set('views', path.join(__dirname, 'views'));

//lets just use basic html for the engine
app.set('view engine', 'html');
app.set('authenticated', false);
app.set('userInfo', '');

//swig
app.engine('html', require('swig').renderFile);

app.use(express.favicon());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
//cookies are already here. 
app.use(express.bodyParser());
app.use(app.router);
app.use('/static', express.static(__dirname + '/static'));

//login setup

// Create a new store in memory for the Express sessions




// development only
if ('development' == app.get('env')) {
  // uncomment to nuke songs database
  // app.db.songs.remove({}, { multi: true }, function(err, numRemoved){
  //   console.log(numRemoved + " songs removed");
  // })
  app.use(express.errorHandler());
}


//create routes.
require(__dirname + '/routes').createRoutes(app);
//and finally, start the server. 
/*app.listen(9300, function(){
  console.log('Express server listening on port ' + app.get('port'));
});*/
//create https.
https.createServer(options,app).listen(9200, function(){
  console.log('Express server listening on port ' + app.get('port'));
});

app.listen(9200, "127.0.0.1")



/**
 * Module dependencies.
 */

var express = require('express.io'),
    http = require('http'),
    path = require('path'),
    util = require(__dirname + '/util.js'),
    mongoose = require('mongoose'),
    app = express(),
    fs = require('fs'),
    https = require('https'),
    Datastore = require('nedb');

var options = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
};
var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);
app.https(options).io();
util.mkdir(__dirname + '/dbs', function(){
  util.mkdir(__dirname + '/dbs/covers', function(){});
});

console.log(__dirname);
//connectiong  neDB.
  app.db = {};
  app.db.songs = new Datastore({ filename: __dirname + '/dbs/songs.db', autoload: true });
  app.db.playlists = new Datastore({ filename: __dirname + '/dbs/playlists.db', autoload: true });
//connect to the db, on error, notify console. 
mongoose.connect("127.0.0.1:27017");
mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});
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

app.use(express.json());
app.use(express.urlencoded());

app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(app.router);

app.use('/static', express.static(__dirname + '/static'));


if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


//view controller.
require(__dirname + '/routes').createRoutes(app);

//create https.
https.createServer(options,app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

app.listen(app.get('port'), "127.0.0.1");


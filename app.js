
/**
 * Module dependencies.
 */

var express = require('express.io');
var http = require('http');
var session = require('express-session');
var path = require('path');
var util = require(__dirname + '/util.js');
var MongoStore = require('connect-mongo')({ session: session });
var mongoose = require('mongoose');
var passport = require('passport');
var app = express();
app.http().io();
// make sure the dbs directory is present
util.mkdir(__dirname + '/dbs', function(){
  // attach the db to the app
  require(__dirname + '/db.js')(app);
  // make sure the cover directory is present
  util.mkdir(__dirname + '/dbs/covers', function(){});
});

mongoose.connect("127.0.0.1:27017");
mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});


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

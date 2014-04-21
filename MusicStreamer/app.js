
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();
var exphbs = require('express3-handlebars');	

var hbs = exphbs.create({
    defaultLayout: 'layout',
    //Uses multiple partials dirs, templates in "shared/templates/" are shared
    // with the client-side of the app (see below).
    partialsDir: [
        'views/partials/'
    ]
    
});

// Configuration
 
 
app.configure(function(){
  //app.engine('handlebars', exphbs({defaultLayout: 'main'}));
  app.set('view engine', exphbs({defaultLayout: 'layout.handlebars'}));
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function (req, res) {
    res.render('index.handlebars', {
        title: 'Home'
    });
});





app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var Datastore = require('nedb');

module.exports = function(app){
  app.db = {};
  app.db.songs = new Datastore({ filename: __dirname + '/dbs/songs.db', autoload: true });
  app.db.playlists = new Datastore({ filename: __dirname + '/dbs/playlists.db', autoload: true });
  app.db.users = new Datastore({ filename: __dirname + '/dbs/users.db', autoload: true });
}
var util = require(__dirname + '/../util.js');
var lib_func = require(__dirname + '/../library_functions.js');
var config = require(__dirname + '/../config').config();
var async = require('async');
var AdmZip = require('adm-zip');
var os = require('os');
/*
 * GET home page.
 */

app = null;

exports.createRoutes = function(app_ref){
  app = app_ref;
  app.get('/', musicRoute);
  app.get('/scan', scanRoute);
  app.get('/account', account);
  app.get('/register', register);
  app.get('/login', login);
  app.get('/logout', logout);
  app.get('/songs/:id', sendSong);
  app.get('/cover/:id', sendCover);
  //app.get('/favorite', logout);

  //app.get('/downloadplaylist/:id', downloadPlaylist);
  //login and register controls


  app.io.route('scan_page_connected', function(req){ req.io.join('scanners'); });
  app.io.route('register_new', function(req){ lib_func.registerNewUser(app, req.data); });
  app.io.route('check_login', function(req){ lib_func.checkLogin(app, req.data); });
  app.io.route('logged_in', musicRouteLoggedIn);
  //log
  app.io.route('login_page_connected', function(req){ req.io.join('auth'); });
  app.io.route('register_page_connected', function(req){ req.io.join('auth'); });
  app.io.route('player_page_connected', function(req){ req.io.join('players'); });
  app.io.route('set_comp_name', setCompName);
  app.io.route('start_scan', function(req){ lib_func.scanLibrary(app, false); });
  app.io.route('start_scan_hard', function(req){ lib_func.scanLibrary(app, true); });
  app.io.route('stop_scan', function(req){ lib_func.stopScan(app); });
  app.io.route('fetch_songs', returnSongs);
  app.io.route('fetch_playlists', returnPlaylists);
  app.io.route('create_playlist', createPlaylist);

  app.io.route('delete_playlist', deletePlaylist);
  app.io.route('favorite', favoritePlaylist);

  app.io.route('add_to_playlist', addToPlaylist);
  app.io.route('remove_from_playlist', removeFromPlaylist);
  app.io.route('hard_rescan', rescanItem);
  // remote control routes
  app.io.route('get_receivers', getReceivers);
};

function account(req, res){
  var user = app.locals.settings.userInfo;
  if(user){
    var data = app.locals.settings.userInfo;
    console.log("User found.");
    res.render('account', {
                menu: true,
                dropdown: true, 
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                logins: data.logins,
                plist: data.favePlaylist || "No favorite"

              });
  }else{
    forceLogin(req, res, "You need to logged in to view this page.");
  }    
  
}

function register(req, res){
  res.render('register', {menu: false});
}
function login(req, res){
  if(app.locals.settings.userInfo){
      console.log("GET THE FUCK OUT OF THE LOGIN PAGE.");
      res.render('index', {menu: true});
  }else{
    res.render('login', {menu: false}); 
  }
}

function logout(req, res){
  var data = app.locals.settings.userInfo;
  app.locals.settings.userInfo = "";
  forceLogin(req, res, "I am very sad to see you go, " + data.firstName);
}
  

function forceLogin(req, res, mes){
  res.render('login', {menu: false, message: mes});
}

function musicRoute(req, res){
  if(app.locals.settings.userInfo){
    var user = app.locals.settings.userInfo;
    res.render('index', {menu: true, dropdown: true, firstName: user.firstName});
  }else{
    login(req, res);
  }
  
}

function musicRouteLoggedIn(req, res){
  console.log(app.locals.settings.userInfo);
  }


function sendSong(req, res){
  app.db.songs.findOne({_id: req.params.id}, function(err, song){
    if(err || !song){
      res.status(404).send();
    } else {
      res.sendfile(encodeURIComponent(song.location));
    }
  });
}

function sendCover(req, res){
  app.db.songs.findOne({_id: req.params.id}, function(err, song){
    if(!song || !song.hasOwnProperty("cover_location")){
      res.sendfile("/static/images/unknown.png", {root: __dirname + "/../"});
    } else {
      res.sendfile(song.cover_location);
    }
  });
}

function returnSongs(req){
  app.db.songs.find({}, function(err, docs){
    if(!err){
      req.io.emit('songs', {"songs": docs});
    }
  });
}

function returnPlaylists(req){
  app.db.playlists.find({}, function(err, docs){
    playlists = docs;
    getLibraryIds(function(result){
      playlists.push({
        _id: "LIBRARY",
        title: "Library",
        songs: result,
        editable: false
      });
      req.io.emit('playlists', {"playlists": playlists});
    });
  });
}

function getLibraryIds(callback){
  app.db.songs.find({}, function(err, docs){
    for(var i = 0; i < docs.length; i++){
      docs[i] = {_id: docs[i]["_id"]};
    }
    callback(docs);
  });
}

function createPlaylist(req){
  plist = {
    title: req.data.title,
    songs: req.data.songs,
    editable: true
  };
  app.db.playlists.insert(plist, function(err, doc){
    req.io.route('fetch_playlists');
  });
}

function deletePlaylist(req){
  del = req.data.del;
  app.db.playlists.remove({_id: del}, {}, function(err, numRemoved){
    req.io.route('fetch_playlists');
  });
}

function favoritePlaylist(req){
  //play list id. 
  fav = req.data.fav;
  lib_func.addToFav(app, fav);
}

function addToPlaylist(req){
  addItems = req.data.add;
  to = req.data.playlist;
  app.db.playlists.findOne({ _id: to}, function (err, doc) {
    waitingOn = 0;
    for (var i = 0; i < addItems.length; i++) {
      var found = false;
      for(var j = 0; j < doc.songs.length; j++){
        if(doc.songs[j]._id == addItems[i]){
          found = true;
          break;
        }
      }
      if(!found){
        waitingOn++;
        app.db.playlists.update({_id: to}, { $push:{songs: {_id: addItems[i]}}}, function(){
          if(--waitingOn == 0){
            req.io.route('fetch_playlists');
          }
        });
      }
    }
  });
}

function removeFromPlaylist(req){
  removeItems = req.data.remove;
  to = req.data.playlist;
  app.db.playlists.findOne({ _id: to}, function (err, doc) {
    var tmpSongs = [];
    for(var i = 0; i < doc.songs.length; i++){
      if(removeItems.indexOf(doc.songs[i]._id) == -1){
        tmpSongs.push(doc.songs[i]);
      }
    }
    app.db.playlists.update({_id: to}, { $set:{songs: tmpSongs}}, function(){
      req.io.route('fetch_playlists');
    });
  });
}

function rescanItem(req){
  items = req.data.items;
  app.db.songs.find({ _id: { $in: items }}, function(err, songs){
    if(!err && songs)
      var songLocArr = [];
      for (var i = 0; i < songs.length; i++) {
        songLocArr.push(songs[i].location);
      };
      lib_func.scanItems(app, songLocArr);
  });
}

function scanRoute(req, res){
  util.walk(config.music_dir, function(err, list){
    if(err){
      console.log(err);
    }

    res.render('scan', {
      dir: config.music_dir,
      num_items: list.length,
      menu: true
    });
  });
}

function setCompName(req){
  req.io.join('receivers');
  req.socket.set('name', req.data.name);
}

function getReceivers(req){
  var receivers = app.io.sockets.clients('receivers');
  var validReceivers = [];
  receivers.forEach(function(client){
    if(client.store.data.name && client.store.data.name.length > 0){
      validReceivers.push({
        id: client.id,
        name: client.store.data.name
      });
    }
  });
  req.io.emit('recievers', {"recievers": validReceivers});
}
var fs = require('fs');
var mm = require('musicmetadata');
var taglib = require('taglib');
var md5 = require('MD5');

var util = require(__dirname + '/util.js');
var config = require(__dirname + '/config').config();
var User = require('./models/User');

var running = false;
var hard_rescan = false;
var app = null;
var cnt = 0;
var song_list = [];





function findNextSong(){
  if(cnt < song_list.length && running){
    findSong(song_list[cnt], function(err){
      if(err){
        console.log({error: err, file: song_list[cnt]});
      }
      cnt++;
      setTimeout(findNextSong, 0);
    });
  } else {
    console.log("finished!");
    broadcast("update", {count: song_list.length, completed: song_list.length, details: "Finished"});
    // reset for next scan
    cnt = 0;
    song_list = [];
    running = false;
  }
}

function findSong(item, callback){ 
  app.db.songs.findOne({location: item}, function(err, doc){
    // only scan if we haven't scanned before, or we are scanning every document again
    if(doc == null || hard_rescan){
      // insert the new song
      var parser = new mm(fs.createReadStream(item));

      parser.on('metadata', function(result){
        // add the location
        var song = {
          title: result.title,
          album: result.album,
          artist: result.artist,
          albumartist: result.albumartist,
          display_artist: normaliseArtist(result.albumartist, result.artist),
          genre: result.genre,
          year: result.year,
          duration: result.duration,
          location: item
        };
        // write the cover photo as an md5 string
        if(result.picture.length > 0){
          pic = result.picture[0];
          pic["format"] = pic["format"].replace(/[^a-z0-9]/gi, '_').toLowerCase();
          filename = __dirname + '/dbs/covers/' + md5(pic['data']) + "." + pic["format"];
          song.cover_location = filename;
          fs.exists(filename, function(exists){
            if(!exists){
              fs.writeFile(filename, pic['data'], function(err){
                if(err) console.log(err);
                console.log("Wrote file!");
                console.log("Added pic to song", song.title);
              });
            }
          })
        }
        if(doc == null){
          // insert the song
          app.db.songs.insert(song, function (err, newDoc){
            taglib_fetch(item, newDoc._id);
            // update the browser the song has been added
            console.log("Added to db: ", song.title);
            broadcast("update", {
              count: song_list.length,
              completed: cnt,
              details: "Added: " + newDoc["title"] + " - " + newDoc["albumartist"]
            });
          });
        } else if (hard_rescan){
          app.db.songs.update({location: item}, song, {}, function(err, numRplaced){
            taglib_fetch(item, doc._id);
            broadcast("update", {
              count: song_list.length,
              completed: cnt,
              details: "Updated: " + song["title"] + " - " + song["artist"]
            });
          })
        }
      });

      parser.on('done', function (err) {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    } else {
      broadcast("update", {
        count: song_list.length,
        completed: cnt,
        details: "Already scanned item: " + item
      });
      // perform rescan? hard rescan option?
      callback(null);
    }
  })
}

function normaliseArtist(albumartist, artist){
  if(typeof(albumartist) != 'string'){
    if(albumartist.length == 0){
      albumartist = '';
    } else {
      albumartist = albumartist.join('/');
    }
  }
  if(typeof(artist) != 'string'){
    if(artist.length == 0){
      artist = '';
    } else {
      artist = artist.join('/');
    }
  }
  return (artist.length > albumartist.length) ? artist : albumartist;
}

function taglib_fetch(path, id){
  // use taglib to fetch duration
  taglib.read(path, function(err, tag, audioProperties) {
    app.db.songs.update({ _id: id }, { $set: { duration: audioProperties.length} });
  });
}

// clear all the songs with `location` not in the dbs
function clearNotIn(list){
  app.db.songs.remove({location: { $nin: list }}, {multi: true}, function(err, numRemoved){
    console.log(numRemoved + " tracks deleted");
  });
}

//USER REGISTRATION

exports.registerNewUser = function(app_ref, user_data){
  app = app_ref;

  //basic user shit
  console.log("registering new user.");
  console.log(user_data);
  var user = new User({
    email: user_data.email,
    firstName: user_data.firstName,
    lastName: user_data.lastName, 
    password: user_data.password, 
    favePlaylist: '', 
    logins: 0
  });

  user.save(function(err) {
  if (err) {
    console.log(err);
    if (err.code === 11000) {
      var error = "Your account already exists."
      console.log("notifying");
      app.io.broadcast("reg_suc", error);
    }
    console.log("success");
  }
  });
  //need to implement check if user already exists... 
  console.log("User Object: " ,user);
  app.io.broadcast("reg_suc", user.email);
}


exports.checkLogin = function(app_ref, req){
 passport.authenticate('local', function(err, req.user, info) {
    if (err) return next(err);
    if (!user) {
      req.flash('errors', { msg: info.message });
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

}

exports.scanItems = function(app_ref, locations){
  app = app_ref;
  hard_rescan = true;
  running = true;
  song_list = song_list.concat(locations);
  findNextSong();
}

exports.scanLibrary = function(app_ref, hard){
  app = app_ref;
  hard_rescan = hard;
  util.walk(config.music_dir, function(err, list){
    if(err){
      console.log(err);
    }

    clearNotIn(list);
    song_list = list;
    findNextSong();

  });
  running = true;
}

exports.stopScan = function(app){
  running = false;
}



function broadcast(id, message){
  app.io.room('scanners').broadcast(id, message);
}
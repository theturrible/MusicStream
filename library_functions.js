var fs = require('fs');
var mm = require('musicmetadata');
var taglib = require('taglib');
var md5 = require('MD5');
var util = require(__dirname + '/util.js');
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
    console.log("Found all songs.!");
    broadcast("update", {count: song_list.length, completed: song_list.length, details: "Finished"});
    //cleanup.
    cnt = 0;
    song_list = [];
    running = false;
  }
}

function findSong(item, callback){ 
  app.db.songs.findOne({location: item}, function(err, doc){
    if(doc == null || hard_rescan){ 
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

        if(doc == null){
          //data base insertions
          app.db.songs.insert(song, function (err, newDoc){
            console.log(song.duration);
              taglib.read(item, function(err, tag, audioProperties) {
                 app.db.songs.update({ _id: newDoc._id }, { $set: { duration: audioProperties.length} });
             });
            console.log(song.duration);
            console.log("Added to neDB: ", song.title);
            broadcast("update", {
              count: song_list.length,
              completed: cnt,
              details: "Added: " + newDoc["title"] + " - " + newDoc["albumartist"]
            });
          });
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

  user.save(function(err, new_user) {
  if (err) {
    console.log(err);
    if (err.code === 11000) {
      var error = "Your account already exists."
      console.log("notifying");
      app.io.broadcast("registration_fail", error);
    }
  }else{
     console.log("User Object: ", new_user);
     app.locals.settings.userInfo = new_user;
     app.io.broadcast("registration_success", new_user.email);
  }
  });
}

//checks if the login is correct.
exports.checkLogin = function(app_ref, user_data){
  app = app_ref;
  console.log(app.udserInfo);
  //console.log(app);
    
   User.findOne({ email: user_data.email }, function(err, user){
     if(!user){
      var error = "You are not a member, click the button below!"
      console.log("user not found.");
      app.io.broadcast("authentication_failed", error);
    }else{
        user.comparePassword(user_data.password, function(err, isMatch) {
            if(isMatch) { 
              var numOfLogins = user.logins + 1;
              var edit = { logins: numOfLogins },
                  options =  { multi: false }, 
                  condition = { email: user.email};
              //attack to req.
              //Model.update(conditions, update, options, callback);
              //incrementing count
              console.log("Incrementing count;");
              User.update(condition, edit, options, function callback (err, numAffected) {
                if(err){console.log("Oops, error!");};
                if(numAffected){console.log(numAffected);};

              });
              app.locals.settings.userInfo = user;
              console.log("User ", user.firstName, " has succesfully logged in.");
              //incremented logins..
              user.logins++;
              app.io.broadcast("authentication_success");
            }else {
              console.log("User is bad.");
               var error ="Password is incorrect";
              app.io.broadcast("authentication_failed", error);

            }
      console.log("user found")
      });
    }
  });
}

exports.addToFav= function(app_ref, ID){
  
  var edit = { favePlaylist: ID },
      options =  { multi: false }, 
      condition = { email: app.locals.settings.userInfo.email};
  console.log("adding favorite playlist");
  User.update(condition, edit, options, function callback (err, numAffected) {
    if(err){console.log("Oops, error!");};
    if(numAffected){console.log(numAffected);};
  });
  User.findOne({ email: app.locals.settings.userInfo.email }, function(err, user){ app.locals.settings.userInfo = user});
  app.io.broadcast("favorite_added");
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
  var path = __dirname + "/mp3/";
  util.readDir("/Users/theturrible/Dropbox/School/506/mp3/", function(err, list){
    if(err){
      console.log(err);
    }
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
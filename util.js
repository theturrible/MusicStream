var fs = require('fs');
var readDir = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          console.log("no directories please.");
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}
exports.readDir = readDir;
var mkdir = function(dir, done) {
  fs.exists(dir, function(exists){
    if(!exists){
      fs.mkdir(dir, '0777', function(){
        done();
      });
    } else {
      done();
    }
  });
}
exports.mkdir = mkdir;
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var userSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true },
  password: String,
  firstName: String, 
  lastName: String, 
  favePlaylist: String, 
  logins: Number


});

/**
 * Hash the password for security.
 * "Pre" is a Mongoose middleware that executes before each user.save() call.
 */

userSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(5, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', userSchema);

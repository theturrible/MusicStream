
//some stupid font shit

// soccet connection and events

var socket = io.connect('http://'+window.location.hostname+':9200');
socket.on('connect', function(){
  socket.emit('login_page_connected');
  console.log("Login Page connected");
});
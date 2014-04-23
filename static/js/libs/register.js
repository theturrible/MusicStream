// soccet connection and events
var socket = io.connect('http://'+window.location.hostname+':9200');
socket.on('connect', function(){
  socket.emit('login_page_connected');
  console.log("Login Page connected");
});

$("#register_user").click(function(){
  plist ={
    first = form.first_name.value;
    last = form.last_name.value;
    username = form.user_name.value;
    password = form.password.value;
    editable: true;
  }
  app.db.users.insert(plist, function(err,doc)
        console.log('success');
}

$("#start_scan").click(function(){
	console.log("inside this method");


	}
});
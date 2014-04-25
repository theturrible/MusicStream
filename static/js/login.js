// soccet connection and events
var socket = io.connect('https://'+window.location.hostname+':9200', {secure: true, port:9200});
socket.on('login_page_connected', function(){
  socket.emit('login_page_connected');
  console.log("Login Page connected");
});

socket.on('authentication_failed', function(data){
	 console.log('authentication_failed', data);	
	 $(".errormessage").css('display','inline');
	 $('#error').text(data);
	 
});

socket.on('authentication_success', function(){
	 console.log('authentication_success');	
	 socket.emit('logged_in');
	 location.href = '/account';
});


$("#login").click(function(){
	console.log("check_login emit.");
	var mail = document.getElementById("email").value;
	var pass = document.getElementById("password").value;
	console.log( mail, pass);
    socket.emit('check_login', {email: mail, password: pass });
});
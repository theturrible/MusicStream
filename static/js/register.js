// soccet connection and events
var socket = io.connect('http://'+window.location.hostname+':9200');
socket.on('login_page_connected', function(){
  socket.emit('login_page_connected');
  console.log("Login Page connected");
});
socket.on('reg_suc', function(data){
  console.log('reg_suc', data);	

  $(".login-container").css('display','none');
  $(".success-container").css('display','block');
  $("#message").text(data);
});

$("#register").click(function(){
	var fname = document.getElementById("firstName").value;
	var lname = document.getElementById("lastName").value;
	var mail = document.getElementById("email").value;
	var pass = document.getElementById("password").value;
	console.log(fname, lname, mail, pass);
	//possible encyption here. 
    socket.emit('register_new', {firstName: fname, lastName: lname, email: mail, password: pass });
    
});
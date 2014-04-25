// soccet connection and events
var socket = io.connect('https://'+window.location.hostname+':9200');
socket.on('register_page_connected', function(){
  socket.emit('register_page_connected');
  console.log("Register Page connected");
});
socket.on('registration_success', function(data){
  console.log('registration_success', data);	
  location.href = '/account';
});
socket.on('registration_fail', function(data){
   console.log('registration_failed', data); 
   $(".errormessage").css('display','inline');
   $('#error').text(data);
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
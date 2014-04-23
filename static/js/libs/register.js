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
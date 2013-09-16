var auth = require('./auth.js');

$(document).ready(function() {
    auth.getUserName(function(err, username) {
	if( !err && username ) { 
	    window.location.href = '/pics.html';
	} else {
	    $('#loginbtn').click(function() {
		var username = $('#inputUserName').val();
		var password = $('#inputPassword').val();
		auth.login(username, password, function(err) {
		    if( err )
			alert('Invalid password');
		    else
			window.location.href = '/pics.html';
		});
	    });
	}
    });
});

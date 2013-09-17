var api = require('./api.js');

$(document).ready(function() {
    function gup( name )
    {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if( results == null )
	    return "";
	else
	    return results[1];
    }
    var params = [ 'cameraid', 'year', 'month', 'day', 
	           'hour', 'minute', 'second', 'micros' ];

    var query = {};
    var title = '';
    for( var pi = 0 ; pi < params.length; pi++ ) {
	var arg = gup(params[pi]);
	if( arg ) {
	    query[params[pi]] = arg;
	    
	    switch(params[pi]) {
	    case 'cameraid': title += arg; break;
	    case 'year': title += ' 20' + arg; break;
	    case 'month': title += '-' + arg; break;
	    case 'day': title += '-' + arg; break; 
	    case 'hour': title += ' at ' + arg; break;
	    case 'minute': title += ':' + arg; break;
	    case 'second': title += ':' + arg; break;
	    };
        }
    }
    
    if( title )
        $('.navbar-nav li p').text('Camera ' + title);

    api.getPics(query, function(err, pics) {
	if( err )
	    return;
	
	var counter = 0;
	for( var di = 0; di < pics.length; di++ ) {
	    var pic = pics[di];
	    if( pic.group ) {
                var nexturl = '/pics.html?';
	        for( var ci in pic.next )
	            nexturl += ci + '=' + pic.next[ci] + '&';
	        $('#pics .row:last').append(
		    '<div class="col-md-4 col-sm-6 col-xs-12">' + 
		    '  <a href="' + nexturl + '">' +
		    '    <h5>' + pic.titlestr + '</h5>' + 
		    '    <img src="' + pic.newest + '" ' + 
		    '         class="img-thumbnail" width=200 />' + 
		    '    <p>' + pic.count + ' pictures' +
		    '</p></a></div>'
		);
            } else {
	        $('#pics .row:last').append(
		    '<div class="col-md-4 col-sm-6 col-xs-12">' + 
		    '  <a href="' + pic.file + '">' +
		    '    <img src="' + pic.file + '" ' + 
		    '         class="img-thumbnail" width=200 />' + 
		    '    <p>' + pic.timestamp + 
		    '</p></a></div>'
		);
	    }
	}
    });
});

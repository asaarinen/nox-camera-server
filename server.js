
var express = require('express');
var path = require('path');
var async = require('async');
var childp = require('child_process');
var fs = require('fs');

function log(str) {
    var d = new Date();
    process.stderr.write(d.toISOString() + ' ' + str + '\n');
}

var domain = process.argv[2];
var port = 8080;

var twclient = null;
if( typeof domain == 'string' &&
    process.env['twilioaccountsid'] &&
    process.env['twilioauthtoken'] &&
    process.env.twiliofrom &&
    process.env.twilioto ) {
	twclient = require('twilio')(process.env['twilioaccountsid'],
				     process.env['twilioauthtoken']);
    log('using twilio');
}

log('creating nox app');
var noxapp = require('nox-app-template')('nox-camera-server', 
					 function(mod) { return require(mod); }, log);

noxapp.expressServer.use(function(req, res, next) {
    if( req.session.username ||
	( req.method == 'POST' && ( req.url.match(/^\/motion\//) ||
				    req.url.match(/^\/timer\//) ) ) ||
	( req.method == 'GET' && ( req.url == '/login.html' ||
				   req.url.match(/^\/css\//) ||
				   req.url.match(/^\/js\//) ||
				   req.url.match(/^\/fonts\//) ||
				   req.url.match(/^\/ico\//) ) ) )
	next();
    else
	res.redirect('/login.html');
});

noxapp.noxApp.page('/login.html', [ './lib/auth.js' ], [ './lib/login.js' ]);
noxapp.noxApp.page('/pics.html', [ './lib/auth.js', './lib/api.js' ], [ './lib/pics.js' ]);

noxapp.expressServer.get(/\/pics\//, function(req, res) {
    var path = 'images/' + req.url.substring(6);
    fs.exists(path, function(exists) {
	if( exists ) {
	    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
	    fs.createReadStream(path).pipe(res);
	} else {
	    res.writeHead(404);
	    res.end();
	}
    });
});

var lastnotification = -1;

noxapp.expressServer.post('/motion/:cameraid', function(req, res) {
    postImage(req, res, true);
});

noxapp.expressServer.post('/timer/:cameraid', function(req, res) {
    postImage(req, res, false);
});

function postImage(req, res, motion) {

    var disposition = req.headers['content-disposition'];
    log('posting image ' + disposition);

    var m = disposition.match(/attachment; filename="([^"]+)"/)[1];

    if( m.match(/^([0-9]{2})-([0-9]{2})-([0-9]{2})_([0-9]{2})-([0-9]{2})-([0-9]{2})-([0-9]{2})$/) ) {
	log('non-prefixed disposition: ' + m);
	m = 'image' + m + '.jpg';
    } else if( !m.match(/\.jpg$/) ) {
	log('weird disposition: ' + m);
	m = m + '.jpg';
    }

    var dir1 = req.params.cameraid;
    var dir2 =  (motion ? 'motion' : 'timer')
    var path = 'images/' + dir1 + '/' + dir2 + '/' + m;
	
    async.waterfall([
	function(wfcb) {
	    fs.mkdir('images/' + dir1, function(err) { wfcb(); })
	},
	function(wfcb) {
	    fs.mkdir('images/' + dir1 + '/' + dir2,
		     function(err) { wfcb(); });
	},
	function(wfcb) {
	    log('writing to ' + path);
	    var fout = fs.createWriteStream(path);
	    req.pipe(fout);
	    fout.on('close', function(err) {
		wfcb(err);
	    });
	}
    ], function(err) {
	if( err ) {
	    log('error processing request');
	    res.writeHead(500);
	    res.end();
	} else {
	    log('successful upload');
	    res.writeHead(200);
	    res.end();

	    if( motion ) {	    // notify

		var now = new Date();
		now = now.getTime();
		if( lastnotification == -1 || 
		    now - lastnotification > 60 * 60 * 1000 ) {
		    
		    lastnotification = now;
		    
		    var notify = 'Alert: http://' + domain + ':' + port + 
			'/pics/' + path.substring(7);
		    log('notification: ' + notify);
		    
		    if( twclient ) {
			twclient.sendSms({
			    to: process.env.twilioto, 
			    from: process.env.twiliofrom,
			    body: notify
			}, function(err, response) {
			    if( err )
				log('error sending message: ' + 
				    JSON.stringify(err));
			    else
				log('twilio success response');
			});
		    }
		}
	    }
	}
    });
}

noxapp.expressServer.use(express.static('html'));

noxapp.expressServer.use(function(req, res, next) {
    // not found
    res.redirect('/pics.html');
});

var api = require('./lib/api.js');

async.waterfall([
    function(wfcb) { fs.mkdir('images', function(err) { wfcb(); }) },
    function(wfcb) {
	if( typeof process.argv[3] == 'string' )
	    if( process.argv[3].match(/^[0-9]+$/) )
		port = parseInt(process.argv[3]);
	
	log('starting server at port ' + port);
	var serverinst = noxapp.httpServer.listen(port);

	var cleaner = setInterval(api.clean, 24 * 60 * 60 * 1000);
	
	process.on('SIGINT', function() {
	    log('stopping server gracefully');
	    serverinst.close();
	    log('stopping interval timer');
	    clearInterval(cleaner);
	    process.on('exit', function() {
		log('server stopped gracefully');
	    });
	});
	wfcb();
    }
], function(err) {
    if( err ) {
	log('error starting server: ' + err);
	process.exit(1);
    } else
	log('listening at ' + port);
});

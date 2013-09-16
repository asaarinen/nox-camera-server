var domain = require('domain');
var log = require('./log.js');

exports.login = function(name, password, callback) {
    log('Aauthenticating ' + name + ':' + password);
    if( domain.active.httpSession.username )
	callback('already logged in');
    else {
	log('correct passwd: ' + process.env['cameraserverusername'] + ' ' + process.env['cameraserverpasswd']);
	if( name == process.env['cameraserverusername'] &&
	    password == process.env['cameraserverpasswd'] ) {
	    // domain.active.httpSession is just a copy, so we have to
	    // modify the original in the session store
	    domain.active.httpSessionStore.modify(function(sess, cb) {
		sess.username = name;
		cb();
	    }, callback);
	} else
	    callback('invalid password');
    }
}

exports.logout = function(callback) {
    domain.active.httpSessionStore.modify(function(sess, cb) {
	delete sess.username;
	cb();
    }, callback);
}

exports.getUserName = function(callback) {
    callback(null, domain.active.httpSession.username);
}


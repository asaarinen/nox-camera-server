var fs = require('fs');
var async = require('async');
var log = require('./log.js');

var fullre = /^[^\/]+\/([^\/]+)\/([^\/]+)\/image([0-9]{2})-([0-9]{2})-([0-9]{2})_([0-9]{2})-([0-9]{2})-([0-9]{2})-([0-9]{2}).jpg$/;

function parseFile(file) {
    var m = file.match(fullre);
    if( m ) {
	return {
	    group: false,
	    file: '/pics/' + file.substring(7),
	    timestamp: '20' + m[3] + '-' + m[4] + '-' + m[5] + ' ' + 
		m[6] + ':' + m[7] + ':' + m[8] + '.' + m[9],
	    cameraid: m[1],
	    type: m[2],
	    year: m[3],
	    month: m[4],
	    day: m[5],
	    hour: m[6],
	    minute: m[7],
	    second: m[8],
	    micros: m[9]
	}
    } else 
	return null;
}

function comparePics(p1, p2) {
    if( p1.year == p2.year ) {
	if( p1.month == p2.month) {
	    if( p1.day == p2.day ) {
		if( p1.hour == p2.hour ) {
		    if( p1.minute == p2.minute ) {
			if( p1.second == p2.second )
			    return p1.micros - p2.micros;
			else
			    return p1.second - p2.second;
		    } else
			return p1.minute - p2.minute;
		} else
		    return p1.hour - p2.hour;
	    } else
		return p1.day - p2.day;
	} else
	    return p1.month - p2.month;
    } else
	return p1.year - p2.year;
}

function getAllPics(callback) {
    var res = [];
    async.waterfall([
	function(wfcb) {
	    fs.readdir('images/', wfcb);
	},
	function(files, wfcb) {
	    async.eachSeries(files, function(file, filecb) {
		getCamPics(file, function(err, picfiles) {
		    log(picfiles.length + ' images at ' + file);
		    if( picfiles )
			res = res.concat(picfiles);
		    filecb(err);
		});
	    }, wfcb);
	}
    ], function(err) {
	callback(err, res);
    });
}

function getCamPics(cameraid, callback) {
    var res = [];
    async.waterfall([
	function(wfcb) {
	    fs.readdir('images/' + cameraid + '/motion/', wfcb);
	}, 
	function(files, wfcb) {
	    for( var fi = 0; fi < files.length; fi++ ) {
		var p = parseFile('images/' + cameraid + '/motion/' + files[fi]);
		if( p )
		    res.push(p);
	    }
	    
	    fs.readdir('images/' + cameraid + '/timer/', wfcb);
	},
	function(files, wfcb) {
	    for( var fi = 0; fi < files.length; fi++ ) {
		var p = parseFile('images/' + cameraid + '/timer/' + files[fi]);
		if( p )
		    res.push(p);
	    }
	    wfcb();
	}
    ], function(err) {
	callback(null, res);
    });
}


function filterPics(crit, files) {
    log('filtering ' + files.length + ' images by ' + JSON.stringify(crit));
    var res = [];
    for( var fi = 0; fi < files.length; fi++ ) {
	if( ( crit.cameraid && files[fi].cameraid != crit.cameraid ) ||
	    ( crit.type && files[fi].type != crit.type ) ||
	    ( crit.year && files[fi].year != crit.year ) ||
	    ( crit.month && files[fi].month != crit.month ) ||
	    ( crit.day && files[fi].day != crit.day ) ||
	    ( crit.hour && files[fi].hour != crit.hour ) ||
	    ( crit.minute && files[fi].minute != crit.minute ) ||
	    ( crit.second && files[fi].second != crit.second ) ||
	    ( crit.micros && files[fi].micros != crit.micros ) )
	    continue;
	res.push(files[fi]);
    }
    return res;
}

function groupPics(crit, files) {
    var groups = {};
    for( var fi = 0; fi < files.length; fi++ ) {
	var hash = files[fi][crit];
	if( !groups[hash] )
	    groups[hash] = [];
	groups[hash].push(files[fi]);
    }
    var groupa = [];
    for( var hash in groups ) {
	groups[hash].sort(function(e1, e2) {
	    return comparePics(e1, e2);
	});
	groups[hash].reverse();
	groupa.push({
	    group: true,
	    count: groups[hash].length,
	    newest: groups[hash][0].file,
	    timestamp: groups[hash][0].timestamp,
	    title: groups[hash][0][crit],
	    titlestr: maketitle(groups[hash][0], crit),
	    hash: crit
	});
    }
    groupa.sort(function(e1, e2) {
	return e1.title - e2.title;
    });
    return groupa;
}

function maketitle(parsed, lastcrit) {
    var res = parsed.cameraid;
    if( lastcrit == 'cameraid' )
	return res;
    res += ' 20' + parsed.year;
    if( lastcrit == 'year' )
	return res;
    res += '-' + parsed.month;
    if( lastcrit == 'month' )
	return res;
    res += '-' + parsed.day;
    if( lastcrit == 'day' )
	return res;
    res += ' klo ' + parsed.hour;
    if( lastcrit == 'hour' )
	return res;
    res += ':' + parsed.minute;
    if( lastcrit == 'minute' )
	return res;
    res += ':' + parsed.second;
    return res;
}

exports.getPics = function(query, callback) {
    getAllPics(function(err, files) {
	if( err )
	    callback(err);
	else 
	    processPics(query, files, callback);
    });
}

function processPics(query, files, callback) {

    var origfiles = files;

    files = filterPics(query, files);

    var forwardable = true;
    if( !query.cameraid ) {
	files = groupPics('cameraid', files);
	for( var fi = 0; fi < files.length; fi++ )
	    files[fi].next = { cameraid: files[fi].title };
    } else if( !query.year ) {
	files = groupPics('year', files);
	for( var fi = 0; fi < files.length; fi++ )
	    files[fi].next = { cameraid: query.cameraid, 
			       year: files[fi].title };
    } else if( !query.month ) {
	files = groupPics('month', files);
	for( var fi = 0; fi < files.length; fi++ )
	    files[fi].next = { cameraid: query.cameraid, 
			       year: query.year,
			       month: files[fi].title };
    } else if( !query.day ) {
	files = groupPics('day', files);
	for( var fi = 0; fi < files.length; fi++ )
	    files[fi].next = { cameraid: query.cameraid, 
			       year: query.year,
			       month: query.month,
			       day: files[fi].title };
    } else if( !query.hour ) {
	files = groupPics('hour', files);
	for( var fi = 0; fi < files.length; fi++ )
	    files[fi].next = { cameraid: query.cameraid, 
			       year: query.year,
			       month: query.month,
				       day: query.day,
			       hour: files[fi].title };
    } else if( !query.minute ) {
		files = groupPics('minute', files);
	for( var fi = 0; fi < files.length; fi++ )
	    files[fi].next = { cameraid: query.cameraid, 
			       year: query.year,
			       month: query.month,
			       day: query.day,
			       hour: query.hour,
			       minute: files[fi].title };
    } else
	forwardable = false;
    
    if( files.length == 1 && forwardable ) {
	query[files[0].hash] = files[0].title;
	processPics(query, origfiles, callback);
    } else
	callback(null, files);
}

exports.clean = function() {
    getAllPics(function(err, files) {
	if( err )
	    log('error cleaning files: ' + err);
	else if( files.length > 0 ) {
	    files.sort(comparePics);
	    var clean = [];
	    var newest = files[files.length-1];
	    var newestday = parseInt(newest.year, 10) * 12 * 30 + 
		parseInt(newest.month, 10) * 30 + parseInt(newest.day, 10);
	    log('newest day ' + newestday);
	    for( var fi = 0; fi < files.length; fi++ ) {
		var curday = parseInt(files[fi].year, 10) * 12 * 30 +
		    parseInt(files[fi].month, 10) * 30 + 
		    parseInt(files[fi].day, 10);
		if( curday < newestday - 30 ) // this and previous month
		    clean.push('images/' + files[fi].file.substring(6));
	    }
	    var counter = 0, ecounter = 0;
	    async.eachSeries(clean, function(cleanfile, cleancb) {
		fs.unlink(cleanfile, function(err) {
		    if( err ) {
			ecounter++;
			log('error deleting ' + cleanfile);
		    } else
			counter++;
		    cleancb();
		});
	    }, function() {
		log('deleted ' + counter + ' old images, with ' + ecounter + 
		    'errors');
	    });
	} else
	    log('no files to clean');
    });
}




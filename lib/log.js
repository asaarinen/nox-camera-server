module.exports = function(str) {
    var d = new Date();
    process.stderr.write(d.toISOString() + ' ' + str + '\n');
}

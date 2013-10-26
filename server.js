// Simply serve the www directory on localhost:8000

var connect = require('connect');

connect.createServer(
  connect.static(__dirname+"/www")
).listen(8000);

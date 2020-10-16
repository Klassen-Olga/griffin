let express = require('express');
let app = express();
let http = require("http").createServer(app);
const bodyParser = require('body-parser');

app.use(express.static('public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
let Router = require('./core/router');
let router = new Router(app);
router.setRoutes();

let io = require('socket.io')(http);
const {v4: uuidv4} = require('uuid');

let uuid = uuidv4();
router.updateRoutes(uuid);

let SocketHandler = require('./core/socket');
let socketHandler = new SocketHandler(io);

socketHandler.initEventsKurento();


http.listen(3000, '127.0.0.1', function () {
	console.log(
		'\nApp listening at http://localhost:3000/room/a76f6b90-bea8-41b9-82fc-dcd32a8dcf54/4' +
		'\nApp listening at http://localhost:3000/kurentoManyToMany' +
		'\nApp listening at http://localhost:3000/videoChat');
});

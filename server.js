// require express
var express = require("express");
// path module -- try to figure out where and why we use this
var path = require("path");
// create the express app
var app = express();

var session = require('express-session');

app.use(session({secret: 'codingdojorocks'}));  // string for encryption

var server = app.listen(8000, function(){
	console.log("listen from server variable on port 8000");
});

var io = require('socket.io').listen(server);

// static content
app.use(express.static(path.join(__dirname, "./static")));
// setting up ejs and our views folder
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
// root route to render the index.ejs view
app.get('/', function(req, res) {
	res.render("index", {title: "Group Chat"});
});

// storing all current users in object with key as socket.id
var users = {};
// storing  each message as object in an array
var messages = [];

// initiating a sockets connection
io.sockets.on('connection', function (socket) {
	console.log("WE ARE USING SOCKETS!");
	console.log(socket.id);
	
	// listening for client event of loading page for the first time
	socket.on("loading_page", function(data){
		if (!data.name){
			// if input was empty emit action
			socket.emit("empty_name", {success: false});
		} else {
			console.log("before adding new user - ", users);
			users[socket.id] = data.name;

			// add message about user entering the room
			messages.push({name: users[socket.id], message: " entered the room!"});
			console.log("all messages", messages);

			// emit to all current users updated mesages
			io.emit("all_messages_updates", {msg: messages});

			// emit to all current users the list of all users
			io.emit("all_users_updates", {all_users: users});
			console.log("after adding new ", users);
		}
	});

	// listening for sending_message emit from client
	socket.on("sending_message", function(data){
		console.log("message was ", data.msg)
		messages.push({name: users[socket.id], message: data.msg});

		// send this updates to everyone with updated messages
		io.emit("all_messages_updates", {msg: messages});
	});
	

	socket.on('disconnect', function () {
		if(users[socket.id]){
			console.log("disconnecting!" + users[socket.id]);
			// adding a message that user left the room
			messages.push({name: users[socket.id], message:" has left the room!"});
			// deleting a user from the room
			delete users[socket.id];
			// emit to all current users updated mesages
			socket.broadcast.emit("all_messages_updates", {msg: messages});

			// emit to all current users the list of all users
			socket.broadcast.emit("all_users_updates", {all_users: users});
			console.log("after disconnecting ",users);
		}
	});

});


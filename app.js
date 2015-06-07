var express = require('express');
var app = express();
//var http = require('http');
//var server = http.Server(app);
var server = require('http').createServer(app);
var formidable = require('formidable');
var util = require('util');
var fs   = require('fs-extra');
var path = require('path');
var qt   = require('quickthumb');
var mongo = require('mongodb').MongoClient;
// var favicon = require('serve-favicon');
//server.listen(8080);
//app.http().io();

//var io = require('socket.io').listen(app.listen(port));
//var client = io.sockets;
//var client = app.io.sockets;
var client = require('socket.io')(server);
var port = process.env.PORT || 3000;

//app.listen(port);
server.listen(port, function() {
    console.log('Server listening at port %d', port);
});

app.use(express.favicon(__dirname + 'public/images/favicon.ico'));
app.use(express.static(__dirname + '/public'));
/* Use quickthumb */
app.use(qt.static(__dirname + "/"));

app.post('/upload', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
//        res.writeHead(200, {'content-type': 'text/plain'});
//        res.write('received upload:\n\n');
//        res.end(util.inspect({fields: fields, files: files}));
        res.redirect('/');
    });

    form.on('end', function(fields, files) {
        /* Temporary location of our uploaded file */
        var temp_path = this.openedFiles[0].path;
        /* The file name of the uplaoded file */
        var filename = this.openedFiles[0].name;
        /* Location where we want to copy the uploaded file */
        var new_location = 'uploads/';

        fs.copy(temp_path, new_location + filename, function(err) {
            if(err) {
                console.error(err);
            }
            else {
                console.log("Successfully stored image");
            }
        });
    });
});

///* Show the upload form */
//app.get('/', function(req, res) {
//
//    /* var form = '<form action="/upload" enctype="multipart/form-data" method="post">Add a title: \
//                <input name="title" type="text" /><br><br>\
//                <input multiple="multiple" name="upload" type="file" /><br><br>\
//                <input type="submit" value="Upload" /></form>'; */
//
//
//    res.writeHead(200, {'Content-Type': 'text/html' });
//    fs.createReadStream('./public/index.html').pipe(res);
//
//});

mongo.connect('mongodb://localhost/chat', function(err, db) {
    if(err) throw err;
    console.log('Successfully connected to mongo');

    client.on('connection', function(socket) {
        console.log('Someone has connected.');

        // Switch to messages mongo collection
        var msgCollection = db.collection('messages');

        function sendStatus(s) {
            socket.emit('status', s);
        };

        // Emit all messages on initial log in
        msgCollection.find().limit(100).sort({_id: 1}).toArray(function(err, res) {
            if(err) throw err;
            socket.emit('output', res);
        });

        // Wait for input
        socket.on('input', function(data) {

            console.log(data);
            var name = data.name,
                nameColor = data.nameColor,     //DP+
                message = data.message,
                messageTime = data.time,
                messageNumber = data.number,
                messageImage = data.image
                whitespacePattern = /^\s*$/;

            if(whitespacePattern.test(name)) {
                sendStatus('Name is required.');
            }
            else if(whitespacePattern.test(message) && whitespacePattern.test(messageImage)){
                sendStatus('Either a message or a message is required');
            }
            else {
                msgCollection.insert({name: name, message: message, time: messageTime, number: messageNumber, image: messageImage, nameColor: nameColor}, function() {
                    // Emit latest message to ALL clients
                    client.emit('output', [data]);

                    sendStatus({
                        message: "Message sent",
                        clear: true
                    });
                });
            }
        });
    });
});

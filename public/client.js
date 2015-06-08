var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

//// Draw title
//var x = document.getElementById('canvas');
//var canvas = x.getContext('2d');
//canvas.shadowOffsetX = 8;
//canvas.shadowOffsetY = 8;
//canvas.shadowBlur = 2;
//canvas.fillStyle = "rgba(255, 255, 255, 1)";
//canvas.shadowColor = 'rgba(0, 0, 0, 0.8)';
//
//canvas.font = "bold 36px Tahoma";
//canvas.textAlign = "end";
//canvas.fillText("The Chatty Penguin", 400, 50);

// Get required nodes
var getNode = function (s) {
    return document.querySelector(s);

};

var status = getNode('.chat-status span');
var messages      = getNode('.chat-messages');
var textarea      = getNode('.chat textarea');
var chatName      = getNode('.chat-name');
var chatNameColor = getNode('.chat-name-color');    //DP+
var title = document.getElementById('title');
var fileInput = document.getElementById("file-button");

var statusDefault = status.textContent;

var messageNumber = 0;

var setStatus = function (s) {
    status.textContent = s;

    if (s !== statusDefault) {
        var delay = setTimeout(function () {
            setStatus(statusDefault);
            clearInterval(delay);
        }, 5000);
    }
};

setStatus('Testing');

// Try connection
try {
    var socket = io.connect('http://localhost:3000');
//    var socket = io();
    // var socket = io.connect();
} catch (e) {
    // Set status to warn user
    setStatus('Could not connect');
    console.log('Could not connect');
    throw e;
}

/* Mark title bar as read once text area has focus */
textarea.addEventListener("focus", function (e) {
    title.textContent = "Chat";
});

//
//textarea.addEventListener("dragstart", function(e) {
//    e.dataTransfer.setData('Text', "This is text to drag")
//}, false);
//
//textarea.addEventListener("dragenter", function(e) {
//    e.preventDefault();
//}, false);
//textarea.addEventListener("dragover", function(e) {
//    e.preventDefault();
//}, false);
//textarea.addEventListener("drop", function(e) {
//    e.preventDefault();
//    // var file = e.dataTransfer.mozGetDataAt("application/x-moz-file", 0);
//    // if(file instanceof Components.interfaces.nsIFile)
//    //     e.currentTarget.appendItem(file.leafName);
//    textarea.textContent = e.dataTransfer.getData('Text');
//}, false);

// Send button callback
var sendPressed = function (){
    console.log('Send button pressed');


    var fileName = fileInput.value;
    console.log(fileName);

    var self = textarea,
        name = chatName.value,
        nameColor = chatNameColor.value,    //DP+
        date = new Date(),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        noon = "AM",
        month = date.getMonth(),
        day = date.getUTCDate();

    // Build time string
    if(minutes < 10){
        minutes = "0" + minutes;
    }
    if(hours > 12) {
        noon = "PM";
        hours = hours - 12;
    }

    var messageTime = hours + ":" + minutes + noon + "\t" + months[month] + " " + day;

    console.log('Send!');
    socket.emit('input', {
        name: name,
        nameColor: nameColor,   //DP+
        message: self.value,
        time: messageTime,
        number: messageNumber,
        image: fileName
    });

};

if(socket !== undefined) {

    // Listen for output
    socket.on('output', function(data) {
        if(data.length) {
            // var scrollbar = new Control.ScrollBar('chat-messages','scrollbar-track');

            // See if last message sender
            if(data[data.length - 1].name != chatName.value){
                title.textContent = "* Chat *";
            }

            // Loop through results
            for (var x = 0; x < data.length; x = x + 1) {
                /* Div for image and text */
                var imgLink = document.createElement('a');
                var img = document.createElement('img');
                var message = document.createElement('div');

                /* Div for User, date and time, and arrow */
                var text = document.createElement('span');
                var user = document.createElement('span');
                var time = document.createElement('div');
                var linebreak = document.createElement('br');

                var timeStyle = 'chat-message-time-dark';
                var textStyle = 'chat-message-text-dark';
                var userStyle = 'chat-message-user-dark';
                var messageStyle = 'chat-message-dark';
                var imageStyle = 'chat-message-image';

                // Alternate between light and dark background
                if(data[x].number % 2 == 0){
                    timeStyle = 'chat-message-time-light';
                    textStyle = 'chat-message-text-light';
                    userStyle = 'chat-message-user-light';
                    messageStyle = 'chat-message-light';
                }

                //Prepare image
                if(data[x].image != ''){
                    var src = 'http://localhost:3000/uploads/' + data[x].image;
                    console.log(src);

                    imgLink.setAttribute('href', src);
                    img.setAttribute('src', src);
                    img.setAttribute('alt', 'na');
                    img.setAttribute('title', data[x].image);
                    img.setAttribute('class', imageStyle);
//                    img.setAttribute('padding-left', '10px');

                    imgLink.appendChild(img);
//                    img.setAttribute('width', '10');
//                    img.setAttribute('height', '10');
                }
                else {
                    img = null;
                }

                //Compose message

                user.setAttribute('class', userStyle);
                user.setAttribute('style', 'color: ' + data[x].nameColor +';');    //DP+ Changes color of your message based on what was entered into the chatNameColor box from the web
                user.textContent = data[x].name;
                text.setAttribute('class', textStyle);
                text.textContent = ' >> ' + data[x].message;
                time.setAttribute('class', timeStyle);
                time.textContent += data[x].time;

                message.setAttribute('class', messageStyle);
                if(img != null) {
                    message.appendChild(imgLink);
                    message.appendChild(linebreak);
                }
                message.appendChild(user);
                message.appendChild(text);
                message.appendChild(time);

                // Append message
                messages.appendChild(message);
                messages.insertBefore(message, messages.firstChild);

                // Append user
                // messages.appendChild(user);
                // messages.insertBefore(message, messages.previousChild);
                messageNumber = messageNumber + 1;
            }
        }
    });

    // Listen for status
    socket.on('status', function(data) {
        setStatus((typeof data === 'object') ? data.message : data);

        if(data.clear === true) {
            textarea.value = '';
        }
    });

    // Listen for keydown
    textarea.addEventListener('keydown', function(event) {

        // Test for enter key and no shift key
        if(event.which == 13 && event.shiftKey === false){
            sendPressed();
            event.preventDefault();
        }
    });
}
else {
    setStatus("Could not connect");
}

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

// var urlString  = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
var urlString  = /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/g;
//var urlString = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@\/?]*)?)(\s+|$)/g;

var urlPattern = new RegExp(urlString);

// Get required nodes
var getNode = function (s) {
    return document.querySelector(s);

};

var messages      = getNode('.chat-messages');
var textarea      = getNode('.chat textarea');
var chatName      = getNode('.chat-name');
var chatNameColor = getNode('.chat-name-color');    //DP+
var title = document.getElementById('title');
var fileInput = document.getElementById("file-button");

var statusDefault = "Idle";

var setStatus = function (s) {
    var status = document.getElementById('status');
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
    var socket = io.connect('http://localhost:8080');

} catch (e) {
    // Set status to warn user
    setStatus('Could not connect');
    console.log('Could not connect');
    throw e;
}

$("form").submit(function(e) {
    e.preventDefault();

    var fd = new FormData(document.querySelector("form"));
    $.ajax({
          url: "upload",
          type: "POST",
          data: fd,
          processData: false,  // tell jQuery not to process the data
          contentType: false   // tell jQuery not to set contentType
    })
    .done(function (){
        setStatus("Message sent");
        textarea.value = '';
        fileInput.value = '';
    });

});

/* Mark title bar as read once text area has focus */
textarea.addEventListener("focus", function (e) {
title.textContent = "Chat";
});

// Send button callback
var sendPressed = function (){
console.log('Send button pressed');


var fileName = fileInput.value;

var self = textarea;
var name = chatName.value;
    var nameColor = chatNameColor.value;    //DP+
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var noon = "AM";
    var month = date.getMonth();
    var day = date.getUTCDate();

    // Build time string
    if(minutes < 10){
        minutes = "0" + minutes;
    }
    if(hours > 12) {
        noon = "PM";
        hours = hours - 12;
    }

    var messageTime = hours + ":" + minutes + noon + "\t" + months[month] + " " + day;

    socket.emit('input', {
        name: name,
        nameColor: nameColor,   //DP+
        message: self.value,
        time: messageTime,
        image: fileName
    });

};

if(socket !== undefined) {

    // Listen for output
    socket.on('output', function(data) {
        if(data.length) {

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
                var lineBreak = document.createElement('br');

                var timeStyle = 'chat-message-time-dark';
                var textStyle = 'chat-message-text-dark';
                var userStyle = 'chat-message-user-dark';
                var messageStyle = 'chat-message-dark';
                var imageStyle = 'chat-message-image';

                /* Alternate between light and dark background */
                if(data[x].number % 2 == 0){
                    timeStyle = 'chat-message-time-light';
                    textStyle = 'chat-message-text-light';
                    userStyle = 'chat-message-user-light';
                    messageStyle = 'chat-message-light';
                }

                /* Prepare image */
                if(data[x].image != ''){
                    var src = 'http://localhost:8080/uploads/' + data[x].image;
                    console.log(src);

                    imgLink.setAttribute('href', src);
                    img.setAttribute('src', src);
                    img.setAttribute('alt', 'na');
                    img.setAttribute('title', data[x].image);
                    img.setAttribute('class', imageStyle);

                    imgLink.appendChild(img);
                }
                else {
                    img = null;
                }

                /* Check for urls and prepare text div */
                text.setAttribute('class', textStyle);
                text.textContent = ' >> ';
                //var urlArray = data[x].message.match(urlPattern);
                var textArray = data[x].message.split(urlPattern);

                var i = 0;
                var result;
                while((result = urlPattern.exec(data[x].message)) !== null){
                    console.log('Found: ' + result[0]);
                    
                    /* Create span for text */
                    var textSpan = document.createElement('span');
                    textSpan.textContent = textArray[i];
                    i = i + 2;

                    /* Create span for url */
                    var urlLink = document.createElement('a');
                    if(/https?/.test(result[0])){
                        urlLink.setAttribute('href', result[0]);
                    }
                    else {
                        urlLink.setAttribute('href', 'http://' + result[0]);
                    }
                    urlLink.setAttribute('style', 'color: #2B7BB9;');
                    urlLink.textContent = result[0];

                    /* Append new span's to the text message span */
                    text.appendChild(textSpan);
                    text.appendChild(urlLink);
                }

                var textSpan = document.createElement('span');
                textSpan.textContent = textArray[i];
                text.appendChild(textSpan);
                
                //var i = 0;
                //for(var t in textArray){
                    //[> Create span for text <]
                    //var textSpan = document.createElement('span');
                    //textSpan.textContent = textArray[t];

                    //[> Create span for url <]
                    //var urlLink = document.createElement('a');
                    //urlLink.setAttribute('href', urlArray[i]);
                    //urlLink.setAttribute('style', 'color: #2B7BB9;');
                    //urlLink.textContent = urlArray[i++];

                    //[> Append new span's to the text message span <]
                    //text.appendChild(textSpan);
                    //text.appendChild(urlLink);
                //}

                /* Prepare user div */
                user.setAttribute('class', userStyle);
                user.setAttribute('style', 'color: ' + data[x].nameColor +';');
                user.textContent = data[x].name;


                /* Prepare time div */
                time.setAttribute('class', timeStyle);
                time.textContent += data[x].time;

                /* Compose message */
                message.setAttribute('class', messageStyle);
                if(img != null) {
                    message.appendChild(imgLink);
                    message.appendChild(lineBreak);
                }

                message.appendChild(user);
                message.appendChild(text);
                message.appendChild(time);

                /* Append message to message board */
                messages.appendChild(message);
                messages.insertBefore(message, messages.firstChild);

                // Append user
                // messages.appendChild(user);
                // messages.insertBefore(message, messages.previousChild);
            }
        }
    });

    // Listen for status
    socket.on('status', function(data) {
        setStatus((typeof data === 'object') ? data.message : data);

        if(data.clear === true) {
            textarea.value = '';
            fileInput.value = '';
        }
    });
}
else {
    setStatus("Could not connect");
}

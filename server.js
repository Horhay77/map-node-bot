//server.js
'use strict'

//first we import our dependencies...
/*var express = require('express');
var bodyParser = require('body-parser');
var Comment = require('./model/comments')*/

var telegram = require('telegram-bot-api');
var mongoose = require('mongoose');
var Pole = require('./model/pole');
var request = require('request');

var mongoDB = 'mongodb://admin:Abcd1234@ds052649.mlab.com:52649/mongoose_number_one';
mongoose.connect(mongoDB, { useMongoClient: true })
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var api = new telegram({
        token: '431245710:AAGcIyO4wIyLDYSlk55K6tWCAOsBjQBBLQ4',
        updates: {
            enabled: true
        }
    });

api.on('message', function (message) {
    // Check first if message != undefined when handling other events
    // Received text message
    console.log(message);
    let chat_id = message['chat']['id'];
    let user_id = message['from']['id'];
    let username = message['from']['username'];
    let date = message['date'];
    let datems = date * 1000;
    let reply_message = message['message_id'];
    if (message.hasOwnProperty('text')) {
        let text = message['text'];
        //checkPole(chat_id, user_id, username, datems);
        // COMMANDS
        if (text.includes('/conquer')) {
            let reply_markup = JSON.stringify(
                {
                    keyboard: [
                        [{
                            "text": "Share location",
                            "request_location": true
                        }, "Don't share"]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true//,
                    //selective: true
                }
            );
            // User tries to conquer a new part of map
            var response = {
                chat_id: chat_id,
                text: 'Share your location to conquer the place!',
                reply_to_message_id: reply_message,
                disable_notification: true,
                // entities: []
                reply_markup: reply_markup
            };
            console.log(response);
            api.sendMessage(response);
            //.then(sent => console.log(sent)); //store sent message for response*/
            /*api.sendMessage({
                chat_id: chat_id,
                text: "prueba",
                reply_markup: JSON.stringify(),
                reply_to_message_id: reply_message
            });*/
        }
    }

    if (message.hasOwnProperty('location')) {
        //Check first if is answer to a conquer request and also if the place has been conquered or not

        let latitude = message['location']['latitude'].toFixed(2);
        let longitude = message['location']['longitude'].toFixed(2);
        request.post(
            {
                url: 'https://horhay77.carto.com/api/v2/sql',
                form: {
                    api_key: 'b8eca4836c0500b9c3f41625411bb88650a8f2ee',
                    q: "SELECT * FROM points_table WHERE the_geom = ST_SetSRID(ST_Point(" + longitude + "," + latitude + "),4326) AND chat_id = '"+chat_id+"'"
                }
            },
            function (err, httpResponse, body) {
                let info = JSON.parse(body);
                if (info.total_rows == 0) { //Allow to conquer
                    request.post(
                        {
                            url: 'https://horhay77.carto.com/api/v2/sql',
                            form: {
                                api_key: 'b8eca4836c0500b9c3f41625411bb88650a8f2ee',
                                q: "INSERT INTO points_table (the_geom, user_id, chat_id, username, date) "+
                                "VALUES (ST_SetSRID(ST_Point(" + longitude + ", " + latitude + "), 4326), '"+
                                user_id + "', '" + chat_id + "', '" + username + "', TO_TIMESTAMP("+ date + "))"
                            }
                        },
                        function (err, httpResponse, body) {
                            //console.log(JSON.parse(body));
                            api.sendMessage({
                                chat_id: chat_id,
                                text: 'You conquered a new place!'
                            });
                        }
                    );
                }
                else {
                    api.sendMessage({
                        chat_id: chat_id,
                        text: 'This place is already conquered'
                    });
                }
            }
        );
    }
});

function checkPole(chat_id, user_id, username, date) {
    var poleQuery = Pole.findOne({ chat_id: chat_id });
    return poleQuery.exec().then(function(chat){
        if (chat == null) {
            var newChat = new Chat({
                chat_id: chat_id,
                poles: [{ user: user_id, times: 1 }],
                lastPole: date
            });
            api.sendMessage({
                chat_id: chat_id,
                text: 'El usuario ' + username + ' hizo la pole!'
            });
            newChat.save();
            
            return newChat;
        }
        else {
            let now = new Date();
            let diffms = now.getTime() - chat.lastPole.getTime(); // + (1000 * 3600 * 24);
            let diffdays = diffms / (1000 * 3600 * 24);
            if (diffdays > 1) {
                let found = false;
                chat.poles.forEach(function (userPole) {
                    if (userPole.user == user_id) {
                        userPole.times++;
                        found = true;
                    }
                });
                if (!found) {
                    chat.poles.push({ user: user_id, times: 1 });
                }
                chat.lastPole = now;
                api.sendMessage({
                    chat_id: chat_id,
                    text: 'El usuario ' + username + ' hizo la pole!'
                });
                chat.save();
            }
            return chat;
        }
    });
}


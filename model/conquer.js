'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ConquerSchema = new Schema({
    chat_id: String,
    intent: [{ user: String, resp_message_id: Number }],
});

module.exports = mongoose.model('Conquer', ConquerSchema);
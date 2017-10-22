'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PoleSchema = new Schema({
    chat_id: String,
    poles: [{ user: String, times: Number }],
    lastPole : Date
});

module.exports = mongoose.model('Pole', PoleSchema);
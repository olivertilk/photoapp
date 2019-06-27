"use strict";

/*
 * Defined the Mongoose Schema and return a Model for an Activity
 */

/* jshint node: true */

var mongoose = require('mongoose');

/*
 * Activity
 */

// create a schema for Activity
var activitySchema = new mongoose.Schema({
    type: {type: String, enum: ['Photo upload', 'New comment', 'New like', 'New unlike', 'User registration', 'User login', 'User logout']}, // 	
    date_time: {type: Date, default: Date.now}, // 	The date and time when the activity was added to the database
    user_id: mongoose.Schema.Types.ObjectId, // The ID of the user who created the activity.
    additional_id: mongoose.Schema.Types.ObjectId // Additional releveant information.
});

// the schema is useless so far
// we need to create a model using it
var Activity = mongoose.model('Activity', activitySchema);

// make this available to our Node application
module.exports = Activity;

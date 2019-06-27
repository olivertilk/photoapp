"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

var fs = require("fs");

var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var Activity = require('./schema/activity.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

mongoose.connect('mongodb://localhost/cs142project6', { useNewUrlParser: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));

app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
    console.log("Request for /");
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));
            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).end('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        response.status(401).send(JSON.stringify("Please log in."));
        return;
    }

    User.find(function (err, users) {
        if (err) {
            console.log('Error getting /user/list:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!users) {
            console.log('No users found.', err);
            response.status(400).send('No users found.');
            return;
        }

        let usersCopy = JSON.parse(JSON.stringify(users));
    
        //Filter out the unneeded fields
        let allowed = ['_id', 'first_name', 'last_name'];
        let filteredUsers = usersCopy.map(function (element) {
            return Object.keys(element)
                .filter(key => allowed.includes(key))
                .reduce((obj, key) => {
                    obj[key] = element[key];
                    return obj;
                }, {});
        });
        response.status(200).end(JSON.stringify(filteredUsers));
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        response.status(401).send(JSON.stringify("Please log in."));
        return;
    }

    var user_id = request.params.id;

    User.findOne({_id: user_id}, function (err, user) {
        if (err) {
            console.log('Error getting user with id:', user_id);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!user) {
            console.log('Could not find a user with id ', user_id);
            response.status(400).send('Could not find a user with id ' + user_id);
            return;
        }

        let userCopy = JSON.parse(JSON.stringify(user));

        //Filter out the unneeded fields
        let allowed = ['_id', 'first_name', 'last_name', 'location', 'description', 'occupation'];
        let filteredUser = Object.keys(userCopy)
                .filter(key => allowed.includes(key))
                .reduce((obj, key) => {
                    obj[key] = userCopy[key];
                    return obj;
                }, {});

        response.status(200).end(JSON.stringify(filteredUser));
    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        response.status(401).send(JSON.stringify("Please log in."));
        return;
    }

    var user_id = request.params.id;

    Photo.find({user_id: user_id}, function (err, photos) {
        if (err) {
            console.log('Error getting photos of user with id:', user_id);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!photos) {
            console.log('Could not find any photos for user with id ' + user_id);
            response.status(400).send('Could not find any photos for user with id ' + user_id);
            return;
        }

        let photosCopy = JSON.parse(JSON.stringify(photos));

        //Asynchronously loop through the photos
        async.each(photosCopy, function (photo, done_callback1) {
            
            //Asynchronously look up the user info for all the comments of the current photo
            async.each(photo.comments, function (comment, done_callback2) {
                User.findOne({_id: comment.user_id}, function (err, user) {
                    if (err) {
                        console.log('Error getting user of the comment.', err);
                        response.status(400).send(JSON.stringify(err));
                        return;
                    }
                    if (!user) {
                        console.log('Could not find a user with id ' + comment.user_id);
                        response.status(400).send('Could not find a user with id ' + comment.user_id);
                        return;
                    }

                    comment.user = {};
                    comment.user._id = user._id;
                    comment.user.first_name = user.first_name;
                    comment.user.last_name = user.last_name;

                    done_callback2(err);
                });
            }, function (err) {                
                //Must call here instead of outside of async because have to wait for async to complete
                done_callback1(err); 
            });
        }, function (err) {
            if (err) {
                console.log('Error processing photos.', err);
                response.status(500).send(JSON.stringify(err));
                return;
            } else {
                let allowedPhotoProps = ['_id', 'user_id', 'comments', 'likes', 'file_name', 'date_time'];
                let allowedCommentProps = ['comment', 'date_time', '_id', 'user'];
                
                //Filter out the unneeded fields from photos and comments
                let filteredPhotos = photosCopy.map(function (element) {
                    //First, filter the comments of each photo for the allowed properties
                    let filteredComments = element.comments.map(function (comment) {
                        return Object.keys(comment)
                        .filter(key => allowedCommentProps.includes(key))
                        .reduce((obj, key) => {
                            obj[key] = comment[key];
                            return obj;
                        }, {});

                    });
                    element.comments = filteredComments;

                    //Then, filter the photo for the allowed properties
                    return Object.keys(element)
                        .filter(key => allowedPhotoProps.includes(key))
                        .reduce((obj, key) => {
                            obj[key] = element[key];
                            return obj;
                        }, {});
                });

                response.status(200).end(JSON.stringify(filteredPhotos));
            }
        });
    });
});

app.get('/activities', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        response.status(401).send(JSON.stringify("Please log in."));
        return;
    }

    Activity.find({})
            .limit(5)
            .sort({ date_time: -1 })
            .exec(function (err, activities) {
                if (err) {
                    console.log('Error getting activities.');
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                if (!activities) {
                    console.log('Could not find any activities.');
                    response.status(400).send('Could not find any activities.');
                    return;
                }

                let activitiesCopy = JSON.parse(JSON.stringify(activities));

                //Asynchronously loop through the photos
                async.each(activitiesCopy, function (activity, done_callback1) {
                    User.findOne({_id: activity.user_id}, function (err, user) {
                        if (err) {
                            console.log('Error getting user of the activity.', err);
                            response.status(400).send(JSON.stringify(err));
                            return;
                        }
                        if (!user) {
                            console.log('Could not find a user with id ' + activity.user_id);
                            response.status(400).send('Could not find a user with id ' + activity.user_id);
                            return;
                        }

                        activity.user = {};
                        activity.user._id = user._id;
                        activity.user.first_name = user.first_name;
                        activity.user.last_name = user.last_name;

                        if (activity.additional_id) {
                            Photo.findOne({_id: activity.additional_id}, function (err, photo) {
                                if (err) {
                                    console.log('Error getting photo.', err);
                                    response.status(400).send(JSON.stringify(err));
                                    return;
                                }
                                if (!photo) {
                                    console.log('Could not find a photo with id ' + activity.additional_id);
                                    response.status(400).send('Could not find a photo with id ' + activity.additional_id);
                                    return;
                                }

                                activity.photo = {};
                                activity.photo.photo_id = photo._id;
                                activity.photo.file_name = photo.file_name;

                                done_callback1(err);
                            });
                        } else {
                            done_callback1(err);
                        }
                    });
                }, function (err) {
                    if (err) {
                        console.log('Error processing activities.', err);
                        response.status(500).send(JSON.stringify(err));
                        return;
                    } else {
                        console.log('Successfully retrieved activities:', activitiesCopy);
                        response.status(200).end(JSON.stringify(activitiesCopy));
                    }
                });
    });
});

app.post('/admin/login', function (request, response) {
    if (!request.body.login_name) {
        console.log("Login name cannot be blank.");
        response.status(400).send("Login name cannot be blank.");
        return;
    }

    if (!request.body.password) {
        console.log("Password name cannot be blank.");
        response.status(400).send("Password cannot be blank.");
        return;
    }

    let login_name = request.body.login_name;
    let password = request.body.password;

    User.findOne({login_name: login_name, password: password}, function (err, user) {
        if (err) {
            console.log('Error getting user with login name ' + login_name + ". ", err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!user) {
            console.log("Wrong login name or password");
            response.status(400).send("Wrong login name or password.");
            return;
        }

        let activity = {
            type: 'User login',
            user_id: user._id
        }

        Activity.create(activity, function (err, activity) {
            if (err) {
                console.log('Error creating new activity object.');
                response.status(400).send(JSON.stringify(err));
                return;
            }
            console.log('Successfully added new user login activity.', activity);
            response.status(200).end('Successfully added new user login activity.');
        });

        //The logged in user is stored into the session
        request.session.user_id = user._id;
        request.session.login_name = user.login_name;

        let userCopy = JSON.parse(JSON.stringify(user));

        //Filter out the unneeded fields
        let allowed = ['_id', 'first_name'];
        let filteredUser = Object.keys(userCopy)
                .filter(key => allowed.includes(key))
                .reduce((obj, key) => {
                    obj[key] = userCopy[key];
                    return obj;
                }, {});

        response.status(200).end(JSON.stringify(filteredUser));
    });
});

app.post('/admin/logout', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        console.log("Please log in.");
        response.status(401).send("Please log in.");
        return;
    }

    let activity = {
        type: 'User logout',
        user_id: request.session.user_id
    }

    Activity.create(activity, function (err, activity) {
        if (err) {
            console.log('Error creating new activity object.');
            response.status(400).send(JSON.stringify(err));
            return;
        }
        console.log('Successfully added new user logout activity.', activity);
        response.status(200).end('Successfully added new user logout activity.');
    });

    delete request.session.user_id;
    delete request.session.login_name;

    request.session.destroy(function (err) {
        console.log('Error destroying session.', err);
        response.status(400).send(JSON.stringify(err));
        return;
     });
    response.status(200).end();
});

app.post('/commentsOfPhoto/:photo_id', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        console.log("Please log in.");
        response.status(401).send(JSON.stringify("Please log in."));
        return;
    }

    if (!request.body.comment) {
        console.log("Comment is blank.");
        response.status(400).send("Comment is blank.");
        return;
    }

    let comment = request.body.comment;
    let photo_id = request.params.photo_id;

    //Add comment with user_id, comment and datetime to MongoDB database
    Photo.findOne({_id: photo_id}, function (err, photo) {
        if (err) {
            console.error('Error getting photo with id ', photo_id, err);
            response.status(400).send("Error getting photo. ", JSON.stringify(err));
            return;
        }
        if (!photo) {
            console.log("Photo was not found.");
            response.status(400).send("Photo was not found.");
            return;
        }

        let user_id = request.session.user_id;

        let newComment = { comment: comment, user_id: user_id };
        photo.comments.push(newComment);
        
        photo.save();

        let activity = {
            type: 'New comment',
            user_id: user_id,
            additional_id: photo._id
        }

        Activity.create(activity, function (err, activity) {
            if (err) {
                console.log('Error creating new activity object.');
                response.status(400).send(JSON.stringify(err));
                return;
            }
            console.log('Successfully added new comment activity.', activity);
            response.status(200).end('Successfully added new comment activity.');
        });

        console.log('Successfully added comment', newComment);
        response.status(200).end("Successfully added comment.");
    });
});

app.post('/photos/new', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        console.log("Please log in first.");
        response.status(401).send(JSON.stringify("Please log in first."));
        return;
    }    

    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            console.log('Error uploading file or no file sent.');
            response.status(400).send('Error uploading file or no file sent.');
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        // We need to create the file in the directory "images" under a unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
            if (err) {
                console.log('Error writing file.');
                response.status(400).send(JSON.stringify(err));
                return;
            }

            let user_id = request.session.user_id

            //Create a new Photo object in the database
            Photo.create( {file_name: filename, user_id: user_id},  function (err, photo) {
                if (err) {
                    console.log('Error creating new photo object.');
                    response.status(400).send(JSON.stringify(err));
                    return;
                }

                let activity = {
                    type: 'Photo upload',
                    user_id: user_id,
                    additional_id: photo._id
                }

                Activity.create(activity, function (err, activity) {
                    if (err) {
                        console.log('Error creating new activity object.');
                        response.status(400).send(JSON.stringify(err));
                        return;
                    }
                    console.log('Successfully added new photo upload activity.', activity);
                    response.status(200).end('Successfully added new photo upload activity.');
                });

                console.log('Successfully added new photo.');
                response.status(200).end("Successfully added new photo.");
            });
        });
    });
});


app.post('/user', function (request, response) {
    if (!request.body.login_name) {
        console.log("Login name cannot be blank.");
        response.status(400).send("Login name cannot be blank.");
        return;
    }

    if (!request.body.password) {
        console.log("Password name cannot be blank.");
        response.status(400).send("Password cannot be blank.");
        return;
    }

    if (!request.body.first_name) {
        console.log("First name cannot be blank.");
        response.status(400).send("First name cannot be blank.");
        return;
    }

    if (!request.body.last_name) {
        console.log("Last name cannot be blank.");
        response.status(400).send("Last name cannot be blank.");
        return;
    }

    User.findOne({login_name: request.body.login_name}, function (err, user) {
        console.log('err is:', err);
        console.log('user is:', user);
        console.log('typeof user is:', typeof user);

        if (err) {
            console.log('Error getting user with login name', request.body.login_name);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (user) {
            console.log("User " + user.login_name + " already exists.");
            response.status(400).send("User " + user.login_name + " already exists.");
            return;
        }

        let registration = {
            login_name: request.body.login_name,
            password: request.body.password,
            first_name: request.body.first_name,
            last_name: request.body.last_name,
            location: request.body.location,
            description: request.body.description,
            occupation: request.body.occupation
        }

        User.create(registration, function (err, user) {
            if (err) {
                console.log('Error creating new user object.');
                response.status(400).send(JSON.stringify(err));
                return;
            }

            let activity = {
                type: 'User registration',
                user_id: user._id
            }

            Activity.create(activity, function (err, activity) {
                if (err) {
                    console.log('Error creating new activity object.');
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                console.log('Successfully added new user registration activity.', activity);
                response.status(200).end('Successfully added new user registration activity.');
            });

            console.log('Successfully added new user', user);
            response.status(200).end("Successfully added new user.");
        });
    });
});

app.post('/likesOfPhoto/:photo_id', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        console.log("Please log in.");
        response.status(401).send(JSON.stringify("Please log in."));
        return;
    }

    if (!request.body.action && (request.body.action !== 'like' || request.body.action !== 'like')) {
        console.log("The action must either be a like or an unlike.");
        response.status(400).send("The action must either be a like or an unlike.");
        return;
    }

    let photo_id = request.params.photo_id;

    //Add like from user_id and datetime to MongoDB database
    Photo.findOne({_id: photo_id}, function (err, photo) {
        if (err) {
            console.error('Error getting photo with id ', photo_id, err);
            response.status(400).send("Error getting photo. ", JSON.stringify(err));
            return;
        }
        if (!photo) {
            console.log("Photo was not found.");
            response.status(400).send("Photo was not found.");
            return;
        }

        let user_id = request.session.user_id;
        let action = request.body.action;

        if (action === 'like') {
            for (let i = 0; i < photo.likes.length; i++) {
                if( String(photo.likes[i].user_id) === String(user_id) ) {
                    console.log("User has already liked this photo.");
                    response.status(400).end("User has already liked this photo.");
                    return;
                }
            }

            let newLike = { user_id: user_id };
            photo.likes.push(newLike);
            photo.save();

            let activity = {
                type: 'New like',
                user_id: user_id,
                additional_id: photo._id
            }

            Activity.create(activity, function (err, activity) {
                if (err) {
                    console.log('Error creating new activity object.');
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                console.log('Successfully added new like activity.', activity);
                response.status(200).end('Successfully added new like activity.');
            });

            console.log('Successfully added like', newLike);
            response.status(200).end("Successfully added like.");
        } else if (action === 'unlike') {
            for (let i = 0; i < photo.likes.length; i++) {
                if( String(photo.likes[i].user_id) === String(user_id) ) {
                    photo.likes.splice(i, 1);
                    photo.save();

                    let activity = {
                        type: 'New unlike',
                        user_id: user_id,
                        additional_id: photo._id
                    }

                    Activity.create(activity, function (err, activity) {
                        if (err) {
                            console.log('Error creating new activity object.');
                            response.status(400).send(JSON.stringify(err));
                            return;
                        }
                        console.log('Successfully added new unlike activity.', activity);
                        response.status(200).end('Successfully added new unlike activity.');
                    });

                    console.log('Successfully unliked photo.');
                    response.status(200).end('Successfully unliked photo.');
                    return;
                }
            }

            console.log("Cannot unlike a photo that hasn't been liked.");
            response.status(400).end("Cannot unlike a photo that hasn't been liked.");
        } else {
            console.log('Action must be like or unlike.');
            response.status(200).end('Action must be like or unlike.');
        }
    });
});

app.post('/deleteCommentOfPhoto', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        console.log("Please log in.");
        response.status(401).send(JSON.stringify("Please log in."));
        return;
    }

    if (!request.body.photo_id || !request.body.comment_id) {
        console.log("Must provide photo ID and comment ID.");
        response.status(400).send("Must provide photo ID and comment ID.");
        return;
    }    

    let photo_id = request.body.photo_id;
    let comment_id = request.body.comment_id;

    //Add comment with user_id, comment and datetime to MongoDB database
    Photo.findOne({_id: photo_id}, function (err, photo) {
        if (err) {
            console.error('Error getting photo with id ', photo_id, err);
            response.status(400).send("Error getting photo. ", JSON.stringify(err));
            return;
        }
        if (!photo) {
            console.log("Photo was not found.");
            response.status(400).send("Photo was not found.");
            return;
        }

        let user_id = request.session.user_id;
        
        //Loop through comments to delete the one that matches comment_id
        for (let i = 0; i < photo.comments.length; i++) {
            //The _id field is an object so have to convert it to a string before comparison
            if (photo.comments[i]._id.toString() === comment_id) {
                //Check if user is allowed to delete the comment
                if (photo.comments[i].user_id.toString() !== user_id) {
                    console.log("You can only delete your own comments.");
                    response.status(400).end("You can only delete your own comments.");
                    return
                }

                photo.comments.splice(i, 1);
                photo.save();

                console.log('Successfully deleted comment.');
                response.status(200).end('Successfully deleted comment.');
                return;
            }
        }
        
        console.log('Comment not found.');
        response.status(200).end('Comment not found.');
    });
});

app.post('/deletePhoto', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        console.log("Please log in.");
        response.status(401).send(JSON.stringify("Please log in."));
        return;
    }

    if (!request.body.photo_id) {
        console.log("Must provide photo ID.");
        response.status(400).send("Must provide photo ID.");
        return;
    }    

    let photo_id = request.body.photo_id;

    Photo.findOne({_id: photo_id}, function (err, photo) {
        if (err) {
            console.error('Error getting photo with id ', photo_id, err);
            response.status(400).send("Error getting photo. ", JSON.stringify(err));
            return;
        }
        if (!photo) {
            console.log("Photo was not found.");
            response.status(400).send("Photo was not found.");
            return;
        }

        let user_id = request.session.user_id;
        
        if (photo.user_id.toString() !== user_id) {
            console.log("You can only delete your own photos.");
            response.status(400).send("You can only delete your own photos.");
            return;
        }

        Photo.deleteOne({_id: photo_id}, function (err) {
            if (err) {
                console.log('Error deleting photo with id ', photo_id, err);
                response.status(400).send(JSON.stringify(err));
                return;
            }
            
            console.log('Successfully deleted photo.');
            response.status(200).end('Successfully deleted photo.');
        });
    });
});

app.post('/deleteUser', function (request, response) {
    //Check if user is logged in, if not, respond with status 401 unauthorized
    if (!request.session.user_id) {
        console.log("Please log in.");
        response.status(401).send(JSON.stringify("Please log in."));
        return;
    }
    if (!request.body.user_id) {
        console.log("Must provide user ID.");
        response.status(400).send("Must provide user ID.");
        return;
    }    

    let user_id = request.body.user_id;
    let logged_in_user_id = request.session.user_id;
    
    if (logged_in_user_id !== user_id) {
        console.log("You can only delete your own account.");
        response.status(400).send("You can only delete your own account.");
        return;
    }

    Photo.find({}, function (err, photos) {
        if (err) {
            console.log('Error getting photos.');
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!photos) {
            console.log('Could not find any photos.');
            response.status(400).send('Could not find any photos.');
            return;
        }

        async.each(photos, function (photo, done_callback1) {
            if (photo.user_id.toString() === logged_in_user_id) {
                Photo.deleteOne({_id: photo._id}, function (err) {
                    if (err) {
                        console.log('Error deleting photo with id ', photo._id, err);
                        response.status(400).send(JSON.stringify(err));
                        return;
                    }
                    
                    console.log('Successfully deleted photo.');
                    response.status(200).end('Successfully deleted photo.');
                });
                done_callback1(err);
            } else {
                //Loop through comments to delete ones made by the user
                for (let i = 0; i < photo.comments.length; i++) {
                    if (photo.comments[i].user_id.toString() === logged_in_user_id) {

                        photo.comments.splice(i, 1);
                        photo.save();

                        console.log('Successfully deleted comment.');
                        response.status(200).end('Successfully deleted comment.');
                        return;
                    }
                }

                //Loop through likes to delete the one that matches comment_id
                for (let i = 0; i < photo.likes.length; i++) {
                    if (photo.likes[i].user_id.toString() === logged_in_user_id) {

                        photo.likes.splice(i, 1);
                        photo.save();

                        console.log('Successfully deleted like.');
                        response.status(200).end('Successfully deleted like.');
                        return;
                    }
                }

                done_callback1(err);
            }
        }, function (err) {
            if (err) {
                console.log('Error processing photos.', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            console.log('Successfully deleted user and related data.');
            response.status(200).end('Successfully deleted user and related data.');
        });
    });

    User.deleteOne({_id: user_id}, function (err) {
        if (err) {
            console.log('Error deleting user with id ', user_id, err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        
        console.log('Successfully deleted user.');
        response.status(200).end('Successfully deleted user.');
    });
});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});



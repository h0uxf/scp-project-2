//////////////////////////////////////////////////////
// REQUIRE BCRYPT MODULE
//////////////////////////////////////////////////////
const bcrypt = require("bcrypt");

//////////////////////////////////////////////////////
// SET SALT ROUNDS
//////////////////////////////////////////////////////
const saltRounds = 10;

//////////////////////////////////////////////////////
// MIDDLEWARE FUNCTIONS FOR THE PASSWORD
//////////////////////////////////////////////////////
module.exports = {
    comparePassword : (req, res, next) => {
        const callback = (err, isMatch) => {
            if(err) {
                console.error(`Error Bcrypt: ${err}`);
                res.status(500).json(err);
            } else {
                if(isMatch) { // if the password matches
                    next();
                } else {
                    res.status(401).json({
                        message : 'Incorrect password, please try again.'
                    });
                };
            };
        };

        // bcrypt.compare() is a method to compare the provided password and the hashed password
        bcrypt.compare(req.body.password, res.locals.hash, callback);
    },

    hashPassword : (req, res, next) => {
        const callback = (err, hash) => {
            if(err) {
                console.error(`Error Bcrypt : ${err}`);
                res.status(500).json(err);
            } else {

                // after successful hashing it stores in res.locals and calls the next middleware function
                res.locals.hash = hash; 
                next();
            };
        };

        // bcrypt.hash() is a method to hash the password to enhance security
        bcrypt.hash(req.body.password, saltRounds, callback);
    }
};
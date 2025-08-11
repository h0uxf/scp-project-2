//////////////////////////////////////////////////////
// REQUIRE BCRYPT MODULE
//////////////////////////////////////////////////////
const bcrypt = require("bcrypt");
const logger = require("../logger.js");

//////////////////////////////////////////////////////
// SET SALT ROUNDS
//////////////////////////////////////////////////////
const saltRounds = 10;

//////////////////////////////////////////////////////
// MIDDLEWARE FUNCTIONS FOR THE PASSWORD
//////////////////////////////////////////////////////
module.exports = {
    comparePassword : (req, res, next) => {
        const callback = async (err, isMatch) => {
            if(err) {
                console.error(`Error Bcrypt: ${err}`);
                res.status(500).json(err);
            } else {
                if(isMatch) { // if the password matches
                    logger.debug(`Password verification successful for user: ${res.locals.username}`);
                    next();
                } else {
                    try {
                        logger.warn(`Failed login attempt for user: ${res.locals.username} - invalid password`);
                    } catch(auditError) {
                        console.error('Error creating audit log for failed login:', auditError);
                    }
                    
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
                req.body.password = hash; 
                next();
            };
        };

        // bcrypt.hash() is a method to hash the password to enhance security
        bcrypt.hash(req.body.password, saltRounds, callback);
    }
};
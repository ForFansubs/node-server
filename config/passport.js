const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mariadb = require('./maria')
const keys = require('./keys')

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys.secretOrKey;

module.exports = passport => {
    passport.use(
        new JwtStrategy(opts, (jwt_payload, done) => {
            mariadb.query(`SELECT id FROM user WHERE id='${jwt_payload.id}'`)
                .then(user => {
                    if (user[0]) {
                        return done(null, user[0]);
                    }
                    return done(null, false);
                })
                .catch(err => console.log(err));
        })
    );
};

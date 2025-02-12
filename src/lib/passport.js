const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const pool = require("../database");
const helpers = require("../lib/helpers");

//SignIn
passport.use(
  "local.signin",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      console.log(req.body);
      const rows = await pool.query("SELECT * FROM users WHERE email=?", [
        email,
      ]);
      if (rows.length > 0) {
        const user = rows[0];
        const validPassword = await helpers.matchPassword(
          password,
          user.password
        );
        if (validPassword) {
          done(null, user);
        } else {
          done(null, false);
        }
      } else {
        return done(null, false);
      }
    }
  )
);

//SignUP
passport.use(
  "local.signup",
  new LocalStrategy(
    {
      usernameField: "email",
      passportField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      const role = "cliente";
      const { name } = req.body;
      const newUser = {
        name,
        email,
        password,
        role,
      };

      newUser.password = await helpers.encryptPassword(password);
      const result = await pool.query("INSERT INTO users SET ?", [newUser]);
      newUser.id = result.insertId;
      return done(null, newUser);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query("SELECT * FROM users Where id=?", [id]);
  done(null, rows[0]);
});

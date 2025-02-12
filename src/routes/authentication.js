const express = require("express");
const router = express.Router();
const passport = require("passport");
const { isLoggedIn, isNotLoggedIn } = require("../lib/auth");

router.get("/signup", isNotLoggedIn, (req, res) => {
  res.render("auth/signup");
});

router.post(
  "/signup",
  passport.authenticate("local.signup", {
    successRedirect: "/profile",
    failureRedirect: "/signup",
  })
);

router.get("/signin", isNotLoggedIn, (req, res) => {
  res.render("auth/signin");
});

router.post("/signin", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local.signin", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect("/signin");

    req.logIn(user, (err) => {
      if (err) return next(err);

      if (user.role === "cliente") {
        return res.redirect("/profileClient");
      } else if (user.role === "vendedor") {
        return res.redirect("/profile");
      }

      return res.redirect("/signin");
    });
  })(req, res, next);
});

router.get("/profile", isLoggedIn, (req, res) => {
  if (req.user.role === "vendedor") {
    res.render("profile");
  } else {
    res.redirect("/profileClient");
  }
});

router.get("/profileClient", isLoggedIn, (req, res) => {
  if (req.user.role === "cliente") {
    res.render("profileClient");
  } else {
    res.redirect("/profile");
  }
});

router.get("/logout", isLoggedIn, (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/signin");
  });
});

module.exports = router;

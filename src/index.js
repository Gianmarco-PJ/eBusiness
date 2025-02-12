const express = require("express");
const morgan = require("morgan");
const { engine } = require("express-handlebars");
const path = require("path");
const passport = require("passport");
const session = require("express-session");

//incializaciones
const app = express();
require("./lib/passport");

//sessiones
app.use(
  session({
    secret: "@/eCommerce@/",
    resave: false,
    saveUninitialized: false,
  })
);

//Settings
app.set("port", process.env.PORT || 4000);
app.set("views", path.join(__dirname, "views"));
app.engine(
  ".hbs",
  engine({
    defaultLayout: "main",
    layoutsDir: path.join(app.get("views"), "layouts"),
    partialsDir: path.join(app.get("views"), "partials"),
    extname: ".hbs",
    helpers: require("./lib/handlebars"),
  })
);
app.set("view engine", ".hbs");

//middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

//Global variables
app.use((req, res, next) => {
  app.locals.user = req.user;
  next();
});

//Routes
app.use(require("./routes"));
app.use(require("./routes/authentication"));
app.use("/products", require("./routes/products"));

//Public
app.use(express.static(path.join(__dirname, "public")));

//Starting the server
app.listen(app.get("port"), () => {
  console.log("server on port", app.get("port"));
});

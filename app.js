if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");               // connect node with mondodb and defines schema
const path = require("path");
const methodOverride = require("method-override");  // helps html form to use put, patch, delete methods
const ejsMate = require("ejs-mate");                // layout/ templating
const session = require("express-session");         // Stores users session data
const MongoStore = require('connect-mongo');        // stores session data in mongodb
const flash = require("connect-flash");             // pop ups 
const passport = require("passport");               // authentication
const LocalStrategy = require("passport-local");    // usename and password check krta hai database se
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("connnected to DB");
    })
    .catch((err) => {
        console.log(err)
    });

async function main() {
    await mongoose.connect(dbUrl);
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", () => {
    console.log("ERROR IN MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    }
};

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use(session(sessionOptions));
app.use(flash());
passport.use(new LocalStrategy(s=User.authenticate()));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
})

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.listen(8080, () => {
    console.log("server is listening to port 8080");
})
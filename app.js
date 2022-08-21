require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const date = require(__dirname + "/data.js");


const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(session({
    secret: "Our little Secret.",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize()); // initalize session
app.use(passport.session()); // use passport to manage session

mongoose.connect("mongodb+srv://admin-harsh:harsh123@cluster0.6asgh9f.mongodb.net/todoModified", { useNewUrlParser: true });
// mongoose.connect("mongodb://localhost:27017/todoModified", { useNewUrlParser: true });


const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    userItems: [itemsSchema]
});


userSchema.plugin(passportLocalMongoose); // hash & salt
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://radiant-brushlands-90419.herokuapp.com/auth/google/todolist",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);

        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

const day = date.getDate();
app.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/todolist");
    }
    else {
        res.render("login");
    }
});

app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/todolist",
    passport.authenticate('google', { failureRedirect: "/" }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect('/todolist');
    });

app.get("/signup", function (req, res) {
    res.render("signup");
});


app.get("/todolist", function (req, res) {

    if (req.isAuthenticated()) {

        User.findById(req.user.id, function (err, foundUser) {
            if (err) {
                console.log(err);
            }
            else {
                if (foundUser) {
                    res.render("list", { listTitle: day, newListItems: foundUser.userItems });
                }
            }
        });
    }
    else {
        res.redirect("/");
    }
});




app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/todolist");
            });
            // res.redirect("/");
        }
    })

});


app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            // console.log("Hello");
            console.log(err);
            res.redirect("/signup");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/todolist");

            });
        }
    });
});

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect("/");
        }
    });

});

app.post("/todolist", function (req, res) {
    let item = req.body.itemName;
    const item1 = new Item({
        name: item
    });
    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        }
        else {
            if (foundUser) {
                foundUser.userItems.push(item1);
                foundUser.save(function (err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        res.redirect("/todolist");
                    }
                });
            }
        }
    });
});

app.post("/delete", function (req, res) {
    const itemId = req.body.checkBox;
    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        }
        else {
            if (foundUser) {
                const itemArr = foundUser.userItems;
                User.findOneAndUpdate({ _id: req.user.id }, { $pull: { userItems: { _id: itemId } } }, function (err, foundList) {
                    if (err) {
                        consile.log(err);
                    }
                    else {
                        // console.log("Successfully Deleted item!");
                    }
                });

                res.redirect("/todolist");
            }
        }
    });
});

// app.get("/:customList", function (req, res) {
//     // const customListName = _.lowerCase(req.params.customListName);
//     const customListName = _.capitalize(req.params.customList);
//     List.findOne({ name: customListName }, function (err, foundList) {
//         if (!err) {
//             if (!foundList) {
//                 //create a new list
//                 const list = new List({
//                     name: customListName,
//                     items: defaultItems
//                 });
//                 list.save();
//                 res.redirect("/" + customListName);
//             }
//             else {
//                 // show existinnh list
//                 res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
//             }
//         }
//     });
// });

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server started succesfully");
});          
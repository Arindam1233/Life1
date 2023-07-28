const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const encrypt = require("mongoose-encryption");
const mongoose = require("mongoose");


const session = require('express-session')
const passport  = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const findOrCreate = require("mongoose-findorcreate");


require('dotenv').config();

app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));
app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://127.0.0.1:27017/runDB");
const runschema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    LinkedinId:String,
    secret:String

})

runschema.plugin(findOrCreate);
runschema.plugin(passportLocalMongoose);
const User = mongoose.model("User",runschema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new LinkedInStrategy({
  clientID: process.env.CLIENT_I,
  clientSecret: process.env.CLIENT_S,
  callbackURL: "http://localhost:3000/auth/linkdin/secrets",
  scope: ['r_emailaddress', 'r_liteprofile'],
}, function(accessToken, refreshToken, profile,cb) {
  User.findOrCreate({ LinkedinId: profile.id }, function (err, user) {
    return cb(err, user);
  });
  // asynchronous verification, for effect...
 
}));
app.get('/auth/linkedin',
  passport.authenticate('linkedin', { state: 'SOME STATE'  }),
  function(req, res){
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  });
  app.get('/auth/linkdin/secrets', passport.authenticate('linkedin', {
    successRedirect: '/secrets',
    failureRedirect: '/login'
  }));
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }), 
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/",function(req,res){
    res.render("home")
});
app.get("/login",function(req,res){
    res.render("login")
});
app.get("/register",function(req,res){
    res.render("register")
});
app.get("/secrets",function(req,res){
  User.find({secret:{$ne:null}}).then((data)=>{
    if(data){
      res.render("secrets",{submitted:data});
    }
  })
})
app.get("/sorry",function(req,res){
    res.render("sorry");
})
app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err)
        }
        else{
            console.log("Successfully logged out")
        }
    });
    res.redirect("/")
})
app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit")

  }
  else{
    res.redirect("/login")
  }
})

app.post("/register",function(req,res){
   User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
        console.log(err);
        res.redirect("/register")
    }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
        })
    }
   })


})
app.post("/login", passport.authenticate('local', {
    successRedirect: '/secrets',
    failureRedirect: '/sorry'
  }));
app.post("/sorry",function(req,res){
    res.redirect("/login")
})
app.post("/submit",function(req,res){
  const submittedsecret = req.body.secret;
  User.findById(req.user.id).then((data)=>{
    if(data){
      data.secret = submittedsecret;
      data.save().then((data)=>{
        res.redirect("/secrets")
      })
    }
  })
})

app.listen(3000,function(){
    console.log("Servers ran successfully");
});
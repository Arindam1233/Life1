const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const encrypt = require("mongoose-encryption");
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/runDB");

require('dotenv').config();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));
const runschema = new mongoose.Schema({
    email:String,
    password:String
})

console.log(process.env.API_KEY)
runschema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]})
const User = mongoose.model("User",runschema);
app.get("/",function(req,res){
    res.render("home")
});
app.get("/login",function(req,res){
    res.render("login")
});
app.get("/register",function(req,res){
    res.render("register")
});
app.post("/register",function(req,res){
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    })
    newUser.save().then((data)=>{
        if(data){
            res.render("secrets");
        }
    })

})
app.post("/login",function(req,res){
    const username = req.body.username;
    const password  = req.body.password;
    User.findOne({email:username}).then((data)=>{
        if(data){
            if(data.password === password){
            res.render("secrets");
            }
            else{
                res.render("sorry")
            }
        }
       
    })
})
app.post("/sorry",function(req,res){
    res.redirect("/login")
})

app.listen(3000,function(){
    console.log("Servers ran successfully");
});
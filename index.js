const express = require('express');
var jwt = require('jsonwebtoken') ;
require('dotenv').config();
const app = express();

app.post('/create_new_storage', (req,res)=>{
    //auth user
    const username = {username:"jash"};
    //console.log(req.body.username) //ye kyu error dera hai?
    const token = jwt.sign(username,process.env.TOKEN_SECRET);
    res.json({token:token});
})


app.post('/upload_file',ensureToken,(req,res)=>{
    jwt.verify(req.token,process.env.TOKEN_SECRET,function(err,data){
        if(err){
            res.sendStatus(403);
        } else{
            res.json({message:"Upload files."});
        }
    })
})

function ensureToken(req,res,next){
    const bearerHeader = req.headers["authorization"];
    if(typeof bearerHeader !== 'undefined'){
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}




app.listen(3000,function(){
    console.log("Listening on port 3000");
})
const express = require('express');
var jwt = require('jsonwebtoken');
const multer= require('multer');
const path = require('path');
const cookieparser = require("cookie-parser");

require('dotenv').config();

const PORT = process.env.PORT || 3000
const app = express();
app.use(cookieparser());

const storage = multer.diskStorage({
    destination: './public/upload',
    filename: (req,file,cb)=>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({
    storage:storage
})

app.post('/create_new_storage', (req,res)=>{
    //auth user
    const username = {username:"jash"};
    //console.log(req.body.username) //ye kyu error dera hai?
    const token = jwt.sign(username,process.env.TOKEN_SECRET);
    return res
    .cookie('token',token)
    .json(
        {
            "status": "ok",
            "message": "Storage Created Successfully",
        }        
    );
})


app.post('/upload_file',upload.single('my_file'),ensureToken,(req,res)=>{
    jwt.verify(req.token,process.env.TOKEN_SECRET,function(err,data){
        if(err){
           return res.sendStatus(403);
        } else{
            res.json(
                {
                    "status": "ok",
                    "file_path": `${req.file.destination.split('.')[1]}/${req.file.filename}`
                 }
                
            )
        }
    })
})





app.post('')


function ensureToken(req,res,next){
    const bearerHeader = req.cookies.token;
    if(typeof bearerHeader !== 'undefined'){
        req.token = bearerHeader;
        next();
    } else {
        res.sendStatus(403);
    }
}


app.listen(PORT,function(){
    console.log(`Listening on port ${PORT}`);
})
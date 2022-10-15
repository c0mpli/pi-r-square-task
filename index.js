const express = require('express');
var jwt = require('jsonwebtoken');
const multer= require('multer');
const path = require('path');
const fs = require('fs');
const gTTS = require('gtts');
const { v4: uuidv4 } = require('uuid');


const cookieparser = require("cookie-parser");

require('dotenv').config();

const PORT = process.env.PORT || 3000
const app = express();
app.use(cookieparser());
app.use(express.json());

const storage = multer.diskStorage({
    destination: './public/upload',
    filename: (req,file,cb)=>{
        return cb(null, `${req.cookies.token}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({
    storage:storage
})

app.post('/create_new_storage', (req,res)=>{
    return res
    .cookie('token',uuidv4())
    .json(
        {
            "status": "ok",
            "message": "Storage Created Successfully",
        }        
    );
})


app.post('/upload_file',ensureToken,upload.single('my_file'),(req,res)=>{
    res.json(
        {
            "status": "ok",
            "file_path": `${req.file.destination.split('.')[1]}/${req.file.filename}`
        }
    )
})



app.post('/text_file_to_audio',ensureToken,(req,res)=>{
    const { file_path } = req.body;
    //verify if file exists or no
    if(fs.existsSync(file_path)){
        
        const content = fs.readFileSync(file_path,'utf8');
        var gtts = new gTTS(content, 'en');

        const filePathSplit = file_path.split('.');
        filePathSplit[filePathSplit.length - 1] = 'mp3';
        finalPathString = filePathSplit.join('.');

        gtts.save(finalPathString, function() {
            return res.json({
                    "status": "ok",
                    "message": "text to speech converted",
                    "audio_file_path": finalPathString
            })
          })
    } else{
        res.sendStatus(404);
    }
})


app.get('/merge_image_and_audio',ensureToken,(req,res)=>{
    
})

app.get('/download',(req,res)=>{

})



//verify if correct token
// function AuthMiddleware(req, res, next) {
//     jwt.verify(req.token,process.env.TOKEN_SECRET,function(err,data){
//         if(err){
//             return res.sendStatus(403);
//         } else {
//             next();
//         }
//     });
// }

//ensure if token is present in cookies
function ensureToken(req,res,next){
    const bearerHeader = req.cookies.token;
    if(typeof bearerHeader !== 'undefined'){
        req.token = bearerHeader;
        next();
    } else {
        res.status(403).json({
            "message": "first create the storage token",
        });
    }
}


app.listen(PORT,function() {
    console.log(`Listening on port ${PORT}`);
})
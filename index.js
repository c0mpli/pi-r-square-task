const express = require('express');
var jwt = require('jsonwebtoken');
const multer= require('multer');
const path = require('path');
const fs = require('fs');
const gTTS = require('gtts');
let videoStitch = require('video-stitch');
const {exec} = require('child_process')
let videoMerge = videoStitch.merge;

const { v4: uuidv4 } = require('uuid');


const cookieparser = require("cookie-parser");
const ffmpeg = require('ffmpeg');
const { concat } = require('video-stitch');
const { stderr } = require('process');

require('dotenv').config();

const PORT = process.env.PORT || 3000
const app = express();
app.use(cookieparser());
app.use(express.json());

const saveDirectory = './public/upload'


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



const storage = multer.diskStorage({
    destination: saveDirectory,
    filename: (req,file,cb)=>{
        return cb(null, `${req.cookies.token}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({
    storage:storage
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


app.post('/merge_image_and_audio',ensureToken,(req,res)=>{
    const {imagePath} = req.body
    const {audioPath} = req.body

    //verify if file exists or no
    if(fs.existsSync(imagePath) && fs.existsSync(audioPath)){

    } else{
        res.sendStatus(404);
    }
})


app.post('/merge_all_video',ensureToken,(req,res)=>{
    var list ='';
    const videoPaths = req.body.video_file_path_list;

    for(var i =0;i<videoPaths.length;i++){
        if(fs.existsSync(videoPaths[i])){
            list+= "file "
            list += path.basename(videoPaths[i]);
            list += '\n'
        }
        else{
            return res.sendStatus(404);
        }
    }

    var listFilePath =  "public/upload/"+ Date.now()+'list.txt'
    //console.log(listFilePath)
    var writeStream  = fs.createWriteStream(listFilePath)
    writeStream.write(list)
    writeStream.end()

    const outputFilePath = `public/upload/${req.cookies.token}_${Date.now()}output.mp4`
    exec(`ffmpeg -safe 0 -f concat -i ${listFilePath} -c copy ${outputFilePath}`, (err,stdout)=>{
        if(err){
            console.log(err)
            return;
        }
        else{
            return res.json(
                {
                    "status": "ok",
                    "message": "Merged All Video Successfully",
                    "video_file_path": outputFilePath
                }
                
            )
        }
    })



})


app.get('/download_file',ensureToken,(req,res)=>{
    const path = req.query.file_path 
    
    //verify if file exists or no
    if(fs.existsSync(path)){
        res.download(path)
    }
    else{
        res.sendStatus(404)
    }
})


app.get('/my_upload_file',ensureToken,(req,res)=>{
    var allFileNames=[];
    fs.readdir(saveDirectory, (err, files) => {
        if (err){
            return res.json({
              "message": "Error reading directory."  
            })
        } else {
          files.forEach(file => {
            if(file.includes(req.cookies.token)) //checks if file is upload by that user only or some other user
            allFileNames.push(file)
          })

          return res.json({
                "status": "ok",
                "data": allFileNames
          })
        }
      })
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
const express = require('express');
const multer= require('multer');
const path = require('path');
const fs = require('fs');
const gTTS = require('gtts');
const {exec} = require('child_process')
const { v4: uuidv4 } = require('uuid');


const cookieparser = require("cookie-parser");


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
    const {image_file_path} = req.body
    const {audio_file_path} = req.body
    const outputFilePath = `public/upload/output/${req.cookies.token}_${Date.now()}output.mp4`
    //verify if file exists or no
    if(fs.existsSync(image_file_path) && fs.existsSync(audio_file_path)){
        exec(`ffmpeg -framerate 1/5 -loop 1 -y -i ${image_file_path} -i ${audio_file_path} -c:v libx264 -c:a copy -shortest ${outputFilePath}`, (err,stdout)=>{
            if(err){
                console.log(err)
                return;
            }
            else{
                return res.json(
                    {
                        "status": "ok",
                        "message": "Video Created Successfully",
                        "video_file_path": outputFilePath
                    }
                    
                )
            }
        })
    } else{
        res.sendStatus(404);
    }
})

app.post('/merge_video_and_audio',ensureToken,(req,res)=>{
    const {video_file_path} = req.body
    const {audio_file_path} = req.body
    const outputFilePath = `public/upload/output/${req.cookies.token}_${Date.now()}output.mp4`
    
    //verify if file exists or no
    if(fs.existsSync(video_file_path) && fs.existsSync(audio_file_path)){
        exec(`ffmpeg -y -i ${video_file_path} -i ${audio_file_path}  -c:v copy -c:a copy  -map 0:v:0 -map 1:a:0  ${outputFilePath}`, (err,stdout)=>{
            if(err){
                console.log(err)
                return;
            }
            else{
                return res.json(
                    {
                        "status": "ok",
                        "message": "Video and Audio Merged Successfully",
                        "video_file_path": outputFilePath
                    }
                    
                )
            }
        })
    } else{
        res.sendStatus(404);
    }
})

app.post('/merge_all_video',ensureToken,(req,res)=>{
    var list ='';
    const videoPaths = req.body.video_file_path_list;

    for(var i =0;i<videoPaths.length;i++){
        if(fs.existsSync(videoPaths[i])){
            list += `file ${path.basename(videoPaths[i])}\n`
        }
        else{
            return res.sendStatus(404);
        }
    }

    var listFilePath =  "public/upload/test/"+ Date.now()+'list.txt'
    //console.log(listFilePath)
    var writeStream  = fs.createWriteStream(listFilePath)
    writeStream.write(list)
    writeStream.end()

    const outputFilePath = `public/upload/output/${req.cookies.token}_${Date.now()}output.mp4`
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
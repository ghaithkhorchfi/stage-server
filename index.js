const express = require('express');
const { createConnection } = require('mysql');
const multer= require('multer')
const fs = require("fs")
const { google } = require("googleapis");

//const bodyParser = require('body-parser')
const app = express();
const mysql=require('mysql');
const cors=require('cors');
const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'thor'
})
app.use(express.json());
app.use(express.urlencoded({ extended: true}))
app.use(cors())
//connection
db.connect((err)=>{
    if(err){
        throw err };
        console.log("Thor database is connected ...")
})


//upload
const storage= multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./upload')
    },
    filename:(req,file,cb)=>{
        cb(null, file.originalname)
    }
})
const upload= multer({storage:storage}).single('file')


app.post('/upload',(req,res)=>{
    upload(req,res,(err)=>{
        if(err){
            console.log('echec upload')
        }
        res.status(200).send(true)
   
    })

})
app.post(
    "/uploaddrive",
   
    function (req, res, next) {
        console.log("wselt l houni")
      const filename = req.body.filename;
      const filetype = req.body.filetype;
      const SCOPES = ["https://www.googleapis.com/auth/drive"];
      // The file token.json stores the user's access and refresh tokens, and is
      // created automatically when the authorization flow completes for the first
      // time.
      const TOKEN_PATH = "token.json";
      fs.readFile("credentials.json", (err, content) => {
        if (err) return console.log("Error loading client secret file:", err);
        // Authorize a client with credentials, then call the Google Drive API.
        //authorize(JSON.parse(content), listFiles);
        authorize(JSON.parse(content), Upload);
      });
  
      /**
       * Create an OAuth2 client with the given credentials, and then execute the
       * given callback function.
       * @param {Object} credentials The authorization client credentials.
       * @param {function} callback The callback to call with the authorized client.
       */
      function authorize(credentials, callback) {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
          client_id,
          client_secret,
          redirect_uris[0]
        );
  
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
          if (err) return getAccessToken(oAuth2Client, callback);
          oAuth2Client.setCredentials(JSON.parse(token));
          callback(oAuth2Client);
        });
      }
  
      /**
       * Get and store new token after prompting for user authorization, and then
       * execute the given callback with the authorized OAuth2 client.
       * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
       * @param {getEventsCallback} callback The callback for the authorized client.
       */
      function getAccessToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: "offline",
          scope: SCOPES,
        });
        console.log("Authorize this app by visiting this url:", authUrl);
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question("Enter the code from that page here: ", (code) => {
          rl.close();
          oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error("Error retrieving access token", err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
              if (err) return console.error(err);
              console.log("Token stored to", TOKEN_PATH);
            });
            callback(oAuth2Client);
          });
        });
      }
  
      /**
       * Lists the names and IDs of up to 10 files.
       * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
       */
      function Upload(auth) {
        var fileMetadata = {
          name: filename,
        };
        var media = {
          mimeType: filetype,
          body: fs.createReadStream(`./${filename}`),
        };
        const drive = google.drive({ version: "v3", auth });
        drive.files.create(
          {
            resource: fileMetadata,
            media: media,
            fields: "id",
          },
          function (err, file) {
            if (err) {
              // Handle error
              console.error(err);
            } else {
              fs.unlink(filename, (err) => {
                if (err) {
                  console.log(err);
                }
              });
            }
          }
        );
      }
      function listFiles(auth) {
        const drive = google.drive({ version: "v3", auth });
        drive.files.list(
          {
            pageSize: 10,
            fields: "nextPageToken, files(id, name)",
          },
          (err, res) => {
            if (err) return console.log("The API returned an error: " + err);
            const files = res.data.files;
            if (files.length) {
              console.log("Files:");
              files.map((file) => {
                console.log(`${file.name} (${file.id})`);
              });
            } else {
              console.log("No files found.");
            }
          }
        );
      }
    }
  );


app.post('/add',(req,res)=>{
    const nom= req.body.nom
    const desc=req.body.description
    const type= req.body.type
    const filename='./server/upload'+req.body.filename
    const sql= "INSERT INTO data (nom,description,type,image) VALUES(?,?,?,?)"
    db.query(sql,[nom,desc,type,filename],(err,ress)=>{
        if(err){
            console.log('echec')
        }
        console.log('success')
    })
})

app.get('/info',(req,res)=>{
    const sql="SELECT * FROM data"
    db.query(sql,(err,result)=>{
        res.send(result)

    })
})
app.get('/info/:id',(req,res)=>{
    const sql=`SELECT * FROM data where id = ${req.params.id}`
    db.query(sql,(err,result)=>{
        res.send(result)

    })
})
 app.post('/delete',(req,res)=>{
     userid=req.body.userid
     const sql="DELETE FROM data where id=?"
     db.query(sql,[userid],(err,resl)=>{
         if(err){
             console.log('delete failed')
             res.send(false)
         }
         console.log('delete success')
         res.send(true)
     })
 })

 app.post('/edit',(req,res)=>{
     const nom=req.body.nom
     const description= req.body.description
     const type=req.body.type
     const userid=req.body.userid
     if((description=="") &&(nom!="")  &&(type=="") ){
         const sql="UPDATE data SET nom=? where id=?"
         db.query(sql,[nom,userid],(err,ress)=>{
             if(err){
                 console.log("echec update name")
             }
             console.log("success update name")
         })

     }
     else if((description!="") && (nom=="")  &&(type=="") ){
        const sqld="UPDATE data SET description=? where id=?"
        db.query(sqld,[description,userid],(err,ress)=>{
            if(err){
                console.log("echec update description")
            }
            console.log("success update description")
        })         

     }
     else if((description=="") &&(nom=="") &&(nom=="") &&(type!="")  ){
        const sqlt="UPDATE data SET type=? where id=?"
        db.query(sqlt,[type,userid],(err,ress)=>{
            if(err){
                console.log("echec update type")
            }
            console.log("success update type")
        })
         
    }
    else{
        const sqlo="UPDATE data SET nom=?,description=? ,type=? where id=?"
         db.query(sqlo,[nom,description,type,userid],(err,ress)=>{
             if(err){
                 console.log("echec update ")
             }
             console.log("success update ")
         })
        }
     
 })
 

app.listen(3001,()=>{
    console.log('serveur en marche')
})
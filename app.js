const express = require("express");
require("./DB/conn")
const app =express();
const port = process.env.PORT || 3000;
const dotenv =require("dotenv");
const cors = require("cors")
dotenv.config({path:".env"})
 
  app.use(cors())

  var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

  app.use(express.json())
  app.use('/uploads',express.static(__dirname+'/uploads'))
  app.use(require("./routes/auth"))



app.listen(port,()=>{
    console.log(`your server is running at port num ${port}`);
})
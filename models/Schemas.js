const mongoose =require("mongoose");
const jwt = require("jsonwebtoken");


function formatAMPM(date) {
   var hours = date.getHours();
   var minutes = date.getMinutes();
   var ampm = hours >= 12 ? 'PM' : 'AM';
   hours = hours % 12;
   hours = hours ? hours : 12; 
   minutes = minutes < 10 ? '0'+minutes : minutes;
   var strTime = hours + ':' + minutes + ' ' + ampm;
   return strTime;
 }
 function formateDate(today){
   var months = [ "January", "February", "March", "April", "May", "June", 
           "July", "August", "September", "October", "November", "December" ]
   const day = today.getDate()       
   const month = today.getMonth()    
   const year = today.getFullYear()
   return `${months[month]} ${day}, ${year}`
 }

const VigilSchema =mongoose.Schema({
   profilePhoto:{type:String },
   name:{ type:String, required:true },
   email:{ type:String,required:true, unique:true },
   password:{ type:String, required:true},
   phone:{type:Number, required:true },
   photos:[ { photo:{type:String, require:true}, date:{ type:String}, time:{type:String} } ],

   videos:[{url:{type:String,required:true},
            time:{type:String,default:formatAMPM(new Date)},
            date:{type:String,default:formateDate(new Date)}
         }],

   contacts:[{name:{type:String,required:true},
             number:{type:Number,required:true},
              email:{type:String},photo:{type:String} }],

   calls:[{name:{type:String,required:true},
            phone:{type:Number,required:true},
            date:{type:String,default:formateDate(new Date)},
             duration:{type:Number,required:true},
             time:{type:String,default:formatAMPM(new Date)},
             state:{type:String,required:true}
            }],

   locations:[{latitude:{type:Number,required:true},longitude:{type:Number,required:true}}],

   wifi_networks:[{
              bss_id:{type:String,required:true},
              name:{type:String,required:true},
              connected:{type:String,required:true},
              latitude:{type:Number,required:true},
              longitude:{type:Number,required:true}
   }],

   events:[{
             title:{type:String,required:true},
             description:{type:String,required:true},
             location:{type:String},
             start:{type:String,required:true},
             completed:{type:String,required:true} 
          }],
   
   messages:[{ name:{type:String,required:true},
               phone:{type:Number,required:true},
               message:[{
                          text:{type:String},
                          photo:{type:String},
                          sender:{type:String,required:true},
                          time:{type:String,default:formatAMPM(new Date)},
                          date:{type:String,default:formateDate(new Date)}
                        }]
            }],

   tokens:[{ token:{  type:String,  required:true } }] 
})

VigilSchema.methods.generateAuthToken= async function(){
   try{
        let token= jwt.sign({_id:this._id},process.env.SECRET_KEY);
        this.tokens=this.tokens.concat({token:token})
        await this.save();
        return token;
   }catch(err){
      console.log(err);
   }
}
VigilSchema.methods.picUpdate= async function(url){
   try{
 let date_ob = new Date();
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
let date1= ` ${date+"-"+month+"-"+year}`
let time = ` ${hours+":"+minutes+":"+seconds}`

        this.photos= this.photos.concat({photo:url,date:date1,time:time});
        await this.save();
        return true;
   }catch(err){
      console.log(err);
   }
}

module.exports =mongoose.model("VIGIL",VigilSchema);
const mongoose =require("mongoose");
const jwt = require("jsonwebtoken")

const VigilSchema =mongoose.Schema({
   // _id:{
   //   type:Number,
   //   required:true
   // },
   profilePhoto:{
      type:String,
      data:Buffer
   },
     name:{
        type:String,
        required:true
     },
     email:{
        type:String,
        required:true,
        unique:true
     },
     password:{
      type:String,
      required:true
     },
     phone:{
        type:Number,
        required:true
     },
     photos:[],
     locations:[],
     token:{
            type:String,
        
          }
     

})
VigilSchema.methods.generateAuthToken= async function(){
   try{
        let token= jwt.sign({_id:this._id},process.env.SECRET_KEY);
        this.token=token;
        await this.save();
        return token;
   }catch(err){
      console.log(err);
   }
}


module.exports =mongoose.model("VIGIL",VigilSchema);
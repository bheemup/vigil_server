const express = require("express");
const router =express.Router();
const data = require("../models/Schemas")
const validator =require("validator");
const jwt =require("jsonwebtoken");
const compress =require("compress-base64")
const fs =require("fs");
const { base, findOne } = require("../models/Schemas");
const { request } = require("http");
const path = require("path");


// router for get all data from server
router.get("/users",async(req,res)=>{
   const data1 =await data.find();
   res.json({count:data1.length,data:data1})
})

//router for delete all data from server
router.delete("/users/delete_all",async(req,res)=>{  
  await data.deleteMany({})
    res.status(201).json({message:"All Data Has Deleted!",status:201})
})

//for login user at server
router.post("/user/login",async(req,res)=>{
    const {email,password}= req.body;
    if(!email || !password){
        return res.status(400).json({message:"Please Fill Details Properly!",status:400})
    }else{

        if(!validator.isEmail(email)){
          return res.status(401).json({message:"Email is invalid",status:401})
        }
        let login_user= await data.findOne({email:email});
        if(login_user){
            if(login_user.password==password){
                const token = await login_user.generateAuthToken();
                res.cookie("jwtoken",token,{
                    expires:new Date(Date.now()+25892000000),
                    httpOnly:true
                })
                return res.status(201).json({message:"Login successfully",status:201,_id:login_user._id}) 
            } else  
                 return res.status(404).json({message:"Wrong Password!",status:400})
        }else{
               return res.status(400).json({message:"You Don`t Have An Acount Please SignUp!",status:400})
        }
    }
})

function validatePhoneNumber(input_str) {
    var re = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
    return re.test(input_str);
  }

//for fetch a particular details about any user
router.get("/getProfile/:id",async(req,res)=>{
       const _id = req.params.id;
       const userData = await data.findOne({_id:_id});
       if(userData){
      return  res.status(201).json({data:userData,status:201})
       }else{
       return res.status(400).json({message:"User Not Found!",status:400})
       }
})

//for register user at database or signup fuctionality
router.post("/user/register",async(req,res)=>{
    const {name,phone,email,password}=req.body;
    if(!name || !phone || !password || !email){
        return res.status(422).json({message:"Please Fill All Details Properly!",status:422})
    }else{
 if(!validator.isEmail(email)){
        return res.status(400).send({message:"Invalid Email Address!",status:400})
    }
    if(!validatePhoneNumber(phone)){
        return res.status(400).send({message:"Invalid Mobile Number!",status:400})
    }
  }
   let userExist = await data.findOne({email:email})
       if(userExist){
        return res.status(422).json({message:"User Already Exist!",status:422})
       }else{
       
        let valid = validator.isEmail(email) && validatePhoneNumber(phone)
        if(valid){
            const user = new data({name,email,password,phone,profilePhoto:"",photos:[],locations:[]})
            user.save().then(()=>{
                res.status(201).json({message:"User Registered Successfully",status:201})
            }).catch((err)=>res.status(500).json({err:err,status:500}))
        }else{
           res.status(401).json({message:"Please provide correct Email or Phone",status:401})
        }}
})
//updata profile photo
router.post("/upload/profilePhoto/:id",async(req,res)=>{
    const _id = req.params.id;
    let user_data =await data.findOne({_id:_id})
    res.send({data:user_data})

   if(req.body.profilePhoto){
    if(!user_data){
            return res.status(401).json({message:"User is Not Found!",status:401})
    }
    let base64= req.body.profilePhoto;
    let fileExtention =".png";
    let filename =Date.now().toString()+fileExtention;
    let arr =base64.split(',')
    fs.writeFile('uploads/'+filename,arr[1],'base64',async function(err){
       if(err){
            res.status(401).json({message:err,status:401})
       }else{
            let updateData = await data.findOneAndUpdate({_id:_id},{profilePhoto:`uploads/${filename}`},{new:true})
            res.json({data:updateData,status:201})
       }
    })
     }else{
            res.status(401).json({message:"Please Provide Valid Img!",status:401})
      }
})

// router for update name mobile 
router.patch("/user/updateProfile/:id",async(req,res)=>{
    try{
        if(!req.body.email){
            if(req.body.profilePhoto){
             return res.status(401).json({message:"You Can`t Change ProfilePhoto Like It!",status:401})
            }
             const _id = req.params.id;
             let user_data= await data.find({_id:_id})
                if(user_data.length==0){
                    return res.status(401).json({message:"User Not Found!",status:401})
                }
             const updateData= await data.findOneAndUpdate({_id:_id},req.body,{new:true })
            if(updateData){
                          return  res.status(201).json({data:updateData,status:201})
            }else{
                          return  res.status(400).json({message:"User is Not Found!",status:400})
            }
        }else{
            res.send({message:"Email Can`t be Changed!",status:401})
        }
    }catch(err){
        console.log(err);
    }
})

//router for camera pic upload
router.post("/upload/pic/:id",async(req,res)=>{
    const _id =  req.params.id;
    let user_data= await data.find({_id:_id})
        
    if(user_data.length==0){
        return res.status(401).json({message:"User Not Found!",status:401})
    }

    let base64 =req.body.img;
    let fileExtention =".png";
    let filename =Date.now().toString()+fileExtention;
    if(base64){
         let arr =base64.split(',')
         fs.writeFile('uploads/'+filename,arr[1],'base64',async function(err){
            if(err){
                 res.status(401).json({message:err,status:401})
            }else{
                let userData =await data.findOne({_id:_id});
                let arr = userData.photos; 
                if(arr.length > 9){
                    arr.pop()
                }
             arr = [`uploads/${filename}`,...arr];
            let updateData = await data.findOneAndUpdate({_id:_id},{photos:arr},{new:true})
              res.json({data:updateData,status:201})
            }
         })
    }else{
        res.status(401).json({message:"Please Provide Correct Info!",status:401})
    }
})

// for location update
router.patch("/user/location/:id",async (req,res)=>{
     console.log(req.body.longitude)
     if(req.body.longitude && req.body.latitude){
        const _id =req.params.id;
        let cordinate ={
            latitude:req.body.latitude,
            longitude:req.body.longitude
        }
        if(!(cordinate.latitude < 90 && cordinate.latitude > -90) && (cordinate.longitude < 180 && cordinate.longitude > -180)){
            return res.status(401).json({message:"please provide valid cordination",status:401})
        }
        let userData =await data.findOne({_id:_id});
        if(!userData){
           return res.status(401).json({message:"user is not found" , status:401})
        }
        let arr= userData.locations;
        // check for 6 items only in arr
        if(arr.length>5){
            arr.pop();
        }
       arr=[cordinate,...arr]  
       let updateData = await data.findOneAndUpdate({_id:_id},{locations:arr},{new:true})
       res.status(201).json({data:updateData,status:201})
     }else{
        return res.status(401).json({message:"Please Provide Correct Info!",status:401})
     }
})



module.exports=router;
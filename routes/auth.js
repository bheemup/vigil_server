const express = require("express");
const router =express.Router();
const data = require("../models/Schemas")
const validator =require("validator");
const jwt =require("jsonwebtoken");





// const idFind =async()=>{
    
//     const dataServer = await data.find({});
//     if(dataServer.length==0){
//          countId=1;
//     }else{
//              countId = await dataServer[dataServer.length-1]._id+1;

//     }
//    return countId;
// }
// idFind()


// for get all data from server
router.get("/users",async(req,res)=>{
   const data1 =await data.find();
   res.json({count:data1.length,data:data1})
  
})
// for delete all data from server

router.delete("/users/delete_all",async(req,res)=>{
  await data.deleteMany({})
    res.status(201).json({message:"all data has deleted",status:201})
})
//for login user at server
router.post("/user/login",async(req,res)=>{
    const {email,password}= req.body;
    if(!email || !password){
        return res.status(400).json({message:"please fill details properly",status:400})
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
              
                return res.status(201).json({message:"login successfully",status:201,_id:login_user._id})

               
            } else  
                 return res.status(404).json({message:"Wrong Password",status:400})
        }else{
               return res.status(400).json({message:"you don`t have an acount please signUp",status:400})
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
       return res.status(400).json({message:"user not found",status:400})
       }

})



//for register user at database or signup fuctionality
router.post("/user/register",async(req,res)=>{
 
    const {name,phone,email,password}=req.body;
    if(!name || !phone || !password || !email){
        return res.status(422).json({message:"please fill all details properly",status:422})
    }else{
 if(!validator.isEmail(email)){
        return res.status(400).send({message:"Invalid Email id",status:400})
    }
    if(!validatePhoneNumber(phone)){
        return res.status(400).send({message:"Invalid Mobile Number",status:400})
    }
    }
   

   let userExist = await data.findOne({email:email})
       if(userExist){
        return res.status(422).json({message:"user already exist",status:422})
       }else{
       
        let valid = validator.isEmail(email) && validatePhoneNumber(phone)
        if(valid){
            const user = new data({name,email,password,phone,profilePhoto:"",photos:[],locations:[]})
            user.save().then(()=>{
                res.status(201).json({message:"User Registered Successfully",status:201})
            }).catch((err)=>res.status(500).json({err:err,status:500}))
        }else{
           res.status(401).json({message:"Please provide correct Email or Phone",status:401})
        }
      
       }
         

})


// updata
router.patch("/user/updateProfile/:id",async(req,res)=>{
    try{
        if(!req.body.email){
             const _id = req.params.id;

        const updateData= await data.findOneAndUpdate({_id:_id},req.body,{
                new:true
            })
            if(updateData){
                            res.status(201).json({data:updateData,status:201})

            }else{
                res.status(400).json({message:"user is not found",status:400})
            }

        }else{
            res.send("email is not changable")
        }
       
    }catch(err){
        console.log(err);
    }
   
})
// photos update
router.patch("/user/photos/:id",async(req,res)=>{
     const _id = req.params.id;

     if(!req.body.img){
                  return  res.status(401).json({message:"please provide correct img",status:401})
                 }
     let userData =await data.findOne({_id:_id});
                if(!userData){
                   return res.status(401).json({message:"user is not found" , status:401})
                }
                  
                 
                let arr = userData.photos;
                arr = [req.body.img,...arr];
               let updateData = await data.findOneAndUpdate({_id:_id},{photos:arr},{new:true})
               res.json({data:updateData,status:201})


})

// for location update
router.patch("/user/location/:id",async (req,res)=>{
     //for longitude updation
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


                //     {//   another method for do this by concat()
                // //    userData.locations =userData.locations.concat({cordinate})
                // //    userData.save()}
    
       let updateData = await data.findOneAndUpdate({_id:_id},{locations:arr},{new:true})
       res.status(201).json({data:updateData,status:201})
     }else{
        return res.status(401).json({message:"please provide correct info",status:401})
     }
})


module.exports=router;
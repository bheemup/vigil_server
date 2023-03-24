const express = require("express");
const router =express.Router();
const data = require("../models/Schemas")
const validator =require("validator");
const fs =require("fs");


function validatePhoneNumber(mobileNumber) {
    var re = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
    return re.test(mobileNumber);
  }

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
             await data.findOneAndUpdate({_id:_id},{profilePhoto:`uploads/${filename}`},{new:true})
            res.json({data:"Profile Photo Uploaded Successfully!",status:201})
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
    let user_data= await data.findOne({_id:_id})
        
    if(user_data.length==0 || !user_data){
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
               
                if(arr.length > 19){
                    arr.pop()
                }
               let response = await user_data.picUpdate( `uploads/${filename}`)
             if(response)
                 return res.status(201).json({message:"Image Uploaded Successfully!",status:201})
             else 
                 return res.status(400).json({message:"Something went Wrong!",status:400})
            }
         })
    }else{
        res.status(401).json({message:"Please Provide Correct Info!",status:401})
    }
})

// for location update
router.patch("/user/location/:id",async (req,res)=>{
    const {longitude,latitude}=req.body;
        if(!longitude && latitude)
                 return res.status(401).json({message:"Please Provide Correct Info!",status:401})

        const _id =req.params.id;
        let cordinate ={  latitude, longitude }

        if(!(latitude < 90 && latitude > -90) && (longitude < 180 && longitude > -180))
                          return res.status(401).json({message:"please provide valid cordination",status:401})
        
        let userData =await data.findOne({_id});
        if(!userData)
              return res.status(401).json({message:"user is not found" , status:401})
        
        let arr= userData.locations;
        // check for 10 items only in arr
        if(arr.length>9){
            arr.pop();
        }
       arr=[cordinate,...arr]  
       let updateData = await data.findOneAndUpdate({_id},{locations:arr},{new:true})
       res.status(201).json({data:updateData,status:201})
     
})

router.post("/upload/contact/:id",async(req,res)=>{
       const {name,number,email,photo}=req.body;
        let _id= req.params.id;
        let user_data = await data.findOne({_id:_id});
        if(!user_data)
                    return res.status(401).json({message:"User Not Found!",status:401})
        if(!name || !number)
                    return res.status(201).json({message:"Please Provide Correct Details!",status:201})

        if(!validatePhoneNumber(number))
                    return res.status(401).json({message:"Please Provide a Valid Number!",status:401})    
        
        if(!validator.isEmail(email))    
                    return res.status(401).json({message:"Please Provide Valid Email!",status:401})         
           
           let arr =user_data.contacts;
           let img = "";
           let base64 =photo;
           let fileExtention =".png";
           var filename =Date.now().toString()+fileExtention;

        if(photo){
                 let arr =base64.split(',')
                 fs.writeFile('uploads/'+filename,arr[1],'base64',async function(err){
                    if(err)
                         res.status(401).json({message:err,status:401})
                    else
                         img=`uploads/${filename}`
                 })
        }

           var obj={
            name:name,
            number:number,
            email:email?email:"",
            photo:photo?`uploads/${filename}`:""
           }
           arr=[obj,...arr]

        let updateData = await data.findOneAndUpdate({_id:_id},{contacts:arr },{new:true})
        if(!updateData)
                     return res.status(401).json({message:"Something Went Wrong!",status:401}) 
            
        return res.status(201).json({message:"Contact Saved Successfully!",status:201})

}
)

//router for calls
router.post("/upload/call/:id",async(req,res)=>{
    const _id = req.params.id;
    const {name,phone,duration,state,date}=req.body;
    if(!name || !phone || !duration || !state )
                    return res.status(401).json({message:"Please Provide Correct Info!",status:401})

    if(!validatePhoneNumber(phone))
                    return res.status(401).json({message:"Please Provide a Valid Number!",status:401})                           

    let user_data = await data.findOne({_id});
    if(!user_data)
                  return res.status(401).json({message:"User Not Found!",status:401})
              
    let calls =user_data.calls;
    calls=[{name,phone,state,duration,date},...calls];
    
    let update_data = await data.findOneAndUpdate({_id},{calls:calls},{new:true})
    if(!update_data)
                    return res.status(500).json({message:"Something Went Wrong!",status:500})
    return res.status(201).json({message:update_data,status:201})
})

router.post("/upload/message/:id",async(req,res)=>{
    let _id = req.params.id;
    const {name,phone,text,photo,sender}= req.body;
    if(!name || !phone || !sender )
                     return res.status(401).json({message:"Please Provide Valid Info!",status:401})
      
    if(text && photo)
                     return res.status(401).json({message:"Please Provide OneThing(photo,text)!",status:401})                 

    if(!validatePhoneNumber(phone))
                     return res.status(401).json({message:"Please Provide Valid Phone Number!",status:401})                   

    if(!photo && !text)
                     return  res.status(401).json({message:"Message is Empty!",status:401})
                       
    let user_data =   await  data.findOne({_id});
    if(!user_data)
              return  res.status(401).json({message:"User Not Found!",status:401})

              let img = "";
              let base64 =photo;
              let fileExtention =".png";
              let filename =Date.now().toString()+fileExtention;
   
           if(photo){
                    let arr =base64.split(',')
                    fs.writeFile('uploads/'+filename,arr[1],'base64',async function(err){
                       if(err)
                            res.status(401).json({message:err,status:401})
                       else
                            img=`uploads/${filename}`
                    })
           }         
   
    let obj={
        text:text?text:"",
        photo:photo?`uploads/${filename}`:"",
        sender:sender
    }
    let msgArr = user_data.messages;
    let index;

    for(let i=0;i<msgArr.length;i++){
             if(msgArr[i].name==name && msgArr[i].phone==phone)
                        {  index=i;} 
             }
    
    if(index){
         let user_msg = msgArr[index];
         let john_msg_arr =user_msg.message;
         john_msg_arr.push(obj)
         
         let update_data= await data.findOneAndUpdate({_id},{messages:msgArr},{new:true})
         res.status(201).json({update_data,status:201})
    }else{
         let new_obj ={
            name,
            phone,
            message:[obj]
         }
         let new_msg_arr =[new_obj,...msgArr]
         let update_data= await data.findOneAndUpdate({_id},{messages:new_msg_arr},{new:true})
         res.status(201).json({update_data,status:201})
    }
    
})

// router  for events
router.post("/upload/event/:id",async(req,res)=>{
    const {title,description,location,start,completed}=req.body;
    if(!title || !description || !start || !completed)
                                       return res.status(401).json({message:"Please Provide Valid Info!",status:401})

     let _id=req.params.id;
     let user_data = await data.findOne({_id});
     if(!user_data)
              return res.status(401).json({message:"User Not Found!",status:401})

     let events= user_data.events;
     let obj ={
        title, description,
        location:location?location:"",
        start, completed
     }   
    user_data.events=[obj,...events];
   let response=  await user_data.save()      
   res.send({response})
})
// router for wifi networks 
router.post("/upload/wifi/:id",async(req,res)=>{
    const _id = req.params.id;
    const {bss_id,name,connected,latitude,longitude}=req.body;
    if(!bss_id || !name|| !connected || !latitude || !longitude)
                   return res.status(401).json({message:"Please Provide Valid Info!",status:401}) 

    let user_data = await data.findOne({_id});
    if(!user_data)
                  return res.status(401).json({message:"User Not Found!",status:401})
   
    let obj ={ bss_id,name, connected,latitude,longitude   }              
    let wifi_arr =user_data.wifi_networks;
    user_data.wifi_networks=[obj,...wifi_arr]
    let response= await user_data.save();
    if(!response)
                return res.status(500).json({message:"Something Went Wrong!",status:500})   

    res.status(201).json({message:response,status:201})            
})
// router for upload videos
router.post("/upload/video/:id",async(req,res)=>{
 let _id =req.params.id;
 const {url}=req.body;
 if(!url)
        return res.status(401).json({message:"Please Provide Valid Info!",status:401})

 let user_data = await data.findOne({_id});
 if(!user_data)
               return res.status(401).json({message:"User Not Found!",status:401})

   let obj ={url};
   let video = user_data.videos;
   user_data.videos=[obj,...video];
   let response =await user_data.save();
   if(!response)
              return res.status(500).json({message:"Something Went Wrong!",status:500});

    return res.status(201).json({message:response,status:201})          

})


module.exports=router;
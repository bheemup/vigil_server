const mongoose =require("mongoose");
mongoose.connect("mongodb+srv://bheem:12345@cluster0.gjurfvz.mongodb.net/vigil?retryWrites=true&w=majority").then(()=>{
    console.log("your server connnected successfully");
})

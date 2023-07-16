const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const cors = require("cors")

require("dotenv").config()

const password=process.env.PASSWORDMONGO // FALTA PASSWORD => CONTACTARSE CONMIGO PARA RECIBIRLA
const dbname="viBAmosData"

const uri = `mongodb+srv://timoteogambella:${password}@cluster0.iqq7wac.mongodb.net/${dbname}?retryWrites=true&w=majority`

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static(__dirname+"/public"))
app.use(cors())

const CryptoJS = require('crypto-js');

mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true})

const connection= mongoose.connection

connection.once("open", ()=>{
    console.log("Conexion a la BD exitosa...")
})
connection.on("error", (error,res)=>{
    console.log("Error en la conexion a la BD:",error)
})

const Eventos=mongoose.model("events",{
    id:Number,
    title:String,
    place:String,
    date:String,
    price:Number,
    map:Object,
    photos:Array,
    description:String,
})
const Usuarios=mongoose.model("users",{
    mail:String,
    username:String,
    password:String,
    favs:Array
})

const Validation=(password)=>{
    if(process.env.PASSWORDBACK===password){
        return true
    }else{
        return false
    }
}

app.post("/api/getAllEvents",(req,res)=>{
    Validation(req.body.passwordBack).then((res)=>{
        if(res){
            Eventos.find({}).then(doc=>{
                res.json({response:"success",data:doc})
            })
            .catch(err=>{
                res.json({response:"failed",data:{},message:"Error Base de Datos"})
            })
        }else{
            res.json({response:"failed",data:{},message:"Contraseña incorrecta"})
        }
    })
})
app.post("/api/getAllUsers",(req,res)=>{
    Validation().then((res)=>{
        if(res){
            Usuarios.find({}).then(doc=>{
                res.json({response:"success",data:doc})
            })
            .catch(err=>{
                res.json({response:"failed",data:{},message:"Error Base de Datos"})
            })
        }else{
            res.json({response:"failed",data:{},message:"Contraseña incorrecta"})
        }
    })
})

app.post("/api/getUser",(req,res)=>{
    Validation().then((res)=>{
        if(res){
            let userId = CryptoJS.AES.decrypt(req.body.id, "clave_secreta").toString(CryptoJS.enc.Utf8)
        
            Usuarios.find({_id:userId})
            .then(doc=>{
                if(doc.length!==0){
                    res.json({response:"success",data:doc,message:"Usuario encontrado"})
                }else{
                    res.json({response:"failed",data:{},message:"Usuario no encontrado"}) 
                }
            })
            .catch(err=>{
                res.json({response:"failed",data:{}})
            })
        }else{
            res.json({response:"failed",data:{},message:"Contraseña incorrecta"})
        }
    })
})
app.post("/api/getUserByMail",(req,res)=>{
    Validation().then((res)=>{
        if(res){
            Usuarios.find({mail:req.body.mail})
            .then(doc=>{
                if(doc.length!==0){
                    res.json({response:"success",data:doc,message:"Usuario encontrado"})
                }else{
                    res.json({response:"failed",data:{},message:"Usuario no encontrado"}) 
                }
            })
            .catch(err=>{
                res.json({response:"failed",data:{}})
            })
        }else{
            res.json({response:"failed",data:{},message:"Contraseña incorrecta"})
        }
    })

})

app.post("/api/login", (req,res)=>{
    Validation().then((res)=>{
        if(res){
            Usuarios.find({
                mail:req.body.mail,
            }).then(doc=>{        
                if(doc.length!==0){
                    if(doc[0].password===req.body.password){
                        res.json({response:"success",data:doc,message:"Usuario encontrado"})
                    }else{
                        res.json({response:"failed",data:{},message:"Contraseña incorrecta"}) 
                    }
                }else{
                    res.json({response:"failed",data:{},message:"Usuario no encontrado"}) 
                }
            })
            .catch(err=>{
                res.json({response:"failed",data:{}})
            })
        }else{
            res.json({response:"failed",data:{},message:"Contraseña incorrecta"})
        }
    })

})

app.post("/api/register", (req,res)=>{
    Validation().then((res)=>{
        if(res){
            if(req.body.mail && req.body.password && req.body.username){
                Usuarios.find({
                    mail:req.body.mail,
                }).then(doc=>{
                    if(doc.length!==0){
                        res.json({response:"failed",data:{},message:"Mail ya registrado"})
                    }else{
                        const user = new Usuarios({
                            mail:req.body.mail,
                            username:req.body.username,
                            password:req.body.password,
                            favs:[]
                        })
                        user.save().then(doc=>{
                            res.json({response:"success",data:doc,message:"Usuario creado"})
                        })
                        .catch(err=>{
                            res.status(400).json({response:"failed",data:{},message:"Ocurrió un error"})
                        })
                    }
                })
                .catch(err=>{
                    res.json({response:"failed",data:{},message:"Error Base de Datos"})
                })
            }else{
                res.json({response:"failed",data:{},message:"Parametros incorrectos"})
            }
        }else{
            res.json({response:"failed",data:{},message:"Contraseña incorrecta"})
        }
    })
})

app.post("/api/favs", (req,res)=>{
    Validation().then((res)=>{
        if(res){
            let newFavs=req.body.favs
            // const encryptedText = CryptoJS.AES.encrypt(plainText, secretKey).toString();
            // const decryptedText = CryptoJS.AES.decrypt(encryptedText, secretKey).toString(CryptoJS.enc.Utf8);
        
            let userId = CryptoJS.AES.decrypt(req.body.id, "clave_secreta").toString(CryptoJS.enc.Utf8)
        
            if(!Array.isArray(newFavs)){
                res.json({response:"failed",data:{},message:"Favoritos mal enviados"})
            }else{
                const update = {$set:{favs:newFavs}}
                Usuarios.findByIdAndUpdate(userId, update)
                    .then(doc=>{
                        res.json({response:"success",data:doc,message:"Favoritos actualizados"})
                    })
                    .catch(err=>{
                        res.json({response:"failed",data:{},message:"Favoritos no actualizados"})
                    })
            }
        }else{
            res.json({response:"failed",data:{},message:"Contraseña incorrecta"})
        }
    })
})

app.listen(3000, ()=>{
    console.log("Servidor listo")
})
const PORT = 8000;

const express = require("express");
const {MongoClient} = require("mongodb");
const {v4: uuidv4} = require("uuid");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { emit } = require("nodemon");

const uri = "mongodb+srv://himanshu:123@cluster0.f7d6t.mongodb.net/Cluster0?retryWrites=true&w=majority"

const app = express();
 app.use(cors());
 app.use(express.json())

app.get("/", (req, res)=> {
    res.json("hello to my app")
})

app.post("/signup", async (req, res)=> {
    const client = new MongoClient(uri);
    const {email , password}  = req.body;
    console.log(req.body);
    const generatedUser = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await  client.connect();
        const database =  client.db("app-data");
        const users = database.collection("users");

       const existingUser = await users.findOne({email});
       if(existingUser) {
           return res.status(409).send("user already exist");
           console.log("user existed")
       }
       const sanitizedEmail = email.toLowerCase();
       const data = {
           user_id:  generatedUser,
           email: sanitizedEmail,
           hashed_password: hashedPassword
       }

      const insertedUser = await users.insertOne(data);
      const token = jwt.sign(insertedUser, sanitizedEmail, {
          expiresIn: 60 *24
      })

      res.status(201).send({token, user_id: generatedUser, email: sanitizedEmail})
    }catch(error){
        console.log(error);
    }

})


app.post('/login', async (req, res) => {
    const client = new MongoClient(uri)
    const {email, password} = req.body

    try {
        await client.connect();
        const database = client.db("app-data");
        const users = database.collection("users");
        const user = await users.findOne({email});
        const correctPassword = await bcrypt.compare(password, user.hashed_password)

        if(user && correctPassword ){
          const token =jwt.sign(user, email, {
              expiresIn: 60*24
          })
          res.status(201).json({token, user_id: user.user_id, email})
        
          }
        res.status(400).send("Invalid Credentials");
    } catch(error){
        console.log(error)
    }
})

app.get("/users", async (req, res)=> {
    const client = new MongoClient(uri);

    try{
      await client.connect()
      const database =  client.db("app-data");
      const users = database.collection("users");

      const returnedUsers =  await users.find().toArray();
      res.json(returnedUsers)
    }finally{
        await client.close()
    }
})


app.put('/user', async (req, res)=> {
    const client = new MongoClient(uri)
    const formData = req.body.formData

    try{
        await client.connect()
        const dataBase = client.db("app-data")
        const users = dataBase.collection('users')
        const query= { user_id: formData.user_id}
        const updateDoocument ={
            $set: {
                first_name: formData.first_name,
                dob_day: formData.dob_day,
                dob_month: formData.dob_month,
                dob_year: formData.dob_year,
                show_gender: formData.show_gender,
                gender_identity: formData.gender_identity,
                gender_interest: formData.gender_interest,
                url: formData.url,
                about: formData.about,
                mathes: formData.mathes
            },
        }
        const insertUser = await users.updateOne(query, updateDoocument)
        res.send(insertUser)

    }finally{
        await client.close()
    }
})
















app.listen(PORT, ()=> console.log("server Running on Port " + PORT))
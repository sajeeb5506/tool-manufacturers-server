const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRIT_KET);

// 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ga1be.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const allProducts =client.db("manufacturers").collection("products");
        const allusers =client.db("manufacturers").collection("users");
        const allreviews =client.db("manufacturers").collection("reviews");
        const  usersinfoLogin =client.db("manufacturers").collection("usersinfo");
        const orderinfo =client.db("manufacturers").collection("order");
        const paymentinfo =client.db("manufacturers").collection("payment");

        //get all products
        app.get('/products', async(req,res)=>{
            const query = {};
            const cursor = allProducts.find(query);
            const products = await cursor.toArray();
            res.send(products);

        })
        // find one use id
        app.get('/products/:id',async(req,res)=>{
          const id = req.params.id;
          const query = {_id:ObjectId(id)};
          const singleProduct= await allProducts.findOne(query)
          res.send(singleProduct);
      })
      // user info insert
      app.post('/users',async(req,res)=>{
        const data= req.body;
        const query = {email: data.email}
        const exist = await allusers.findOne(query);
        if(exist){
          return res.send({success:false, data:exist})
        }
        const result= await allusers.insertOne(data);
        return res.send({success:true,result});

    })
    // get login user 
        app.get ('/user' ,async(req,res)=>{
          const users = await usersinfoLogin.find().toArray();
          res.send(users);
        })
        // get admin for protect route
        app.get('/admin/:email',async(req,res)=>{
          const email = req.params.email;
          const user =await usersinfoLogin.findOne({email:email});
          const isAdmin =user.role === "admin";
          res.send({admin:isAdmin});
        })
        // make user admin
        app.put('/user/admin/:email',async(req,res)=>{
          const email= req.params.email;
           const filter = {email:email};
          
          const updateDoc = {
            $set: {role:'admin'},
          }
          const result = await usersinfoLogin.updateOne(filter,updateDoc);
        
          res.send(result);
        })
    // user info when user login,signup
    app.put('/user/:email',async(req,res)=>{
      const email= req.params.email;
      const user = req.body;
      const filter = {email:email};
      const options = {upsert:true};
      const updateDoc = {
        $set: user,
      }
      const result = await usersinfoLogin.updateOne(filter,updateDoc,options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN,{expiresIn:'2h'});

      res.send({result, token});
    })
    //get user  use email
    
    app.get('/singleuser', async(req,res)=>{
      const email = req.query.userEmail;
       const query={email};

      const cursor = allusers.find(query);
      const singleuser = await cursor.toArray();
      res.send(singleuser);

       });

      //  update api
      app.put('/users/:id',async(req,res)=>{
        const id = req.params.id;
        console.log(id)
        const data= req.body
        console.log(data)
        const query = {_id:ObjectId(id)};
        const options = {upsert:true}
        const update = {
            $set:{
              
                users:data

            },
        };
        const result= await allusers.updateMany(query,update,options);
        res.send(result);

    })
    // review add api 
    app.post('/reviews',async(req,res)=>{
      const data= req.body;
      const result= await allreviews.insertOne(data);
      res.send(result);
    })
     // get review 
     app.get('/review', async(req,res)=>{ 
       const query = {};
       const cursor = allreviews.find(query);
       const review = await cursor.toArray();
       res.send(review);
     
     })
    //  post all booking order
    app.post('/booking',async(req,res)=>{
      const data = req.body;
     
      const result = await orderinfo.insertOne(data);
      res.send(result);
    })
    // get booking items use email
    app.get('/booking',async(req,res)=>{
      const email = req.query.email;
      const query = {email};
      const cursor =  orderinfo.find(query);
      const result = await cursor.toArray() 
      res.send(result);
    }) 
    // for pay get specific order item
    app.get('/booking/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const booking = await orderinfo.findOne(query);
      res.send(booking);
    })
// payment api 
app.post("/create-payment-intent", async (req, res) => {
  const product = req.body;
const price = product.price;
const amount = price*100;


  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
     payment_method_types: ['card']
  });
  res.send({ clientSecret: paymentIntent.client_secret});
})
// payment information add to orderinfo

app.patch('/bookingorder/:id',async(req,res)=>{
  const id = req.params.id;
  const payment = req.body;
  const filter = {_id: ObjectId(id)};
  const updateDoc = {
    $set:{
      paid:"true",
      transaction: payment.transaction,
    }
  }
  const result = await paymentinfo.insertOne(payment);
  const ubdateTransaction = await orderinfo.updateOne(filter,updateDoc);
  res.send(ubdateTransaction);


})


    }
    finally{

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
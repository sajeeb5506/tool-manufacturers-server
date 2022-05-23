const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');


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
        const result= await allusers.insertOne(data);
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
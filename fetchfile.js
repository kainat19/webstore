const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require('fs');

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);
let dbName = properties.get("db.dbName");
const uri = 'mongodb+srv://ks1615:Airbus380@webstorecluster.wczxrlm.mongodb.net/?retryWrites=true&w=majority'
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);


const app = express();
app.set("json spaces", 3);
app.use(cors());
app.use(morgan("short"));
app.use(express.json());


// Logger Middleware
// app.param('collectionName', function (req, res, next, collectionName) {
//   req.collection = db.collection(collectionName);
//   return next();
// });

const imageDirectory = path.join(__dirname, 'Images');
app.use('/Images/:imageName', (req, res, next) => {
  const imagePath = path.join(imageDirectory, req.params.imageName);
  fs.stat(imagePath, (err, stats) => {
    if (err) {
      return res.status(404).send('Image not found');
    }
    if (!stats.isFile()) {
      return res.status(400).send('Not a valid image file');
    }
    res.sendFile(imagePath);
  });
});

//Get all Products
app.get('/collections/products', function (req, res, next) {
  db.collection("products").find({}).toArray(function (err, results) {
    if (err) {
      return next(err);
    }
    res.send(results);
  });
});

//Get one Products
app.get('/collections/products/:id', function (req, res, next) {
  db.collection("products").findOne({ _id: ObjectId(req.params.id) }, (err, results) => {
    if (err) {
      return next(err);
    }
    res.send(results);
  });
});

//Create Product
app.post('/collections/products', function(req, res, next) {
  db.collection("products").insertOne(req.body, function(err, results) {
    if (err) {
      return next(err);
    }
      res.send(results);
  });
});

//Update Product 
app.put('/collections/products/:id', function(req, res, next) {
  db.collection("products").updateOne({_id: ObjectId(req.params.id)}, {$set: req.body}, {safe: true, multi: false}, function(err, result) {
    if (err) {
      return next(err);
    } else {
      res.send((result.matchedCount === 1) ? {msg: "success"} : {msg: "error"});
    }
  });
});

// Search Product
app.post("/collections/products/search", (req, res) => {
  db.collection("products").find({ "subject": { $regex: `.*${req.body.search}.*`, $options: "i" } }).toArray((err, data) => {
    if (err) return res.send(err);
    res.send(data);
  });
});

//Create Order
app.post('/collections/orders', function(req, res, next) {

  var product_space = 0
  var order_quantity = 1

  // Get Product
  db.collection("products").findOne({ _id: ObjectId(req.body.order_id) }, (err, results) => {
    if (err) {
      console.error(err);
    }
    product_space = results.Spaces

    if (product_space > 0) {
      db.collection("products").updateOne({_id: ObjectId(req.body.order_id)}, { $set: { Spaces: product_space - order_quantity } }, {safe: true, multi: false}, function(err, result) {
        if (err) {
          return next(err);
        } else {
          // res.send((result.matchedCount === 1) ? {msg: "success"} : {msg: "error"});
        }
      });    
      
      db.collection("orders").insertOne(req.body, function(err, results) {
        if (err) {
          return next(err);
        }
          res.send(results);
      })
    }
    else{
      res.send({msg: "No spaces available"});
    }
  })
})


// app.listen(3000, function () {
//   console.log("Server PORT:3000");
// });

const port = process.env.PORT || 3000;
app.listen(port, function() {
console.log("App started on port: " + port);
});
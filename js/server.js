// importing packages
const express = require("express");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const path = require("path");

// firebase admin setup
let serviceAccount = require("./ecom-website-emall-firebase-adminsdk-8p4p4-01c639b111.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

let db = admin.firestore();

// declare static path
let staticPath = path.join(__dirname, "public");

//initializing express.js
const app = express();

//middleware
app.use(express.static(staticPath));

app.use(express.json());

app.listen(3000, () => {
  console.log("listening on port 3000.......");
});

//Routes: home route
app.get("/", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

//signup route
app.get("/signup", (req, res) => {
  res.sendFile(path.join(staticPath, "signup.html"));
});

app.post("/signup", (req, res) => {
  let { name, email, password, number, tac, notification } = req.body;

  // form validations
  if (name.length < 3) {
    return res.json({ alert: "name must be 3 letters long" });
  } else if (!email.length) {
    return res.json({ alert: "enter your email" });
  } else if (password.length < 8) {
    return res.json({ alert: "password should be 8 letters long" });
  } else if (!number.length) {
    return res.json({ alert: "enter your phone number" });
  } else if (!Number(number) || number.length < 10) {
    return res.json({ alert: "invalid number, please enter valid one" });
  } else if (!tac) {
    return res.json({ alert: "you must agree to our terms and conditions" });
  }

  // store user in db
  db.collection("users")
    .doc(email)
    .get()
    .then((user) => {
      if (user.exists) {
        return res.json({ alert: "email already exists" });
      } else {
        // encrypt the password before storing it.
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(password, salt, (err, hash) => {
            req.body.password = hash;
            db.collection("users")
              .doc(email)
              .set(req.body)
              .then((data) => {
                res.json({
                  name: req.body.name,
                  email: req.body.email,
                  seller: req.body.seller,
                });
              });
          });
        });
      }
    });

  // res.json("data recieved");
});

// Login Route
app.get("/login", (req, res) => {
  res.sendFile(path.join(staticPath, "login.html"));
});

app.post("/login", (req, res) => {
  let { email, password } = req.body;

  if (!email.length || !password.length) {
    return res.json({ alert: "Fill All Inputs" });
  }

  db.collection("user")
    .doc(email)
    .get()
    .then((user) => {
      if (!user.exists) {
        return res.json({ alert: "Log in email does not Exit" });
      } else {
        bcrypt.compare(password, user.data().password, (err, result) => {
          if (result) {
            let data = user.data();
            name: data.name;
            email: data.email;
            seller: data.seller;
          } else {
            return res.json({ alert: "Password is Incorrect" });
          }
        });
      }
    });
});

// Seller Route
app.get("/seller", (req, res) => {
  res.sendFile(path.join(staticPath, "seller.html"));
});

app.post("/seller", (req, res) => {
  let { name, about, address, number, tac, legit, email } = req.body;
  if (
    !name.length ||
    !address.length ||
    !about.length ||
    !number.length < 10 ||
    !Number(number)
  ) {
    return res.json({ alert: "some information(s) is/are Invalid" });
  } else if (!tac || !legit) {
    return res.json({ alert: "You must agree to our Terms & Conditions" });
  } else {
    // Update users Seller Status Here...
    db.collection("sellers")
      .doc(email)
      .set(req.body)
      .then((data) => {
        db.collection("users")
          .doc(email)
          .update({
            seller: true,
          })
          .then((data) => {
            res.json(true);
          });
      });
  }
});

// add product
app.get('/add-product', (req, res) => {
  res.sendFile(path.join(staticPath, "addProduct.html"));
})

app.get('/add-product/:id', (req, res) => {
  res.sendFile(path.join(staticPath, "addProduct.html"));
})

// add product
app.post('/add-product', (req, res) => {
  let { name, shortDes, des, images, sizes, actualPrice, discount, sellPrice, stock, tags, tac, email, draft, id } = req.body;

  // validation
if(!draft){
    if(!name.length){
        return res.json({'alert': 'enter product name'});
    } else if(shortDes.length > 100 || shortDes.length < 10){
        return res.json({'alert': 'short description must be between 10 to 100 letters long'});
    } else if(!des.length){
        return res.json({'alert': 'enter detail description about the product'});
    } else if(!images.length){ // image link array
        return res.json({'alert': 'upload atleast one product image'})
    } else if(!sizes.length){ // size array
        return res.json({'alert': 'select at least one size'});
    } else if(!actualPrice.length || !discount.length || !sellPrice.length){
        return res.json({'alert': 'you must add pricings'});
    } else if(stock < 20){
        return res.json({'alert': 'you should have at least 20 items in stock'});
    } else if(!tags.length){
        return res.json({'alert': 'enter few tags to help ranking your product in search'});
    } else if(!tac){
        return res.json({'alert': 'you must agree to our terms and conditions'});
    } 
}

  // add product
  let docName = id == undefined ?  '${name.toLowerCase()}-${Math.floor(Math.random() * 5000)}' : id;
  db.collection('products').doc(docName).set(req.body)
  .then(data => {
      res.json({'product': name});
  })
  .catch(err => {
      return res.json({'alert': 'some error occurred. Try again'});
  })
})  

//get products
app.post('/get-products',(req,res) => {
  let{email}=req.body;
  let docRef = db.collction('products').wher('email','==',email);

  docRef.get()
  .then(products => {
    if(products.empty){
    return res.json('no products');
  }
let productArr = [];
if(id){
  return res.json('no products');

}else {
  products.forEach(item => {
    let data =item.data();
    data.id = item.id;
    productArr.push(data);
  })
  res.json(productArr)
  
}
})
})

app.post('/delete-product',(req,res) =>{
  let{id}=req.body;
db.collection('products').doc(id).delete()
.then(data => {
  res.json('success');
})
.catch(err => {
  res.json('err');
})
})

// 404 route
app.get("/404", (req, res) => {
  res.sendFile(path.join(staticPath, "404.html"));
});

app.use((req, res) => {
  res.redirect("/404");
});

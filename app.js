// Require 

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash")


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// create new databse  and connect app to BD on mongoose
mongoose.set('strictQuery', true);

//mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');

// create schema
const itemSchema = {
  name : String
}

// create model // name is capitalize
const Item = mongoose.model("Item", itemSchema)

// create three new default  items
const item1 =  new Item({
  name: "Welcome to your todolist!"
})
const item2 = new Item({
  name: "Hit the + button to add new item"
})
const item3 = new Item({
  name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3]
// create new schema to store customize todolist
const listSchema = {
  name: String,
  items:[itemSchema]
}

// create model for this schema

const List = mongoose.model("List", listSchema)





// To rendering data from mongoose databse to App, using Mongoose find()

app.get("/", function(req, res) {

  
  Item.find(function(err, items){

    if(items.length === 0){
      // insert many to mongoose, refer to the model of collection created

      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log("Error")
        }else{
          console.log("Successful inserted")
        }
      })

      // redirect to homepage to get the data on a browser 
      res.redirect("/")
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  })

});

// route parameters

app.get("/:todolistName", (req, res)=>{
  const todoName = _.capitalize(req.params.todolistName)

   // check to see in list collection the data is exist or not

   List.findOne({name: todoName}, function(err, foundList){
    if(!err){
      // if the list is not exsit in a list collection
      if(!foundList){
        // Create new list
        const customeList = new List({
          name: todoName,
          items: defaultItems
        })
        // save customeList to database
      
        customeList.save((err)=>{
          if(err) return handleError(err)
        })

        // redirect to refresh browser to see a result after data save to DB

        res.redirect("/" + todoName)
      }else{
        
       
        // Show existing list by rendering to list.ejs
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })
 
})

app.post("/", function(req, res){
  // get information from user
  const item = req.body.newItem;
  const listTitle = req.body.list
  // create item document/record based on Item model to use mongoose

  const newItem = new Item ({
    name: item
  })

  // check to see listTitle is home page or custome page

  if(listTitle === "Today"){
    // add to database and redirect to home page as Today is default home page
    newItem.save(function(err){
      if(err) return handleError(err)
    })
    res.redirect("/")
  } else{
    // Search for list on list collection

    List.findOne({name: listTitle}, function(err, foundList){
      if(!err){
        foundList.items.push(newItem)
        foundList.save()
        res.redirect("/" + listTitle)
      }
    })
  }
});

// route to delete item

app.post("/delete", (req, res)=>{

  // delete item when use checked 
  const itemId = req.body.check;
  const listTitle = req.body.listTitle
  console.log(listTitle);
  
  // check to see which list user is going to delete

  if(listTitle === "Today"){
    // when the list is default list -> Today
    Item.findByIdAndRemove(itemId,  function(err){
      if(err) console.log(err);
      else console.log("Data deleted");
    })
  
    res.redirect("/")
  }else{
    // find list and delete ->> pull from items array when list have specific id = itemID

    List.findOneAndUpdate({name: listTitle},{$pull: {items: {_id: itemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listTitle)
      }
    })

  }
  
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server has started successfully");
});

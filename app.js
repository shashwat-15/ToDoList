const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
const _ = require('lodash');

mongoose.connect("mongodb+srv://admin-shashwat:Test123@cluster0.586se.mongodb.net/todolistDB", {useUnifiedTopology: true});

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const todolistSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", todolistSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- Click this to delete an item"
});

const itemsArray = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [todolistSchema]
});

const List = mongoose.model("List", listSchema);

let day = date.getDate();

let workList = [];

//res => response from the server and req => request to the server
app.get("/", function(req, res){
    Item.find({},function(error, items){
        if(items.length === 0) {
            Item.insertMany(itemsArray, function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Successfully inserted");
                }
            }); 
            res.redirect("/");
        }
        else{
            if(error){
                console.log(error);
            }
            else{
                res.render("list", {listTitle: day, listItemsArray: items});
            }
        }
        
    });
    
});


app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                const list = new List({
                    name: customListName,
                    items: itemsArray
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else{
                res.render("list", {listTitle: foundList.name, listItemsArray: foundList.items});
            }
        }
        else{
            console.log(err);
        }
    });
    
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.post("/", function(req, res){
    let itemName = req.body.newListItem;
    let listName = req.body.list;

    const newItem = new Item({
        name: itemName
    });

    console.log(listName);
    if(listName === day){
        newItem.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}, function(err, foundList){
            if(!err){
                if(!foundList) {
                    console.log("No list found");
                }
                else{
                    foundList.items.push(newItem);
                    foundList.save();
                    res.redirect("/" + listName);
                }
            }
            else{
                console.log(err);
            }
        });
    }
    
});

app.post("/delete", function(req,res){
    //console.log(req.body);
    let listName = req.body.listName;
    let itemID = req.body.itemId;
    if(req.body.itemCheckbox === "on") {
        if(listName === day) {
            Item.findByIdAndRemove(itemID, function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("deleted successfully");
                }
            });
            res.redirect("/");
         }
         else{
             List.findOne({name: listName}, function(err, foundList){
                if(!err){
                    if(!foundList) {
                        console.log("No list found");
                    }
                    else{
                        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, function(err, results){
                            if(!err){
                                res.redirect("/" + listName);
                            }
                        });
                    }
                }
                else{
                    console.log(err);
                }
             });
         }
         
     }
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Server has started successfully")
});


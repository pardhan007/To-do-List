//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/data.js");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-harsh:harsh123@cluster0.6asgh9f.mongodb.net/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

// const item1 = new Item({
//     name: "Welcome to TodoList!"
// });
// const item2 = new Item({
//     name: "Hit + to Add more"
// });
// const item3 = new Item({
//     name: "<- to delete item!"
// });

// const defaultItems = [item1, item2, item3];

const defaultItems = [];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    let day = date.getDate();
    Item.find({}, function (err, foundItems) {
        // if (foundItems.length === 0) {
        //     Item.insertMany(defaultItems, function (err) {
        //         if (err) {
        //             console.log(err);

        //         }
        //         else {
        //             console.log("Successfully Saved Default Items!");
        //         }
        //     })
        // }
        res.render('list', { listTitle: "Today", newListItems: foundItems });
    });

});

app.post("/", function (req, res) {

    let item = req.body.itemName;
    const listName = req.body.list;

    const newItem = new Item({
        name: item
    });

    if (listName === "Today") {
        newItem.save();
        res.redirect("/");

    }
    else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});

app.post("/delete", function (req, res) {
    // console.log(req.body.checkBox);
    const itemId = req.body.checkBox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(itemId, function (err) {
            if (err) {
                consile.log(err);
            }
            else {
                // console.log("Successfully Deleted item!");
            }
        });
        res.redirect("/");
    }
    else {

        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }

        });

    }
});

app.get("/:customList", function (req, res) {

    // const customListName = _.lowerCase(req.params.customListName);
    const customListName = _.capitalize(req.params.customList);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect("/" + customListName);
            }
            else {
                // show existinnh list
                res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
            }

        }

    });
});


let port = process.env.PORT;
if (port === null || port === "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server started succesfully");
});          
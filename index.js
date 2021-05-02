const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const expressEjsLayout = require('express-ejs-layouts');

const port = process.env.PORT || 3000;

//models
const TodoTask = require("./models/TodoTask");

dotenv.config();

app.use(express.urlencoded({ extended: true })); // extract the data from the form by adding her to the body property of the request.

//connection to db
mongoose.set("useUnifiedTopology", true);

mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, () => {
    console.log("Connected to db!");
    server.listen(port, () => console.log("Server Up and running on port " + port));
});

//EJS
app.set("view engine", "ejs");
app.use(expressEjsLayout);
app.set('views', "template/views");
app.set('layout', '../layout');
app.use(express.static("public"));

// GET method
app.get("/", (req, res) => {
    TodoTask.find({}, (err, tasks) => {
        res.render("todo.ejs", { todoTasks: tasks });
    });
});

// POST method
app.post('/',async (req, res) => {
    const todoTask = new TodoTask({
        content: req.body.content // assign the data (TodoTask.js)
    });
    try {
        await todoTask.save(); // push the data on the db
        res.redirect("/");
    } 
    catch (err) {
        res.redirect("/");
    }
});

//UPDATE
app.route("/edit/:id") // way to the todoEdit.ejs with the matching id
    .get((req, res) => {
        const id = req.params.id; // find the id
        TodoTask.find({}, (err, tasks) => {
            res.render("todoEdit.ejs", { todoTasks: tasks, idTask: id }); // render the new template
        });
    })
    .post((req, res) => {
        const id = req.params.id;
        TodoTask.findByIdAndUpdate(id, { content: req.body.content }, err => { // update our task
            if (err) return res.send(500, err);
            res.redirect("/");
        });
    })
;

//DELETE
app.route("/remove/:id").get((req, res) => {
    const id = req.params.id;
    TodoTask.findByIdAndRemove(id, err => {
        if (err) return res.send(500, err);
        res.redirect("/");
    });
});

///// CHANGES STREAM /////
//install mongodb => npm i mongodb@3
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const pipeline = [
    {
        $project: {documentKey: false}
    }
];

///// COPY DB /////

app.get("/test", (req, res) => {
    TodoTask.find({}, (err, tasks) => {
        res.send(tasks);
    });
});

///// SOCKET.IO /////
io.on("connection", (socket) => {
    /// CHAT ///
    console.log("a user connected");
    io.emit("chat message", "Hello stranger");

    socket.on("chat message", (msg) => {
        console.log("message: " + msg);
        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    /// CHANGE STREAM ///
    MongoClient.connect(process.env.DB_CONNECT, {useUnifiedTopology: true})
    .then(client => {
        const db = client.db("OOP_db");
        const collection = db.collection("todotasks");
        const changeStream = collection.watch(pipeline);
        console.log("listerning for changes on db");

        //listen for changes
        changeStream.on("change", (changes) => {
            console.log(changes);
            let data = {
                operationType: changes.operationType,
                _id: changes.fullDocument._id,
                content: changes.fullDocument.content
            }
            io.emit("db changes", data);
        })
    });
});
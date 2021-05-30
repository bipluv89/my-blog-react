import express from "express";
import { MongoClient } from "mongodb";
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));

app.use(express.json());
app.get("/hello",(req,res) => res.send("Hello!"));
app.get("/hello/:name", (req,res) => res.send(`Hello ${req.params.name} !`))
app.post("/hellopost",(req,res) => res.send(`Hello ${req.body.name}!`));

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true});
        const db =  client.db('my-blog');

        await operations(db);
        client.close();
    }catch (error){
        res.status(500).json({'message':" DB connection issue", error});
    }
}
app.get("/api/article/:name", async (req, res) => {
    withDB(async (db) => {
        const articleName= req.params.name;
        const articlesInfo= await db.collection('articles').findOne({name : articleName});
            res.status(200).json(articlesInfo);
        } , res);
    });

app.post("/api/article/:name/upvote", async (req,res) => {
    withDB( async (db) => {
        const articleName= req.params.name;
        const articlesInfo= await db.collection('articles').findOne({name : articleName});
        await db.collection('articles').updateOne({name : articleName},{
            '$set': {
                upvotes : articlesInfo.upvotes+1,
            },
        });
        const updatedArticle = await db.collection('articles').findOne({name : articleName});
        res.status(200).json(updatedArticle);
    }, res);
});

app.post("/api/article/:name/add-comment", async (req,res) => {
    const {username , text} =req.body;
    const articleName= req.params.name;
    withDB( async (db) => {
        const articlesInfo= await db.collection('articles').findOne({name : articleName});
        await db.collection('articles').updateOne({name : articleName},{
            '$set': {
                comments : articlesInfo.comments.concat({username, text}),
            },
        });
        const updatedArticle = await db.collection('articles').findOne({name : articleName});
        res.status(200).json(updatedArticle);
    }, res);
});

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname, '/build/index.html'));
});
app.listen(9000, () => console.log("Listening on port 9000 from nodemon"));
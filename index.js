require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000
const app = express()

// middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'https://mhmitas.vercel.app']
}))
app.use(express.json())

const uri = process.env.MONGODB_URI
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send(`<h1>Hi! I'm Mh Mitas. Welcome to my portfolio.</h1>`)
})

async function run() {
    try {
        const db = client.db('mhmitas_portfolio')
        const userColl = db.collection('user')
        const projectColl = db.collection('projects')

        // sign in of admin
        app.post('/api/sign-in', async (req, res) => {
            const data = await req.body
            const user = await db.collection('admins').findOne({ email: data?.email })
            if (!user || user.role !== 'admin' || user?.password !== data?.password) {
                return res.status(400).send('unauthorize access')
            }
            delete user.password
            res.status(200).send({ user, message: 'ok' })
        })
        // verify admin
        app.get('/api/is-admin/:email', async (req, res) => {
            const email = req.params.email
            const user = await db.collection('admins').findOne({ email: email })
            if (user && user.role === 'admin') {
                return res.send({ isAdmin: true, user })
            }
            return res.send({ isAdmin: false })
        })

        // save user in db
        app.post('/api/user', async (req, res) => {
            const userData = await req.body;
            if (!userData?.name || !userData?.email || !userData?.uid || !userData?.image) {
                return res.status(400).send({ message: 'invalid credentials' })
            }
            console.log({ userData })
            const isExist = await userColl.findOne({ email: userData?.email })
            console.log({ isExist })
            if (isExist) {
                return res.send({ message: 'user already exist' })
            }
            const data = {
                name: userData?.name,
                email: userData?.email,
                uid: userData?.uid,
                image: userData?.image,
            }
            const result = await userColl.insertOne(data)
            return res.send(result)
        })


        // project related apis
        // get all projects
        app.get('/api/projects', async (req, res) => {
            let limit = 0
            if (req.query?.limit) {
                limit = parseInt(req.query.limit)
            }
            const options = { sort: { priority: 1 } }
            const projects = await projectColl.find({}, options).limit(limit).toArray()
            res.send(projects)
        })
        // get project details
        app.get('/api/projects/details/:id', async (req, res) => {
            const id = req.params;
            const objectId = ObjectId.isValid(id)
            if (!objectId) {
                return res.status(400).send({})
            }
            const query = { _id: new ObjectId(id) }
            const project = await projectColl.findOne(query)
            res.send(project)
        })
        // const update an project
        app.put('/api/projects/update/:id', async (req, res) => {
            const id = req.params;
            const updateProject = await req.body
            const objectId = ObjectId.isValid(id)
            if (!objectId) {
                return res.status(400).send({})
            }
            const query = { _id: new ObjectId(id) }
            const updateDoc = { $set: updateProject }
            const project = await projectColl.updateOne(query, updateDoc)
            res.send(project)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log('Server is listening on port:', port)
})
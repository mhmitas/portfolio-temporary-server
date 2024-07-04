require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000
const app = express()

// middlewares
app.use(cors())
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

        // sign in owner
        app.post('/api/sign-in', async (req, res) => {
            const data = await req.body
            console.log(data)
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
            console.log(email)
            const user = await db.collection('admins').findOne({ email: email })
            console.log(user)
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
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = '';
const client = new MongoClient(uri,  {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);
async function getDBClient() {
try {
// Connect the client to the server (optional starting in v4.7)
await client.connect();
// Send a ping to confirm a successful connection
await client.db("test").command({ ping: 1 });
return client
console.log("Pinged your deployment. You successfully connected to MongoDB!");
} finally {
// Ensures that the client will close when you finish/error
// await client.close();
}
}
module.exports = getDBClient;
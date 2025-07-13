const cassandra = require('cassandra-driver')

async function connect() {
    const cluster = new cassandra.Client({
        contactPoints: ["node-0.aws-ap-south-1.79c3506d8d009fcadcf8.clusters.scylla.cloud", "node-1.aws-ap-south-1.79c3506d8d009fcadcf8.clusters.scylla.cloud", "node-2.aws-ap-south-1.79c3506d8d009fcadcf8.clusters.scylla.cloud"],
        localDataCenter: 'AWS_AP_SOUTH_1',
        credentials: {username: 'scylla', password: '816trpFTxUklKEO'},
        // keyspace: 'your_keyspace'
    })

    const results = await cluster.execute('SELECT * FROM system.clients LIMIT 10')
    results.rows.forEach(row => console.log(JSON.stringify(row)))

    await cluster.shutdown()
}

connect()
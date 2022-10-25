// Connect to db
const mysql = require('mysql2')

const dbNameConfig = {
  dev: process.env.SQL_DATABASE, // for localhost development
  production: process.env.SQL_DATABASE, // for Ec2 machine
  test: process.env.SQL_DATABASE_TEST // for integration test
}

function createConnection() {
  return mysql.createPool({
    connectionLimit: 10,
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    user: process.env.SQL_ACCOUNT,
    password: process.env.SQL_PASSWORD,
    database: dbNameConfig[process.env.MODE],
    multipleStatements: true
  })
}

function getDbConnectionPool() {
  const db = createConnection()

  db.getConnection(async (err, connection) => {
    // this is for checking connection status
    if (err) {
      // console.log(err)
      console.log('Mysql Connection retried...')
      return setTimeout(getDbConnectionPool, 5000)
    }

    console.log('Mysql connected..!!')
    connection.release()
  })

  return db
}

const dbPromise = getDbConnectionPool().promise()

module.exports = dbPromise

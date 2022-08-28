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

  db.getConnection((err, connection) => {
    if (err) {
      console.log(err)
      console.log(connection)
      setTimeout(createConnection, 1000)
    } // not connected!
    console.log('Mysql connected..!!')
  })

  return db
}

const dbPromise = getDbConnectionPool().promise()

module.exports = dbPromise

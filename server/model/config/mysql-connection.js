// Connect to db
const mysql = require('mysql2')

const dbNameConfig = {
  dev: process.env.SQL_DATABASE, // for localhost development
  production: process.env.SQL_DATABASE, // for Ec2 machine
  test: process.env.SQL_DATABASE_TEST // for integration test
}

const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.SQL_HOST,
  port: process.env.SQL_PORT,
  user: process.env.SQL_ACCOUNT,
  password: process.env.SQL_PASSWORD,
  database: dbNameConfig[process.env.MODE],
  multipleStatements: true
})

db.getConnection(function (err, connection) {
  if (err) throw err // not connected!
  console.log('Mysql connected..!!')
})
const dbPromise = db.promise()

module.exports = dbPromise

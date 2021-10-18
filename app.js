require('dotenv').config()
const port = process.env.MODE === 'dev' ?  3000 : process.env.PORT

const express = require('express')
const app = express()

app.use(express.static('public'))

app.get('/', (req, res)=>{
  res.send('test ok')
})

app.listen(port, () => {
  console.log(`This server is running on http://localhost:${port}`);
})
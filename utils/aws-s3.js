// upload size limit
const MAX_FILE_SIZE = 2e6

// multer module
const multer = require('multer')
const moment = require('moment')
const fs = require('fs')

const AWS = require('aws-sdk')
AWS.config.update({ region: 'ap-northeast-1' })
const multerS3 = require('multer-s3')

// Create S3 service object
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY
})

const userPictureUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME + '/users',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname })
    },
    key: function (req, file, cb) {
      cb(null, req.body['user_id'] + '-' + Date.now())
    }
  }),
  limits: { fileSize: MAX_FILE_SIZE }
})

// Handle user uploaded image
const userPictureUploadS3 = userPictureUpload.single('user-picture')

async function uploadBase64Pic(image) {
  // upload to S3
  const image64 = image.replace('data:image/jpeg;base64,', '')
  const buffdata = new Buffer.from(image64, 'base64')
  const imgName = moment().unix()
  const imageUrl = process.env.S3_IDEAS_PATH + '/' + imgName
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME + '/ideas',
    Key: imgName.toString(),
    Body: buffdata,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  }

  // upload to S3
  s3.upload(uploadParams, function (error, data) {
    if (error) {
      console.log('Error', error)
    }
    if (data) {
      console.log('Upload Success', data.Location)
    }
  })

  return imageUrl
}

async function uploadDefaultPic(id) {
  // upload default image
  const defaultImg = fs.createReadStream(
    __dirname + '/../public/img/profile-icon.png'
  )
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME + '/users',
    Key: id + '-profile',
    Body: defaultImg,
    ACL: 'public-read',
    ContentType: 'image/png'
  }

  // upload to S3
  s3.upload(uploadParams, function (err, data) {
    if (err) {
      console.log('Error', err)
      return res.status(500).send({ error: 'server error' })
    }
    if (data) {
      console.log('Upload Success', data.Location)
    }
  })
}

module.exports = { userPictureUploadS3, uploadBase64Pic, uploadDefaultPic }

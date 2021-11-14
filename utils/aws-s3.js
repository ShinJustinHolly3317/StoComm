// upload size limit
const MAX_FILE_SIZE = 5e7

// multer module
const multer = require('multer')

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
      cb(null, req.body['user_id'] + '-profile')
    }
  }),
  limits: { fileSize: MAX_FILE_SIZE }
})

// Handle product created data: images/ text
const userPictureUploadS3 = userPictureUpload.single('user-picture')

module.exports = { userPictureUploadS3 }

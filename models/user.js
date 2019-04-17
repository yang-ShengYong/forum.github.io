var mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/test')

var Schema = mongoose.Schema

var userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  created_time: {
    type: Date,
    //这里不要写成Data.now()，要不然会马上调用返回一个时间
    default: Date.now
  },
  last_modified_time: {
    //最近更改的时间
    type: Date,
    default: Date.now
  },
  avatar: {
    //头像
    type: String,
    default: '../public/img/avatar-default.png'
  },
  bio: {
    //个性签名
    type: String,
    default: ''
  },
  gender: {
    type: Number,
    enum: [-1,0,1],
    default: -1
  },
  birthday: {
    type: String,
    default: '0000-00-00'
  },
  status: {
    type: Number,
    //0 正常
    //1 禁言
    //2 作废
    enum: [0,1,2],
    default: 0
  }
})

module.exports = mongoose.model('User', userSchema)

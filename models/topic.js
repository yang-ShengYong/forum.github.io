var mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/test')

var Schema = mongoose.Schema

var topicSchema = new Schema({
  section: {
    type: String,
    enum: ['分享', '问答', '招聘', '客户端测试'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: '小主竟然什么也没写……'
  },
  created_time: {
    type: Date,
    default: Date.now
  },
  authorId: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Topic', topicSchema)

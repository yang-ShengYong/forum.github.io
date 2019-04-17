var express = require('express')
var path = require('path')
var router = require('./router')
var bodyParser = require('body-parser')
var session = require('express-session')
var fileUpload = require('express-fileupload')

var app = express()

app.engine('html', require('express-art-template'))
app.set('views', path.join(__dirname, './views/')) //模板引擎默认的目录（可更改）

//path.join会把相对路径转换成绝对路径
app.use('/public/', express.static(path.join(__dirname, './public/')))
app.use('/node_modules/', express.static(path.join(__dirname, './node_modules/')))

//配置解析表单POST请求体插件一定要在挂载之前
app.use(bodyParser.urlencoded({ extend: false }))
app.use(bodyParser.json())

//配置表单提交的文件域的插件（我自己找的，好高兴）
app.use(fileUpload())

//配置session
app.use(session({
  //配置加密字符串，会在原有的基础上加上secret在加密
  //更安全
  secret: 'keyboard cat',
  resave: false,
  //无论用不用session都默认给一把钥匙(session_id)：true
  //真正往session存数据是才会发钥匙：false
  saveUninitialized: true
}))

//把路由挂载到app中
app.use(router)

//处理404的中间件
//如果前面所有的中间件都不收请求，就交给我处理，返回404
app.use(function (req, res) {
  res.render('404.html')
})

//处理全局错误
app.use(function (err, req, res, next) {
  res.status(500).json({
    err_code: 500,
    message: err.message
  })
})

app.listen(3000, function () {
  console.log('running')
})

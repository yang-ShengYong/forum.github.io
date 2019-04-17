var express = require('express')
var User = require('./models/user') //用大写好区分
var md5 = require('blueimp-md5')

var router = express.Router()

router.get('/', function (req, res) {
  res.render('index.html', {
    user: req.session.user
  })
})

router.get('/login', function (req, res) {
  res.render('login.html')
})

router.post('/login', function (req, res, next) {
  var body = req.body

  User.findOne({
    email: body.email,
    password: md5(md5(body.password))
  }, function (err, user) {
    if (err) {
      // return res.status(500).json({
      //   err_code: 500,
      //   message: err.message
      // })
      return next(err)
    }

    if (!user) {
      return res.status(200).json({
        err_code: 1,
        message: 'email or password invalid ！'
      })
    }

    //用户存在，登录成功，用session记录状态
    req.session.user = user

    res.status(200).json({
      err_code: 0,
      message: 'OK'
    })
  })
})

router.get('/register', function (req, res) {
  res.render('register.html')
})

router.post('/register', function (req, res, next) {
  /* 
    1、通过body-parser中间件拿到请求体
    2、操作数据库
      判断用户是否已存在
    3、发送响应
  */
  var body = req.body

  User.findOne({
    $or: [
      {
        email: body.email
      },
      {
        nickname: body.nickname
      }
    ]
  }, function (err, data) {
    if (err) {
      // return res.status(500).json({
      //   err_code: 500,
      //   message: '服务器错误'
      // })
      return next(err)
    }
    if (data) {
      //邮箱或昵称已存在
      return res.status(200).json({
        err_code: 1,
        message: '已存在'
      })
    }

    body.password = md5(md5(body.password))

    new User(body).save(function (err, user) {
      if (err) {
        // return res.status(500).json({
        //   err_code: 500,
        //   message: '服务器错误'
        // })
        return next(err)
      }
      req.session.user = user
      res.status(200).json({
        err_code: 0,
        message: 'OK'
      })
    })
  })
})

router.get('/logout', function (req, res) {
  //清除登录状态
  req.session.user = null
  //重定向
  res.redirect('/login')
})

//在主页点设置跳转到 /settings/profile
router.get('/settings/profile', function (req, res, next) {
  var id = req.query.id

  User.findById({
    _id: id
  }, function (err, user) {
    if (err) {
      return next(err)
    }
    if (user) {
      res.render('settings/profile.html', {
        user: user
      })
    }
  })
})

//处理基本信息修改之后，点击保存
router.post('/settings/profile', function (req, res, next) {
  var body = req.body
  console.log(body)
  User.findOneAndUpdate({
    _id: body.id.replace(/"/g, "")
  },
    body,
    function (err) {
      if (err) {
        return next(err)
      }
      res.status(200).json({
        err_code: 0,
        message: 'OK'
      })
    })
})

//处理头像上传
router.post('/settings/profile/avatar', function (req, res, next) {
  var id = req.body.id
  //给id理个发，把"去掉
  id = id.replace(/"/g, "")

  console.log(id)


  if (Object.keys(req.files).length == 0) {
    return res.status(500).send('头像文件上传失败！')
  }

  var avatar = req.files.avatar

  avatar.mv('./public/img/'+id+'.jpg', function (err) {
    if (err) {
      return next(err)
    }
    //把数据库里的avatar改成对应的路径
    User.findByIdAndUpdate(id, {
      avatar: '../public/img/'+id+'.jpg'
    }, function (err, data) {
      if (err) {
        next(err) 
      }
      console.log(data)
      User.findById(id, function (err, user) {
        if (err) {
          next(err)
        }
        console.log(id + user)
        res.render('settings/profile.html', {
          user: user
        })
      })
    })
  })
})

//账户设置
router.get('/settings/admin', function (req, res) {
  res.render('settings/admin.html')
})

module.exports = router

var express = require('express')
var User = require('./models/user') //用大写好区分
var md5 = require('blueimp-md5')
var fs = require('fs')
var path = require('path')

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

  if (Object.keys(req.files).length == 0) {
    return res.status(500).send('头像文件上传失败！')
  }

  var avatar = req.files.avatar

  avatar.mv('./public/img/' + id + '.jpg', function (err) {
    if (err) {
      return next(err)
    }
    //把数据库里的avatar改成对应的路径
    User.findByIdAndUpdate(id, {
      avatar: '../public/img/' + id + '.jpg'
    }, function (err, data) {
      if (err) {
        return next(err)
      }
     
      User.findById(id, function (err, user) {
        if (err) {
          return next(err)
        }
        req.session.user = user
        res.render('settings/profile.html', {
          user: user
        })
      })
    })
  })
})

//点击账户设置
router.get('/settings/admin', function (req, res, next) {
  var id = req.query.id
  id = id.replace(/"/g, "")

  User.findById(id, function (err, user) {
    if (err) {
      return next(err)
    }
    res.render('settings/admin.html', {
      user: user
    })
  })
})

//修改密码
router.post('/settings/password', function (req, res, next) {
  var id = req.body.id
  id = id.replace(/"/g, "")

  User.findById(id, function (err, user) {
    if (err) {
      return next(err)
    }
    //把oldPassword取出来，两次MD5加密然后比对
    var oldPassword = req.body.oldPassword
    var md5_oldPassword = md5(md5(oldPassword))
    console.log(user.password)
    if (md5_oldPassword !== user.password) {
      return res.status(200).json({
        err_code: 1,
        message: 'oldPassword error'
      })
    }
    User.findByIdAndUpdate(id, {
      password: md5(md5(req.body.newPassword))
    }, function (err) {
      if (err) {
        return next(err)
      }
      res.status(200).json({
        err_code: 0,
        message: '密码修改成功'
      })
    })
  })
})

//删除账户
router.get('/settings/admin/delete', function (req, res, next) {
  var id = req.query.id
  id = id.replace(/"/g, "")

  User.deleteOne({
    _id: id
  }, function (err, ret) {
    if (err) {
      return next(err)
    }
    fs.unlink(path.join(__dirname, '/public/img/' + id + '.jpg'), function (err) {
      if (err) {
        return next(err)
      }
    })
    req.session.destroy(function (err) {
      if (err) {
        return next(err)
      }
    })
    res.redirect('/')
  })
})

module.exports = router

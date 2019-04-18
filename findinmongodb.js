var User = require('./models/user')

User.find(function (err, user) {
  console.log(user)
})

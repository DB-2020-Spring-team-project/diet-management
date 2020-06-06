
var express = require('express');
var mysql = require('mysql');
var bodyParser = require("body-parser");
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var flash = require('connect-flash');

var app = express();
app.use(express.static(__dirname+'/public'));
// var index = require('./routes/index');
// var users = require('./routes/users');

//what type of login method will be used
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

var connection = mysql.createConnection({
  host     : '52.79.44.154',
  user     : 'user',
  password: '1234',
  database : 'nutrient_app'
});


//store express session to maintain user's info
app.use(session({
  secret : 'MYSECRETSECRET', //key value for sesssion
  resave : false,
  saveUninitialized : true,
  // store : new MySQLStore({
  //   host: 'localhost',
  //   port: 3000,
  //   user: 'root',
  //   password: '',
  //   database: 'practice'
  // })
  cookie:{secure: false}
}));

//passpot module initialization
app.use(flash());
app.use(passport.initialize()); //passport initialize
app.use(passport.session());

// app.use('/', index);
// app.use('/users', users);

app.get('/', function(req, res){
 res.render('welcome');
});

app.get("/'welcome'", function(req, res){
 res.render('login');
});

app.get("/home", function(req, res){
 var q = "select quote from quote order by rand() limit 1";
 connection.query(q, function (error, result) {
 if (error) throw error;
 //console.log(result[0]);
 var quote = result[0].quote
 res.render('home', {quote:quote});
 });

});

app.get("/login", function(req, res){
 res.render('login');
});

app.get("/register", function(req, res){
  res.render('sign_up');
});

app.post("/register", async(req, res)=>{

  try{
    var user = {
      id: req.body.id,
      name: req.body.user_name,
      password: req.body.password,
      sex: req.body.sex,
      height: req.body.height,
      weight: req.body.weight,
      age: req.body.age
  	};
    var q = 'insert into user set ?'
    connection.query(q, user, function (error, results) {
    if (error) throw error;
    console.log("Data inserted!");
    });
  }catch{
    res.redirect('/');
  }
  console.log(user);


});


passport.use(new LocalStrategy({
   usernameField: 'id',
   passwordField: 'password',
   passReqToCallback: true //passback entire req to call back
} , function (req,username, password, done){
    if(!username || !password ) {
      //return done(null, false, {message:'All fields are required.'});
      return done('All fields are required');
    }
    //console.log('check: ' + username + ' ' + password);
    var q = "select * from user where id = ?"
    connection.query(q, [username], async(err, res)=>{
        console.log(err);
        console.log(res);
      if (err) return done(err);
      if(!res.length){ return done(null, false, {message:'Invalid id or password.'}); }
      var user = res[0];
      //console.log('result: '  + user);
      //console.log(user.password, password);
      if(user.password != password){
          return done(null, false,{message:'Invalid id or password.'});
       }
       //console.log('what return: ' + user);
      return done(null, {'id':username});
    });
  }
));

//autentication Routing when login is success or fail
app.post("/login", passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
})
);

//passport auth check//
var isAuthenticated = function(req, res, next){
  if(req.isAuthenticated())
    return next();
  res.redirect('/login');
}

//diary. Can use this, when user is logged in.

app.get("/diary", isAuthenticated, function(req, res){
  var q = "select DATE_FORMAT(date, \'%y-%m-%d\') as d, comment from diary where user_id = ?"
  connection.query(q, [req.user.id], function(err, rows){
      console.log(err);
      console.log(rows);
      res.render('diary', {user:req.user.id, rows: rows})
  });

  //console.log(req.user.id);
});


app.post("/diary", isAuthenticated,function(req, res){
  //console.log(req.user.id);
  //res.render('diary', {user:req.user.id);
  var diary = {
    user_id: req.user.id,
    comment: req.body.comment
  };
  var q = 'insert into diary set ?'
  connection.query(q, diary, function (error, results) {
  if (error) throw error;
  console.log("Data inserted!");
  res.redirect('/diary');
  });
});

app.get("/weight", isAuthenticated, function(req, res){
  var q = "select DATE_FORMAT(date, \'%y-%m-%d\') as d, weight from weigth_diary where user_id = ?"
  connection.query(q, [req.user.id], function(err, rows){
      console.log(err);
      console.log(rows);
      res.render('weight', {user:req.user.id, rows: rows})
  });

  //console.log(req.user.id);
});


app.post("/weight", isAuthenticated,function(req, res){
  //console.log(req.user.id);
  //res.render('diary', {user:req.user.id);
  var weigth_diary = {
    user_id: req.user.id,
    weight: req.body.weight
  };
  var q = 'insert into weigth_diary set ?'
  connection.query(q, weigth_diary, function (error, results) {
  if (error) throw error;
  console.log("Data inserted!");
  res.redirect('/weight');
  });
});


// when login is successful
passport.serializeUser(function(user, done){
  //console.log('serial: '+ user.id);
    //session store
    done(null, user);
});

passport.deserializeUser(function(user, done){
    // connection.query("select * from user where 'id' = ?" , [id], function (err, user){
    //   //console.log('deserial: '+ user);
    //     done(err, user);
    // });
    done(null, user);
});




//logout function in passport
app.get('/logout', function(req, res){
    req.session.destroy();
    req.logout();
    res.redirect('/login');
});

//catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });


//module.exports = app;

app.listen(10003, function () {
 console.log('App listening on port 10003!');
});

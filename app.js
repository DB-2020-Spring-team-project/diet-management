var express = require('express');
var mysql = require('mysql');
var bodyParser = require("body-parser");
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var flash = require('connect-flash');
var _= require('lodash');

var app = express();

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
  password : '1234',
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
       console.log('what return: ' + user);
      return done(null, user);
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

// when login is successful
passport.serializeUser(function(user, done){
  //console.log('serial: '+ user.id);
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    connection.query("select * from user where 'id' = ?" , [id], function (err, user){
      //console.log('deserial: '+ user);
        done(err, user);
    });
});




//logout function in passport
app.get('/logout', function(req, res){
    req.session.destroy();
    req.logout();
    res.redirect('/login');
});

app.get('/feedback/:userid/:date', function(req, res){
    var date = req.params.date;
    var id = req.params.userid;
    var feedback;
    var goodfeedback=new Array();
    var excessfeedback=new Array();
    var lackfeedback=new Array();
    var sports=[];
    var kcal_sports=new Array();
    var kcal;
    var foods=new Array();
    var qfood='select user_id,date,food_name_ef as food from eaten_food where date = ? and user_id = ?';
    var qfeedback = 'select RT.user_id, RT.date, RT.nutrients, RT.eaten_amount as amount, LT.min,LT.max from standard_nutrient as LT join (select RT.id as s_id, LT.* from (select LT.id as user_id, LT.sex as user_sex, LT.age as user_age, RT.date as date, RT.eaten_nutrient_details as nutrients, RT.eaten_amount as eaten_amount from user as LT join (select * from eaten_nutrient where user_id = ? and date = ?)   as RT on RT.user_id = LT.id) as LT join standard as RT on RT.sex = LT.user_sex and LT.user_age>=RT.from_age and LT.user_age <= RT.to_age) as RT on LT.standard_nutrient_details = RT.nutrients and LT.standard_id = RT.s_id';
    var qsport = 'select sports_name, consumption from sports order by rand() limit 3';
    connection.query(qfood,[date,id],function(err,data){
      if(err) throw err;
      foods = _.cloneDeep(data);
    });
    connection.query(qsport,function(err,data){
      if(err) throw err;
      sports = _.cloneDeep(data);    
    });
    connection.query(qfeedback,[id,date],function(err,data){
      if(err) throw err;
      for(var i = 0; i < data.length ; i++ ){
        if(data[i].nutrients == '열량'){
          kcal=_.cloneDeep(data[i].amount);
          kcal=Math.round(kcal);
        }
        if(data[i].amount >= data[i].min && data[i].amount <= data[i].max){
          data[i].amount =0;
          goodfeedback.push(data[i]);
        }
        else{
          if(data[i].amount < data[i].min){
            data[i].amount = Math.round(((data[i].amount-data[i].min)/data[i].min) * -100);
            lackfeedback.push(data[i]);
          }
          else {
            data[i].amount = Math.round(((data[i].amount-data[i].max)/data[i].max) * 100);
            excessfeedback.push(data[i]);
          }
        }
      }
      feedback = _.cloneDeep(data);
      for (var i = 0 ; i < sports.length ; i++){
        kcal_sports.push(new Object());
        kcal_sports[i].sport_name = sports[i].sports_name;
        kcal_sports[i].time = Math.round(kcal/sports[i].consumption);
      }
      res.render('feedback',{'goodfeedback': goodfeedback,'lackfeedback': lackfeedback,'excessfeedback': excessfeedback , 'sports' : kcal_sports , 'kcal': kcal, 'foods': foods, 'id' :id ,'date': date});
    });
});

app.get('/', function(request, response) { 

  /*var sql = 'SELECT * FROM water_diary';
  db.query(sql, function(err, rows, fields){*/
        
  var sql = 'SELECT * FROM water_diary';
  connection.query(sql, function(err, rows, fields){
      if(err){
        console.log(err);
      }
      else {
        for(var i=0; i<rows.length; i++){
          console.log(rows[i].cups);
        }
        //res.json(rows);
      }
    var title = 'Welcome!';
    var description = '오늘 마신 물의 컵수를 선택해주세요~';
    var cups = rows[0].cups;
    var user = rows[0].user_id;
    var template = `
    <!doctype html>
    <html>
    <head>
      <title>수분 섭취 기록 - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1><a href="/">${user}의 수분 섭취 기록</a></h1>
      <h2>${title}</h2>
      <h3>현재까지 마신 컵수 : ${cups}컵</h3>
      <p>${description}</p>
      <ul>
        <li><a href="/page/1">1컵</a></li>
        <li><a href="/page/2">2컵</a></li>
        <li><a href="/page/3">3컵</a></li>
        <li><a href="/page/4">4컵</a></li>
        <li><a href="/page/5">5컵</a></li>
        <li><a href="/page/6">6컵</a></li>
        <li><a href="/page/7">7컵</a></li>
        <li><a href="/page/8">8컵</a></li>
        <li><a href="/page/9">9컵</a></li>
        <li><a href="/page/10">10컵</a></li>
      </ul>

    </body>
    </html>
    `;      
  
  response.writeHead(200);
  response.end(template);
  }); //db
}); //app

app.get('/page/:pageId', function(request, response) { 
    var title = request.params.pageId;
    var sql = 'UPDATE water_diary SET user_id=?, cups=?, date=? WHERE id=?';
      var params = ["yumin",title,"2020-06-01",1];
       
      connection.query(sql,params, function(err, rows, fields){
        if(err){
          console.log(err);
        }
        else {
          for(var i=0; i<rows.length; i++){
            console.log(rows[i].cups);
          }
          //res.json(rows);
        }
    if(title == 10){
        var description = '하루 적정량을 채웠어요~!';
        var template = `
        <!doctype html>
        <html>
        <head>
            <title>수분 섭취 기록 - ${title}</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1><a href="/">수분 섭취 기록</a></h1>
            <h2>${title}컵을 마셨어요~</h2>
            <p>${description}</p>
            <ul>
                <li><a href="/page/1">1컵</a></li>
                <li><a href="/page/2">2컵</a></li>
                <li><a href="/page/3">3컵</a></li>
                <li><a href="/page/4">4컵</a></li>
                <li><a href="/page/5">5컵</a></li>
                <li><a href="/page/6">6컵</a></li>
                <li><a href="/page/7">7컵</a></li>
                <li><a href="/page/8">8컵</a></li>
                <li><a href="/page/9">9컵</a></li>
                <li><a href="/page/10">10컵</a></li>
            </ul>
            
        </body>
        </html>
        `;
        response.writeHead(200);
        response.end(template);
    }
    else{
        var description = '아직 부족해요~!';
        var template = `
        <!doctype html>
        <html>
        <head>
            <title>수분 섭취 기록 - ${title}</title>
            <meta charset="utf-8">
        </head>
        <body>
            <h1><a href="/">수분 섭취 기록</a></h1>
            <h2>${title}컵을 마셨어요~</h2>
            <p>${description}</p>
            <ul>
                <li><a href="/page/1">1컵</a></li>
                <li><a href="/page/2">2컵</a></li>
                <li><a href="/page/3">3컵</a></li>
                <li><a href="/page/4">4컵</a></li>
                <li><a href="/page/5">5컵</a></li>
                <li><a href="/page/6">6컵</a></li>
                <li><a href="/page/7">7컵</a></li>
                <li><a href="/page/8">8컵</a></li>
                <li><a href="/page/9">9컵</a></li>
                <li><a href="/page/10">10컵</a></li>
            </ul>
            
        </body>
        </html>
        `;
        response.writeHead(200);
        response.end(template);
      }
    });
});

//catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


//module.exports = app;

app.listen(3000, function () {
 console.log('App listening on port 3000!');
});


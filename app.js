var express = require('express');

var mysql = require('mysql');
var bodyParser = require("body-parser");
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var flash = require('connect-flash');
var app = express();
app.use(express.static(__dirname+'/public'));
var _= require('lodash');


// var index = require('./routes/index');
// var users = require('./routes/users');

//what type of login method will be used
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy


app.set('view engine', 'ejs');

app.set('views', './views');


app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
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

const sync_mysql      = require('sync-mysql');

const sync_connection = new sync_mysql({
  host     : '52.79.44.154',
  user     : 'user',
  password : '1234',
  database : 'nutrient_app'
});
var connection = mysql.createConnection({
  host     : '52.79.44.154',
  user     : 'user',
  password : '1234',
  database : 'nutrient_app'
});




var isAuthenticated = function(req, res, next){
  if(req.isAuthenticated())
    return next();
  res.redirect('/login');
}



//TODO: sementic query로 받은 id를 session으로 받아야 함.
app.post('/add_eaten_food', isAuthenticated,(req, res) => {
    var date = req.body.date;
    var food = req.body.food;
    var userid = req.user.id;

    var eaten_nutrients = {};
    var nutrients = [];
    var query = '';
    var rows;

    //유효성 검사 about food and date

    var datatimeRegexp = /[0-9]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])/;
  
    query = 'SELECT * FROM food where name="' + food + '"';
    
    rows = sync_connection.query(query);
    if(!datatimeRegexp.test(date) || !rows[0]){
      res.render('add_failed', {food: food});
      return;
    }

    //nutrients 종류 저장
    rows = sync_connection.query("SELECT details from nutrient");
    for(var i = 0; rows[i]; i++) {
        nutrients[i] = rows[i].details;
    }

    //선택한 food에 대한 영양소 저장
    query = 'SELECT * FROM food_nutrient where food_name_fn="' + food + '"';
    rows = sync_connection.query(query);
    for(var i = 0; rows[i]; i++){
        eaten_nutrients[rows[i].food_nutrient_details] = rows[i].amount;
    }

    //이전까지 먹은 영양소와 합치기
    query = 'SELECT * FROM eaten_nutrient where user_id = "' + userid + '" and date = "' + date + '"';
    rows = sync_connection.query(query);

    if(rows.length != 0) {
        const query_header = 'UPDATE eaten_nutrient SET eaten_amount = eaten_amount+';
        const query_footer = ' and user_id = "' + userid + '" and date = "' + date + '"';

        for(var i = 0; i < nutrients.length; i++) {
            var amount = eaten_nutrients[nutrients[i]];
            if(!amount) amount = 0.0;
            query = query_header + amount + ' WHERE eaten_nutrient_details = "' + nutrients[i] + '" ' + query_footer;
            //update구문 -- asynchronous 하게 변경.
            connection.query(query, function (error, result) {
              if (error) throw error;
            });
        }

    }
    else {
        const query_header = 'INSERT INTO eaten_nutrient(user_id, date, eaten_nutrient_details, eaten_amount) VALUES("' + userid + '", "' + date + '", "';
        for(var i = 0; i < nutrients.length; i++) {
            var amount = eaten_nutrients[nutrients[i]];
            if(!amount) amount = 0.0;
            query = query_header + nutrients[i] + '", ' + amount + ')';
            //insert구문 -- asynchronous 하게 변경.
            connection.query(query, function (error, result) {
              if (error) throw error;
            });
        }
    }

    query = 'INSERT INTO eaten_food(user_id, date, food_name_ef) VALUES("' + userid + '", "' + date + '", "' + food + '")';
    sync_connection.query(query);
    res.render('add_success', {userid: userid, food: food, date:date});
});

app.get('/like_food', isAuthenticated,(req, res) => {
  var userid = req.user.id;
  var like_foods = new Array();
  var food_names = [];
  var rows;
  query = 'SELECT food_name_lf AS food FROM like_food where user_id = ?';
  rows = sync_connection.query(query, [userid]);
  like_foods = _.cloneDeep(rows);

  rows = sync_connection.query('select name from food');
  var i = 0;
  while(rows[i]) {
    food_names[i] = rows[i].name;
    i++;
  }

  res.render('like_food', {like_foods: like_foods, food_names:food_names, userid: userid});
});

app.post('/like_food', isAuthenticated,(req, res) => {
  var food = req.body.food;
  var userid = req.user.id;
  var query=  'SELECT * FROM food where name="' + food + '"';
  //varidation
  var rows = sync_connection.query(query);
  if(!rows[0]){
    res.render('like_food_failed', {food: food});
    return;
  }
  
  var like_food = {
    food_name_lf: food,
    user_id: userid
  };
  query = 'INSERT INTO like_food set ?';
  connection.query(query, like_food, (error, results)=>{
    if (error) throw error;
    res.redirect('/like_food');
  });
  
  
});


app.get('/add_eaten_food', (req, res) => {
    var foods = [];
    var rows = sync_connection.query('select name from food');
    var i = 0;
    while(rows[i]) {
        foods[i] = rows[i].name;
        i++;
    }
    res.render('add_eaten_food', {food_names:foods});

});



// app.use('/', index);
// app.use('/users', users);

app.get('/', function(req, res){
 res.render('welcome');
});

app.get("/'welcome'", function(req, res){
 res.render('login');
});

app.get("/home", function(req, res){
 var q = "select quote from quote where id= curdate() mod 10;";
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
    res.redirect('/login');
    });
  }catch{
    res.redirect('/register');
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


app.get('/feedback/:date', isAuthenticated,function(req, res){
    var date = req.params.date;
    var id = req.user.id;
    var goodfeedback=new Array();
    var excessfeedback=new Array();
    var lackfeedback=new Array();
    var sports=[];
    var kcal_sports=new Array();
    var kcal;
    var foods=new Array();
    var qfood='select user_id,date,food_name_ef as food from eaten_food where date = ? and user_id = ?';
    var qfeedback = 'SELECT user_id, date, nutrients, amount, min,max FROM feedback WHERE user_id = ? and date = ?';
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


app.get("/month", isAuthenticated, function(req, res){
  var userid = req.user.id;
  res.render('month', {userid:userid})
});

app.get('/water', isAuthenticated,function(req, res) { 

   var userid = req.user.id;
   var today = new Date();
   var month = today.getUTCMonth() + 1;
   var day = today.getUTCDate();
   var year = today.getUTCFullYear();
   today = year + "-" + month + "-" + day;

   //오늘 해당 유저의 수분 섭취 기록 없으면 0컵으로 insert
    var sql = 'INSERT INTO water_diary (user_id, cups, date) SELECT * FROM (SELECT "' + userid + '" , 0, "' + today + '") AS tmp WHERE NOT EXISTS (SELECT user_id, date FROM water_diary WHERE user_id= ? AND date =?) LIMIT 1';
    var params = [userid, today];
    connection.query(sql, params ,function(err, row, fields){
      if(err)
        console.log(err)
    });

  //해당 유저가 어떤 날 마신 
  var sql = 'SELECT * FROM water_diary where user_id = ? and date = ?';
  connection.query(sql,[userid,today] ,function(err, row, fields){
      if(err){
        console.log(err);
      }
      else {
        console.log(row[0].cups);
      }

    var title = 'Welcome!';
    var description = '오늘 마신 물의 컵수를 선택해주세요~';
    var cups = row[0].cups;
    var user = row[0].user_id;


    res.render('water_home', {title:title, description:description, cups:cups, user:user});


  }); //connection

}); //app


app.get('/water/page/:pageId', isAuthenticated, function(req, res) { 
    var title = req.params.pageId;
    var userid = req.user.id;
    var today = new Date();
    var month = today.getUTCMonth() + 1;
    var day = today.getUTCDate();
    var year = today.getUTCFullYear();
    today = year + "-" + month + "-" + day;

    var sql = 'UPDATE water_diary SET user_id=?, cups=?, date=? WHERE user_id=? and date=?';
    var params = [userid, title, today, userid, today];
     
      connection.query(sql,params, function(err, rows, fields){
        if(err){
          console.log(err);
        }
        else {
          for(var i=0; i<rows.length; i++){
            console.log(rows[i].cups);
          }
        }
    if(title == 10){
        var description = '하루 적정량을 채웠어요~!';
        res.render('water_cups', {title:title, description:description});
    }
    else{
        var description = '아직 부족해요~!';

        res.render('water_cups', {title:title, description:description});
      }
    });
});

//catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


app.listen(10000,  function() {
 console.log('App listening on port 10000!');
});

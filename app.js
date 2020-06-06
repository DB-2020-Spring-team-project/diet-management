var express = require('express');
var app = express();
var mysql = require('mysql');
var connection = mysql.createConnection({
  host : '52.79.44.154', //포트번호
  user : 'user', //user
  password : '1234',  //1234
  database : 'nutrient_app'
});
connection.connect();

app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/water', function(req, res) { 
        
  var sql = 'SELECT * FROM water_diary';
  connection.query(sql, function(err, rows, fields){
      if(err){
        console.log(err);
      }
      else {
        for(var i=0; i<rows.length; i++){
          console.log(rows[i].cups);
        }
      }

    var title = 'Welcome!';
    var description = '오늘 마신 물의 컵수를 선택해주세요~';
    var cups = rows[0].cups;
    var user = rows[0].user_id;
 
    res.render('water_home', {title:title, description:description, cups:cups, user:user});
          
    
  }); //connection
}); //app

app.get('/water/page/:pageId', function(req, res) { 
    var title = req.params.pageId;
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
 
app.listen(3000, function() {
  console.log('Example app listening on port 3000!')
});
var express = require('express');
var app = express();
/*var path = require('path');
var fs = require('fs');
var template = require('./lib/et.js');*/
var mysql = require('mysql');
var db = mysql.createConnection({
  //host : 'localhost', //포트번호
  //user : 'root', //user
  host : '52.79.44.154', //포트번호
  user : 'user', //user
  password : '1234',  //1234
  //database : 'local'
  database : 'nutrient_app'
});
db.connect();

app.get('/', function(request, response) { 

  /*var sql = 'SELECT * FROM water_diary';
  db.query(sql, function(err, rows, fields){*/
        
  var sql = 'SELECT * FROM water_diary';
  db.query(sql, function(err, rows, fields){
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
       
      db.query(sql,params, function(err, rows, fields){
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
 
app.listen(3000, function() {
  console.log('Example app listening on port 3000!')
});
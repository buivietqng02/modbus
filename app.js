var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var nodemailer= require('nodemailer');

var usersRouter = require('./routes/users');
var adminRouter= require('./routes/admin');
var mongoose= require('mongoose');
var app = express();
var session= require('express-session');
var passport= require('passport');
var flash= require('connect-flash');
var ModbusData= require('./models/modbusData');
var User= require('./models/user.model');
require('dotenv').config();
var fs= require('fs');
var pdf= require('html-pdf');

var modbus= require('jsmodbus')
app.use(session({
  secret:'cat',
  resave: true,
  saveUninitialized: true,
  cookie: {maxAge: 60*60*60*1000} 
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next){
  if ((!req.session) || (!req.session.passport)){
    if (req.url!='/signin')  res.redirect('/signin')
    


  }  
  next();

        })
// view engine setup
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

var dev_mongoURL= 'mongodb://localhost:27017/test';
//var mongo_URL= process.env.mongoDB || dev_mongoURL;
var mongo_URL=  dev_mongoURL;


    try {
      mongoose.connect(mongo_URL,
      {
        useUnifiedTopology: true,
        useNewUrlParser: true
    
      } 
        );
       
  }
    catch (err) {
      console.log('error when access db');

    }
    
        const db= mongoose.connection;
        
        //console.log(db);
       
        db.once('open', ()=> {
          console.log('connected to db ');
         

        })

require('./config/passport');
//app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// error handler

//require('./modbus');

//section for read modbus data

var Modbus= require('./modbus');
let meters=[], meterInfos=[];
async function getAllMeterAndStartRead() {
 

  try{
  var r=await ModbusData.find({});
    
  }
  catch(err) {
    console.log(err);
    return;
  }
  for(let meter of r) {
    if (!meterInfos.includes(meter.info)) { //add meter to read List if not there
      meters.push(meter);
      meterInfos.push(meter.info);
      Modbus.readData(meter, 0);
      console.log(`add ${meter.info} to array`);
    }
   
  }
  
  //console.log(Modbus.socketList);

}
//setInterval(getAllMeterAndStartRead, 20000);

//Modbus.addRecord('192.168.1.2',11, new Date(2022, 3,12), 100);

//test Modbus.dataFilterByMonth

  
  
  process.on('uncaughtException', err=> {
    console.error(err && err.stack);
  })
  
 
  module.exports = app;


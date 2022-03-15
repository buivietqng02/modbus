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
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 24*60*60*1000}
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
/* app.use(function(req, res, next){
  if (req.session) {
    if (!req.session.passport) {res.redirect('/signin');}
    else next();
  }
        }) */
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
/*  try {
  mongoose.connect('mongodb+srv://vietbk02:vietbk02@cluster0.8yaqq.mongodb.net/nodemailer?retryWrites=true&w=majority',
  {
    useUnifiedTopology: true,
    useNewUrlParser: true
} 
    );
   }
catch (err) {
  console.log('error when access db'+ err.message);
}

    const db= mongoose.connection; 
    db.once('open', ()=> {console.log('connected to db remote')}) */
    try {
      mongoose.connect('mongodb://localhost:27017/test',
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
        
        console.log(db);
       
        db.once('open', ()=> {
          console.log('connected to db local');
         

        })

require('./config/passport');
//app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler

//require('./modbus');

//section for read modbus data

var Modbus= require('./modbus');

async function getAllMeterAndStartRead() {
  
  try{
  var r=await ModbusData.find({});
    console.log(r)
  }
  catch(err) {
    console.log(err);
    return;
  }
  for(let meter of r) {
    Modbus.readData(meter, 0);
  }

}
getAllMeterAndStartRead();


/* console.log(createRecord(new Date(2021, 1,1,12,0,0), 100));
  var d=  Modbus.addRecord('192.168.1.3', 3, createRecord(new Date(2021, 1,1,12,0,0), 100)); 
  d.then(m=> Modbus.dataFilterByMonth(m, '2021-02'))
  .then(d=>Modbus.reducerMonth(d))
  .then(d=>{console.log("reduce");
        console.log(d)}); */
        

    
 
 


  
  
  
  
 
  module.exports = app;


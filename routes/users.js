var express = require('express');
var router = express.Router();
var passport= require('passport');
var ModbusData= require('../models/modbusData');
var Modbus= require('../modbus.js');
var User= require('../models/user.model');
var fs= require('fs');


const {body, validationResult} = require('express-validator');
/* GET users listing. */
//index page
router.get('/', function(req, res, next) {
  res.render('index');
});
//dang nhap page
router.get('/signin', function(req, res, next){
  var messages= req.flash('error');
  res.render('signin', 
  {
    messages: messages,
    
    
  });
});
//create a new user

//signup

//sign in
router.post('/signin', passport.authenticate('local.signin', {
  
  failureRedirect:'/signin',
  failureFlash: true
}), function(req, res){
  console.log(req.session);
  if (req.user.email=="admin@gmail.com") {res.redirect('/admin/users');}

 else  res.redirect('/user/'+req.user.id);
});
//plot a user data using query month or date
router.get('/user/:id', async function(req, res, next){
  try {
 var user= await User.find({_id: req.params.id});
  }
  catch(err) {
    next(err);
    }
    if (!user) 
    {res.end('no user found');return }
 console.log(user[0].email);
 
 var formActionDate=  req.url+'/plot/date';
var formActionMonth= req.url+'/plot/month';
var formViewBill= req.url+ '/invoice';
 res.render('user_page', {email: user[0].email, req: req, 
  formActionDate:formActionDate,
   formActionMonth:formActionMonth,
   formViewBill: formViewBill });
})
//return data to plot
router.get('/user/:id/plot/date',async  function(req, res, next){

    var date= req.query.date
    console.log('data input: '+ date);
     User.findById({_id: req.params.id}, function(err, result){
      if (err) {next(err);}
      console.log(result);
      var ip= result.ipAddress;
      var formActionDate=  '/user/'+ req.params.id + '/plot/date';//for action form plot
      var formActionMonth=  '/user/'+ req.params.id + '/plot/month';//for action form plot
      var formViewBill= '/user/'+ req.params.id+ '/invoice';
      ModbusData.findOne({ip_address: ip}, function(err, mb){
      
          if (err) {next(err);}
          console.log(mb);
          if ((mb=== null)||(mb===undefined)) {
            console.log("here");
            res.render("plot", {data: false, formActionDate: formActionDate, 
              formActionMonth: formActionMonth,
              formViewBill: formViewBill});

          return;
      }
          else {
            var filterArr=Modbus.dataFilterByDate(mb.datas, date);
            var reduceArr= Modbus.reducerDate(filterArr);
            var time=[];
            var value=[];
            reduceArr.forEach(data=> {
            time.push(data.time)
            value.push(data.value)
          });
          res.render('plot', {time1: time, value1: value, data:true, 
            formActionDate: formActionDate, 
          formActionMonth: formActionMonth,
          formViewBill: formViewBill});
          }
      });
  })
});
//get all users
router.get('/user/:id/plot/month',async  function(req, res, next){
    const q= req.query.month;//month
    
    User.findById({_id: req.params.id}, function(err, result){
      if (err) {next(err);}
      console.log(result);
      var ip= result.ipAddress;
      var formActionDate=  '/user/'+ req.params.id + '/plot/date';
      var formActionMonth=  '/user/'+ req.params.id + '/plot/month';
      var formViewBill=  '/user/'+ req.params.id + '/invoice';
      ModbusData.findOne({ip_address: ip}, function(err, mb){
          if (err) {next(err);}
          if ((mb=== null)||(mb===undefined)) {
          console.log("here");
          res.render("plot", {data: false, formActionDate: formActionDate, 
          formActionMonth: formActionMonth,
          formViewBill: formViewBill});
          return;
    }
        else {
          var datas= mb.datas;
          var filterArr= Modbus.dataFilterByMonth(datas,q);
          var reduceArr= Modbus.reducerMonth(filterArr);
          var time=[];
          var value=[];
          reduceArr.forEach(data=> {
          time.push(data.time)
          value.push(data.value)
        });
        console.log("original length: "+ datas.length);
        console.log("filter length: "+ filterArr.length);
        console.log("reducer length: "+ reduceArr.length);
        
        res.render('plot', {time1: time, value1: value, data:true,
           formActionDate: formActionDate,
          formActionMonth: formActionMonth,
          formViewBill: formViewBill});
        }
    });
})
  
});


router.get('/change_password_get', function(req, res){
  res.render('change_password')
})
router.post('/change_password_post', 
  
 async function(req, res, next){
   var errorMessage;
  console.log(req.body.email);
  console.log(req.body.oldpassword);
  console.log(req.body.newpassword);
    
  User.findOne({email: req.body.email}, function(err, user){
    if (err) {return next(err);}
    
    if (user==null || user==undefined)
    {
       console.log('no user');
       errorMessage = "changed password not successfully: Wrong email or password";
       res.render('signin', {errorMessage: errorMessage});

    }
     else {
       console.log(user.password);
      var re= user.validPassword(req.body.oldpassword);
      console.log(re);
      if (re) {
      user.password= user.encryptPassword(req.body.newpassword);
      user.save(function(err){
        if (err) throw err;
        req.flash('info', 'You have changed the password successfully');
        res.redirect('/signin');
      });
    } else {
        errorMessage= "old password is not correct"
       res.render('signin',{errorMessage: errorMessage});
    }

     }
    
  });
})
router.get('/user/:id/invoice', async function(req, res){
  // aledy have user and month
  var user= await User.findById({_id: req.params.id});
  var month= req.query.month;
  var path= './bill/' + user.email+ '_bill/'+ month+'.html';
  
  try {
  var stats= fs.statSync(path);
  }
  catch (err) {res.end("no invoice found");}
  
  if (stats) {
  var html=fs.readFileSync(path, 'utf8');
  
   res.send(html);
  
  
  }
})

module.exports = router;

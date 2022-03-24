var express = require('express');
var router = express.Router();
var passport= require('passport');
var ModbusData= require('../models/modbusData');
var Modbus= require('../modbus.js');
var User= require('../models/user.model');
var async = require('async');

router.get('/users',  function(req, res, next){
    
     User.find({}).populate('meter')
     .exec(function(err, list){
       if (err) {return next(err);}
       res.render('users', {list: list})
     })
  
  
    
  
  })
  router.get('/users/search', async function(req, res, next){
    
    User.find({}).populate('meter')
    .exec(function(err, users){
      var info= req.query.search_info;
      console.log(req.query.search_info);
      var filterUsers=[];
      users.forEach(function(user){
          if ((user.email && user.email.includes(info))
          || (user.username && user.username.includes(info))
          || (user.room && user.room.includes(info)))
          {
              filterUsers.push(user);
              
          }
      })
      res.render('users', {list: filterUsers, search: req.query.search_info});
    })
   
  
  })
  router.post('/user/:id/delete', async function(req, res, next){
        var meters= await ModbusData.find({});
        for (let meter of meters) {
          if (meter.user==req.params.id) {
            meter.user=null;
            await meter.save();
            break;
          }
        }
        await User.deleteOne({_id: req.params.id})
        res.redirect('/admin/users');
     
  })
  



  router.get('/user/:id/delete', function(req, res, next){
    User.findById(req.params.id).exec(function(err, user){
      if (err) {return next(err);}
      if (!user) res.redirect('/users');
      res.render('user_delete', {user:user});
    })
  })
  router.get('/signup', async function(req, res, next){
    var messages= req.flash('error');
    try {
        var meters= await ModbusData.find({});

    }

    catch(err) {
      res.send("there is error when processing. pls try again");
      return;

    }
    let meters1=[];
    for (let meter of meters) {
      if (!meter.user) meters1.push(meter);
    }
    res.render('signup', {
      messages: messages,
      hasErrors: messages.length>0,

      meters: meters1
    });
  })
  router.post('/signup', passport.authenticate('local.signup', {
    successRedirect: '/admin/users',
    failureRedirect:'/admin/signup',
    failureFlash: true
  }));
  router.get('/users/:id', async function(req, res, next){
    try {
    var user= await User.findById({_id: req.params.id});
  }
  catch(err) {
      throw(err);
  }
    res.render('user_data', {user: user});
  })
  router.get('/users/:id/change_info',async function(req,res){
    try {
      var meters= await ModbusData.find({});

  }

  catch(err) {
    res.send("there is error when processing. pls try again");
    return;

  }
  let meters1=[];
  for (let meter of meters) {
    if (!meter.user) meters1.push(meter);
  }
  User.findById({_id: req.params.id}).populate('meter').
  exec(function(err, user){
    if (err) {return next(err);}
    res.render('change_user_info', {user: user, meters: meters1})

  })
    
  })
  router.post('/users/:id/change_info', async function(req, res, next){
    if (req.body.meter) { 
      var splitData= req.body.meter.split(',');
      var room= splitData[0].split(':')[1].trim();
      var slaveId=splitData[1].split(':')[1].trim();
      var ip= splitData[2].split(':')[1].trim();
     var meter= await ModbusData.findOne({room: room, slaveId: slaveId, ip_address: ip});
     var user= await User.findById({_id: req.params.id});
     if (user)  user.meter= meter._id;
     await user.save();
     meter.user= user._id;
     await meter.save();
    
    }
    res.render('change_user_info_post');
   /*  res.send("dfd"); */
    


  })

  router.get('/users/:id/plot/date', function(req, res, next){
    var date= req.query.date
    console.log('data input: '+ date);
     User.findById({_id: req.params.id}, function(err, result){
      if (err) {next(err);}
      console.log(result);
      var ip= result.ipAddress;
      

      ModbusData.findOne({ip_address: ip}, function(err, mb){
      
          if (err) {next(err);}
          console.log(mb);
          if ((mb=== null)||(mb===undefined)) {
            console.log("here");
            res.render("admin_user_plot", {data: false});

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
          
          
          res.render('admin_user_plot', {time1: time, value1: value, data:true
         });
          }
      });
  })
  })
  router.get('/users/:id/plot/month', function(req, res, next){
    const q= req.query.month;//month
    
    User.findById({_id: req.params.id}, function(err, result){
      if (err) {next(err);}
      console.log(result);
      var ip= result.ipAddress;
      
      ModbusData.findOne({ip_address: ip}, function(err, mb){
          if (err) {next(err);}
          if ((mb=== null)||(mb===undefined)) {
          console.log("here");
          res.render("admin_user_plot", {data: false 
          });
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
        
        res.render('admin_user_plot', {time1: time, value1: value, data:true
        });
        }
    });
})
  
  })
  router.get('/users/plot/date', async function(req, res, next){
    
     

    res.send('under construction');
  })
  router.get('/users/plot/month', function(req, res, next){
    res.send("under construction");
  })
  router.get('/users/bill_create/bill', async function(req, res){
      var month= req.query.month;
      
      //Modbus.createBill
      //Modbus.convertToPDF
      console.log(month);
         var users= await User.find({});
         users.forEach(function(user){
         Modbus.createBill(user._id, month);
      
        }) 
        res.render('user_invoice', {message: "done"});
        
      
      
      
      
  })
  router.get('/users/send_email', function(req, res){

  })
  router.get('/overview', function(req, res){

      res.render('overview');
  })
  //send data to overview
  router.get('/data', function(req, res, next){
        User.findOne({email: process.env.admin_email}).populate('meter')
        .exec(function(err,admin){
          if (err) {return next(err);}
          res.json(admin.meter.datas[admin.meter.datas.length-1])
        })
 
         
   
  })




  router.get('/create_meter', function(req, res){
    res.render('meter');
  })
  


  router.post('/create_meter', async function(req, res){
    const room= req.body.room;
    var ip= req.body.ip1+'.'+ req.body.ip2+'.'+ req.body.ip3+'.'+ req.body.ip4;
    var slaveId= req.body.slaveId;
   var findMeter= await ModbusData.findOne({ip_address: ip, slaveId: slaveId})
    if (findMeter==null|| findMeter==undefined) {
      var meter= new ModbusData({ip_address: ip, slaveId: slaveId, room: room});
      meter.save(function(err){
       if (err) { res.render("create_meter_post", {message: "error when create new meter: "+ err});
        return false;
      }
      else res.render("create_meter_post", {message: "new meter is created"});
      });
    }
    else res.render("create_meter_post", {message: "new meter is created"});
      
  })
  router.get('/meters',  function(req, res, next){
     ModbusData.find({})
     .populate('user')
     .exec(function(err, list){
        if (err) {return next(err);}
        res.render("meters_get", {meters: list, status: Modbus.status});
     });
    
    
  
  })
  router.get('/meters/search', async function(req, res, next){
    
    let meters= await ModbusData.find({}).populate('user').exec();
    var info= req.query.search_info;
    console.log(req.query.search_info);
    var filterMeters=[];
    meters.forEach(function(meter){
        if ((meter.ip_address && meter.ip_address.includes(info))
        || (meter.room && meter.room.includes(info)))
        
        {
            filterMeters.push(meter);
            
        }
    })
    res.render('meters_get', {meters: filterMeters, status: Modbus.status, search: req.query.search_info});

  
  })
  router.get('/meter/:id/delete',async function(req, res, next){
    try {
    var meter= await  ModbusData.findById(req.params.id)
    }
    catch(err) {
      return next(err);
    }
    res.render('meter_delete', {meter: meter,status: Modbus.status});
  })
  router.post('/meter/:id/delete',async  function(req, res, next){
      var users= await User.find({});
      for(let user of users) {
        if (user.meter== req.params.id) {
          user.meter= null;
          await user.save();
        }
      }
      await ModbusData.deleteOne({_id: req.params.id});

        res.redirect('/admin/meters');
      })
    

  //id is the ObjectId of user being called, send to brower in js code
  router.get('/get_current_kw/:id',  async function(req, res, next){
    try {
    var meter= ModbusData.findById(req.params.id);
    }
    catch (err) {
      console.log(err);
      next(err);
    }
    res.json(meter.datas[meter.datas.length-1]);

  })
 //get  data kwh when month or day, processing the data in the maner appropriagte
 //if date read hour first  /getsomething/:id(of user)?month=or date=
 //so whenever you want data 




  

  module.exports= router;

var passport= require('passport');
var User= require('../models/user.model');
var ModbusData= require('../models/modbusData')
var LocalStrategy= require('passport-local').Strategy;
passport.serializeUser(function(user, done){
    done(null, user.id);
})
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    })
})
passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField:'password',
    passReqToCallback: true
}, async function(req, email, password, done){
    User.findOne({'email': email},  async function(err, user){
        if (err) {return done(err);}
        if (user) {
            return done(null, false, {message: 'Email already in use'})
        }
        console.log("email: " +email);
        const reg= /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!reg.test(email)) {
            return done(null,false, {message: 'Email is not valid'});
        }
        var newUser= new User();
        newUser.email= email;
        newUser.password= newUser.encryptPassword(password);
        newUser.username= req.body.username;
        console.log(req.body.meter);
        if (req.body.meter) { 
        var splitData= req.body.meter.split(',');
        var room= splitData[0].split(':')[1].trim();
        var slaveId=splitData[1].split(':')[1].trim();
        var ip= splitData[2].split(':')[1].trim();
       var meter= await ModbusData.findOne({room: room, slaveId: slaveId, ip_address: ip});
       newUser.meter= meter._id;
       
       console.log(meter);
        }
        newUser.save(function(err, result){
            if (err) {
                return done(err);
            }
            if (req.body.meter) {
            meter.user= result._id;
            
            meter.save(function(err){
                if (err) console.log(err);
                return;
            })
        }
            return done(null, newUser);
        })
    })
}));
passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done){
  User.findOne({'email': email}, function(err, user){
      if (err) {return done(err);}
      if ((user==null) || (user==undefined)) {
          return done(null, false, {message: 'not username found'});
      }
      if (!user.validPassword(password)) {
          return done(null, false,{message: 'wrong password'});
      }
      return done(null, user);
  })  
}
))
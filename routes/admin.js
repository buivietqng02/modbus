var express = require("express");
var router = express.Router();
var passport = require("passport");
var ModbusData = require("../models/modbusData");
var Modbus = require("../modbus.js");
var User = require("../models/user.model");
var async = require("async");

router.get("/users", function (req, res, next) {
  User.find({})
    .populate("meter")
    .exec(function (err, list) {
      if (err) {
        return next(err);
      }
      res.render("users", { list: list, search: "" });
    });
});
router.get("/users/search", async function (req, res, next) {
  User.find({})
    .populate("meter")
    .exec(function (err, users) {
      var info = req.query.search_info;
      console.log(req.query.search_info);
      var filterUsers = [];
      users.forEach(function (user) {
        if (
          (user.email && user.email.includes(info)) ||
          (user.username && user.username.includes(info)) ||
          (user.room && user.room.includes(info))
        ) {
          filterUsers.push(user);
        }
      });
      res.render("users", { list: filterUsers, search: req.query.search_info });
    });
});
router.post("/user/:id/delete", async function (req, res, next) {
  var meters = await ModbusData.find({});
  for (let meter of meters) {
    if (meter.user == req.params.id) {
      meter.user = null;
      await meter.save();
      break;
    }
  }
  await User.deleteOne({ _id: req.params.id });
  res.redirect("/admin/users");
});

router.get("/user/:id/delete", function (req, res, next) {
  User.findById(req.params.id).exec(function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) res.redirect("/users");
    res.render("user_delete", { user: user });
  });
});
router.get("/signup", async function (req, res, next) {
  var messages = req.flash("error");
  try {
    var meters = await ModbusData.find({});
  } catch (err) {
    res.send("there is error when processing. pls try again");
    return;
  }
  let meters1 = [];
  for (let meter of meters) {
    if (!meter.user) meters1.push(meter);
  }
  res.render("signup", {
    messages: messages,
    hasErrors: messages.length > 0,

    meters: meters1,
  });
});
router.post(
  "/signup",
  passport.authenticate("local.signup", {
    successRedirect: "/admin/users",
    failureRedirect: "/admin/signup",
    failureFlash: true,
  })
);
router.get("/users/:id",  function (req, res, next) {
  
     User.findById({ _id: req.params.id })
     .populate('meter')
     .exec(function(err, user){
       if (err) {return next(err);}
       res.render("user_data", { user: user });
     })
 
 
});
router.get("/users/:id/change_info", async function (req, res) {
  try {
    var meters = await ModbusData.find({});
  } catch (err) {
    res.send("there is error when processing. pls try again");
    return;
  }
  let meters1 = [];
  for (let meter of meters) {
    if (!meter.user) meters1.push(meter);
  }
  User.findById({ _id: req.params.id })
    .populate("meter")
    .exec(function (err, user) {
      if (err) {
        return next(err);
      }
      res.render("change_user_info", { user: user, meters: meters1 });
    });
});
router.post("/users/:id/change_info", async function (req, res, next) {
  if (req.body.meter) {
    var splitData = req.body.meter.split(",");
    var room = splitData[0].split(":")[1].trim();
    var slaveId = splitData[1].split(":")[1].trim();
    var ip = splitData[2].split(":")[1].trim();
    var meter = await ModbusData.findOne({
      room: room,
      slaveId: slaveId,
      ip_address: ip,
    });
    console.log(meter);
    var user = await User.findById({ _id: req.params.id });
    if (user) {
      if (user.meter) {
        const oldMeter = await ModbusData.findById({ _id: user.meter });
        oldMeter.user = null;
        await oldMeter.save();
      }
      user.meter = meter._id;
      await user.save();
      meter.user = user._id;
      await meter.save();
    }
  }
  res.render("change_user_info_post");
  /*  res.send("dfd"); */
});

router.get("/users/:id/plot/date", function (req, res, next) {
  var date = req.query.date;
  console.log("data input: " + date);
  User.findById({ _id: req.params.id }, function (err, result) {
    if (err) {
      next(err);
    }
    console.log(result);
    var ip = result.ipAddress;

    ModbusData.findOne({ ip_address: ip }, function (err, mb) {
      if (err) {
        next(err);
      }
      console.log(mb);
      if (mb === null || mb === undefined) {
        console.log("here");
        res.render("admin_user_plot", { data: false });

        return;
      } else {
        var filterArr = Modbus.dataFilterByDate(mb.datas, date);
        var reduceArr = Modbus.reducerDate(filterArr);
        var time = [];
        var value = [];
        reduceArr.forEach((data) => {
          time.push(data.time);
          value.push(data.value);
        });

        res.render("admin_user_plot", {
          time1: time,
          value1: value,
          data: true,
        });
      }
    });
  });
});
router.get("/users/:id/plot/month", function (req, res, next) {
  const q = req.query.month; //month

  User.findById({ _id: req.params.id }, function (err, result) {
    if (err) {
      next(err);
    }
    console.log(result);
    var ip = result.ipAddress;

    ModbusData.findOne({ ip_address: ip }, function (err, mb) {
      if (err) {
        next(err);
      }
      if (mb === null || mb === undefined) {
        console.log("here");
        res.render("admin_user_plot", { data: false });
        return;
      } else {
        var datas = mb.datas;
        var filterArr = Modbus.dataFilterByMonth(datas, q);
        var reduceArr = Modbus.reducerMonth(filterArr);
        var time = [];
        var value = [];
        reduceArr.forEach((data) => {
          time.push(data.time);
          value.push(data.value);
        });
        console.log("original length: " + datas.length);
        console.log("filter length: " + filterArr.length);
        console.log("reducer length: " + reduceArr.length);

        res.render("admin_user_plot", {
          time1: time,
          value1: value,
          data: true,
        });
      }
    });
  });
});
router.get("/users/plot/date", async function (req, res, next) {
  res.send("under construction");
});
router.get("/users/plot/month", function (req, res, next) {
  res.send("under construction");
});
router.get("/users/bill_create/bill", async function (req, res, next) {
  
    var month = req.query.month;
    var promiseList=[];
    console.log(month);
    var users = await User.find({});
    users.forEach(function (user) {
      promiseList.push(Promise.resolve(Modbus.createBill(user._id, month)));
    });
    Promise.all(promiseList)
    .then(values=> {
      console.log(values);
      console.log("done");
      res.json({ message: "done" });

    })
    .catch(err=> res.json({message: "error occured"}))
  
    
 
  
});
router.get("/users/send_email", function (req, res) {});
router.get("/overview", function (req, res) {
  var user_id = req.session.passport.user;

  res.render("overview", { id: user_id });
});
//send data to overview
router.get("/:id/current_kw", function (req, res, next) {
  ModbusData.findOne({ ip_address: "127.0.0.1" }, function (err, meter) {
    res.send(meter.datas[meter.datas.length - 1]);
  });
});

router.get("/create_meter", function (req, res) {
  res.render("meter");
});

router.post("/create_meter", async function (req, res) {
  const room = req.body.room;
  var ip =
    req.body.ip1 + "." + req.body.ip2 + "." + req.body.ip3 + "." + req.body.ip4;
  var slaveId = req.body.slaveId;
  var findMeter = await ModbusData.findOne({
    ip_address: ip,
    slaveId: slaveId,
  });
  if (findMeter == null || findMeter == undefined) {
    var meter = new ModbusData({
      ip_address: ip,
      slaveId: slaveId,
      room: room,
    });
    meter.save(function (err) {
      if (err) {
        res.render("create_meter_post", {
          message: "error when create new meter: " + err,
        });
        return false;
      } else res.render("create_meter_post", { message: "new meter is created" });
    });
  } else res.render("create_meter_post", { message: "new meter is created" });
});
router.get("/meters", function (req, res, next) {
  ModbusData.find({})
    .populate("user")
    .exec(function (err, list) {
      if (err) {
        return next(err);
      }
      res.render("meters_get", {
        meters: list,
        status: Modbus.status,
        search: "",
      });
    });
});
router.get("/meters/search", async function (req, res, next) {
  let meters = await ModbusData.find({}).populate("user").exec();
  var info = req.query.search_info;
  console.log(req.query.search_info);
  var filterMeters = [];
  meters.forEach(function (meter) {
    if (
      (meter.ip_address && meter.ip_address.includes(info)) ||
      (meter.room && meter.room.includes(info))
    ) {
      filterMeters.push(meter);
    }
  });
  res.render("meters_get", {
    meters: filterMeters,
    status: Modbus.status,
    search: req.query.search_info,
  });
});
router.get("/meter/:id/delete", async function (req, res, next) {
  try {
    var meter = await ModbusData.findById(req.params.id);
  } catch (err) {
    return next(err);
  }
  res.render("meter_delete", { meter: meter, status: Modbus.status });
});
router.post("/meter/:id/delete", async function (req, res, next) {
  var users = await User.find({});
  for (let user of users) {
    if (user.meter == req.params.id) {
      user.meter = null;
      await user.save();
    }
  }
  var meter = await ModbusData.findById({ _id: req.params.id });
  if (Modbus.socketList[meter.info]) {
    var socket = Modbus.socketList[meter.info];
    if (socket.connecting) {
      console.log("try to connect");
    }
    //socket.unref();
    // socket.destroy();
    //socket.emit('close');

    socket.removeAllListeners("close");
    socket.removeAllListeners("connect");
    socket.destroy();
    delete Modbus.socketList[meter.info];
  }
  await ModbusData.deleteOne({ _id: req.params.id });

  res.redirect("/admin/meters");
});

//id is the ObjectId of user being called, send to brower in js code
router.get("/get_current_kw/:id", async function (req, res, next) {
  try {
    var user = await User.findById({ _id: req.params.id });
    console.log(user);

    if (!user || !user.meter) {
      return res.json("no data");
    }
    var meter = await ModbusData.findById({ _id: user.meter });
    if (!meter || !meter.datas || meter.datas.length == 0)
      return res.json("no database");
    console.log(meter.datas[meter.datas.length - 1].value[0]);
    res.json(meter.datas[meter.datas.length - 1].value);
  } catch (error) {
    next(error);
  }
});
//get  data kwh when month or day, processing the data in the maner appropriagte
//if date read hour first  /getsomething/:id(of user)?month=or date=
//so whenever you want data

router.get("/:id/plot", async function (req, res, next) {
  try {
    var user = await User.findById({ _id: req.params.id });
    if (!user) {
      return res.json("no user found");
    }
    if (!user.meter) {
      return res.json("no meter connected with user");
    }
    var meter = await ModbusData.findById({ _id: user.meter });
    var date = req.query.date; //yyyy-mm-dd
    var month = req.query.month;
    if (date) {
      if (!meter.datas) {
        return res.json("meter with no data");
      }
      console.log(Modbus.dataFilterByDate(meter.datas, date));
      var data = Modbus.dataFilterByDate(meter.datas, date);
      if (data.length == 0) {
        return res.json("no data on this date");
      }
      res.json(data);
    }
    if (month) {
      if (!meter.datas) {
        return res.json("meter with no data");
      }
      console.log(Modbus.dataFilterByMonth(meter.datas, month));
      var data = Modbus.dataFilterByMonth(meter.datas, month);
      if (data.length == 0) {
        return res.json("no data on this date");
      }
      res.json(data);
    }
  } catch (err) {
    next(err);
  }
});

router.post("/add_records", async function (req, res) {
  var body = req.body;
  console.log(req.body);
  console.log(body.ip);
  console.log(body.slaveId);
  console.log(body.date);
  console.log(body.n);
  Modbus.addRecord(
    body.ip,
    Number(body.slaveId),
    new Date(body.date),
    Number(body.n)
  );
  res.json("added");
});

router.get("/create_bill", function (req, res, next) {
  res.render("create_bill");
});

module.exports = router;

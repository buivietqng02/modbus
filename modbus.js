const modbus= require('jsmodbus');
const net= require('net');
const fs= require('fs');
var ModbusData= require('./models/modbusData');
var mongoose= require('mongoose');
var User= require('./models/user.model');
var pdf= require('html-pdf');
const path= require('path');

var status={};
const nodemailer= require('nodemailer');
exports.status= status;
     exports.readData=async function(meter, registerAddress){
        const socket= new net.Socket();
        //client thi chi co mot, 
        const client= new modbus.client.TCP(socket,meter.slaveID);
  
        var options= {
              'host': meter.ip_address,
              'port': "502"
          };
          socket.connect(options);
          socket.on('connect', async function(){
          console.log('connected  to: '+ socket.remoteAddress);
          status[meter.info]="connected";
          var t= setInterval(async function(){
              
            try {

            var r= await client.readHoldingRegisters(registerAddress, 3);
            }
            catch(err){
              console.log(err);
              clearInterval(t);
              return false;
            }console.log("hi");
            console.log(r.response._body._valuesAsArray[0]);

              
            let obj= {time: new Date(), value:r.response._body._valuesAsArray }
            
            
            meter.datas.push(obj);
            meter.save(function(err){
              if (err) console.log(err);
              clearInterval(r);
            });
           
         
           
            }, 20000)
           
        
            });

              socket.on('error', function(error){
              console.log('error when access ip:'+ meter.ip_address+' error code '+ error.code);
              status[meter.info]='error when access ip:'+ meter.ip_address+' error code '+ error.code;
                
               socket.connect(options);// if error try to reconnect
      //socket.end();
  
})

}



//delete all users
exports.destroy= async function() {
    var users= await User.find({});
    users.forEach(async function(user) {
        await user.remove();
    })
    
}
exports.reducerDate=function(arr) {
  let retArr=[];
  let done;
    for (let i=0; i<24; i++){
      done=false;
    
      for (let j=0; j< arr.length; j++){
        if (new Date(arr[j].time).getHours()==i){
              retArr.push(arr[j]);
              done= true;
              break;
        }
        
      }
      if (!done) retArr.push(null);
     
    }
    console.log(retArr.length);
    return retArr;
}
exports.dataFilterByDate= function(datas, dateInput){
    //function get number of distributedd point from an array
    // datas in data array from modbus data of mongodb
    // dateInput is in string format yyyy-mm-dd
    
    var obj= dateInput.split('-');
    var year= obj[0];
    var month= obj[1];
    var date= obj[2];
    console.log(year);
    console.log(month);
    console.log(date);
    var filter= datas.filter(data=> {
      return  (new Date(data.time).getFullYear()==year)&&((new Date(data.time).getMonth()+1)==month)&&(new Date(data.time).getDate()== date)
      })
    
    console.log("filter length: "+filter.length);
    console.log(filter);
    return filter;
}
exports.reducerMonth=function(arr) {
  //assume arr hold all data in the same month
  let retArr=[];
  let done;
  for (let i=0; i< 31; i++)
  {
    done= false;
    for (let j=0; j< arr.length;j++){
      if (arr[j].time.getDate()==(i+1)) {
        retArr.push(arr[j]);
        done=true;
        break;

      }
    }
    if (!done) retArr.push(null);
    }
  return retArr;

}
exports.dataFilterByMonth = function(datas, monthFormat){
    //function get number of distributedd point from an array
    // month format yyyy-mm
    
    var obj= monthFormat.split('-');
    var year= obj[0];
    var month= obj[1];
    console.log(year);
    console.log(month);
    
    var filter= datas.filter(data=> {
      return  (new Date(data.time).getFullYear()==year)&&((new Date(data.time).getMonth()+1)==month)
      })
    
    console.log("filter length: "+filter.length);

    return filter;
}
function dataFilterByMonth(datas, monthFormat){
  //function get number of distributedd point from an array
  // month format yyyy-mm
  
  var obj= monthFormat.split('-');
  var year= obj[0];
  var month= obj[1];
  console.log(year);
  console.log(month);
  
  var filter= datas.filter(data=> {
    return  (new Date(data.time).getFullYear()==year)&&((new Date(data.time).getMonth()+1)==month)
    })
  
  console.log("filter length: "+filter.length);

  return filter;
}




//path is where invoice pdf file is stored
function sendEmail(email, path){
  var transporter= nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.email,
      pass: process.env.password
    }
  });
 
  
  var mailOptions= {
    from: process.env.email,
    to: email,
    subject: `send email ${email}`,
    text: 'that easy',
    attachments: [{
      filename:'invoice.pdf',
      path: path
    }]
      
  } ;
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('email sent '+ info.response);
    }
  })
}

//how to deal with this one
//assum a user with email, so create a user folder to hold bill
//and create an html file every month then convert to pdf
exports.createFolder=  async function() {
  if (!fs.existsSync('./bill'))
  {
    fs.mkdirSync('./bill');
  }
    var users= await User.find({});
    users.forEach(function(user){
      var path= './bill/'+ user.email+'_bill';
    if (!fs.existsSync(path)){
      fs.mkdirSync(path);
    }
    })
    
    
  
}


exports.createBill=async function(user_id, month) {//month in format  string yyyy-mm
    try {
  var user= await User.findById({_id: user_id});
    }
    catch(err) {
      console.log(err);
    }
    if (user) {
      console.log(user);
      try {
        var modbusData= await ModbusData.findOne({ip_address: user.ipAddress});
      }
      catch(err) {
        console.log(err);
        return null;
      }
        if (modbusData== null) return null;
        var filterData= dataFilterByMonth(modbusData.datas, month);
        var total;
        if (filterData.length==0) total=0;

         else total= (filterData[filterData.length-1].value- filterData[0].value).toFixed(2);
        var amount= (total*2000).toFixed(2);
        console.log(filterData[filterData.length-1]);
        console.log(filterData[0]);
        console.log(total);

        var html= `<html><head></head>`;
        html+=`<body><div style= "border: 1px solid"><h1>INVOICE</h1><h3>Bill to ${user.email}</h3>`;
        html+=`<h5>Total power comsumption in month ${month} is: ${total}</h5>`;
        html+= `<p>Total charge: ${amount} VND</p>`;
        html+='<p>Please pay before ...</p>';
        html+='</div></body></html>'
        if (!fs.existsSync('./bill')) //tao thu muc bill truoc
          {
              fs.mkdirSync('./bill');
          }
          var path= './bill/'+ user.email+'_bill';// tao thu muc con cho user
          if (!fs.existsSync(path)){
            fs.mkdirSync(path);

          }
        var filePath=path+ '/'+ month+ '.html';
        fs.writeFileSync(filePath, html);
        convertToPDF(filePath);
    }

}
function convertToPDF(filename){
    fs.readFile(filename, 'utf8', function(err, result){
      if (err) console.log(err);
      else console.log('file html: '+ result);
    var options= {
      format: 'Letter'
      } ;
     var pdfpath= path.parse(filename).dir+'/'+path.parse(filename).name +'.pdf';
     pdf.create(result, options).toFile(pdfpath, function(err, res){
        if (err) return console.log(err);
        console.log("converted ok");
        sendEmail('quocvietqng02@gmail.com', pdfpath);
      })

  });
}
exports.deleteFile= function(filename){
  if (fs.existsSync(filename)) {
    fs.unlink(filename, function(err){
      if (err) console.log(err);
      else console.log('removed');
    })
  }
}
//assume data: [kw, kwh]
exports.addRecord= async function(ip,slaveId, records ){
  try {
  var data= await ModbusData.findOne({ip_address: ip, slaveId: slaveId});
  }
  catch (err) {
    console.log(err);

    return;
  }
  if (data==null||data==undefined) {
    console.log("no meter");
      return;
    }
   
   else {
    console.log("meter length: "+ data.datas.length)
    data.datas=data.datas.concat(records);
    data.save(function(err){
    if (err) {console.log(err);
   
      return;
    }
   
  }) 
    return data.datas
  }

}
exports.createRecord =function(dateInput, n){
  var record=[];
  var year= dateInput.getFullYear();
  var month= dateInput.getMonth();
  var date= dateInput.getDate();
  var hour= dateInput.getHours();
  var minute= dateInput.getMinutes();
  for (let i=0; i< n;i++){
    var  d= new Date(year, month, date, hour, minute+ 10*i, 0);
    
    record.push({time:d, value: (10*Math.random()+10*i).toFixed(2) })
  }
  console.log(date);
  return record;
}
//viet doan chuong trinh automating job 


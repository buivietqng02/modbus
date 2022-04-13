const modbus= require("jsmodbus");
const net= require("net");
const fs= require("fs");
var ModbusData= require("./models/modbusData");
var mongoose= require("mongoose");
var User= require("./models/user.model");
var pdf= require("html-pdf");
const path= require("path");

var status={};
const nodemailer= require("nodemailer");
exports.status= status;
var socketList= {};
exports.socketList= socketList;
exports.readData=async function(meter, registerAddress){
	const socket= new net.Socket();
	//client thi chi co mot, 
	const client= new modbus.client.TCP(socket,meter.slaveID);
	socketList[meter.info]= socket;
	var options= {
		"host": meter.ip_address,
		"port": "502"
	};
	socket.connect(options);
	socket.on("connect", async function(){
		console.log("connected  to: "+ socket.remoteAddress);
		status[meter.info]="connected";
		var t= setInterval(async function(){
			
              
			try {

				var r= await client.readHoldingRegisters(registerAddress, 3);//assum [kw, kwh, some else]

			}
			catch(err){
				console.log(err);
				clearInterval(t);
				setTimeout( function() {socket.connect(options);
				}, 20000);// if error try to reconnect
        return;
			}
			console.log(r.response._body._valuesAsArray[0]);

              
			let obj= {time: new Date(), value:r.response._body._valuesAsArray };
            
            
			meter.datas.push(obj);
			meter.save(function(err){
				if (err) console.log(err);
				clearInterval(r);
			});
           
         
           
		}, 20000);
           
        
	});

	socket.on("error", function(error){
		console.log("error when access ip:"+ meter.ip_address+" error code "+ error.code);
		status[meter.info]="error when access ip:"+ meter.ip_address+" error code "+ error.code;
        if (socket.destroyed) {
			console.log("socket is destroyd");
		}
		
  
	});
 	socket.on("close", function(){
		console.log("socket is closed");
		setTimeout( function() {socket.connect(options);
		}, 20000);
		
	}) 
};



//delete all users
exports.destroy= async function() {
	var users= await User.find({});
	users.forEach(async function(user) {
		await user.remove();
	});
    
};
var reducerDate=function(arr) {
	let retArr=[];
	for (let hour=0; hour<=23; hour++) {
		for (let index=0;index< arr.length; index++){
			if ((arr[index].time.getHours()==hour) ) {
				retArr.push(arr[index]);
				break;
			}
		}
	}
	return retArr;
};
exports.dataFilterByDate= function(datas, dateInput){

    
	var obj= dateInput.split("-");
	var year= obj[0];
	var month= obj[1];
	var date= obj[2];
	console.log(year);
	console.log(month);
	console.log(date);
	var filter= datas.filter(data=> {
		if (data) return  (data.time.getFullYear()==year)&&((data.time.getMonth()+1)==month)&&(data.time.getDate()== date);
		return false;
	});
	var ret=reducerDate(filter);
	console.log("filter length: "+ret.length);
	console.log(ret);
    
	return ret;
};
var reducerMonth=function(arr, month, year) {
	function daysInMonth (month, year) {
		return new Date(year, month, 0).getDate();
	}
  let retArr= [], numberOfDays= daysInMonth(month, year);
  console.log(`number of days in month ${month} of year ${year} is ${numberOfDays}`);
  for (let i= 1; i<= numberOfDays; i++) {
	for(let j=0; j< arr.length; j++) {
		if (arr[j].time.getDate()==i)  {
			retArr.push(arr[j]); 
			break;
		}
	}
  }
  return retArr;


};
function dataFilterByMonth(datas, monthFormat){
	//function get number of distributedd point from an array
	// month format yyyy-mm
    
	var obj= monthFormat.split("-");
	var year= obj[0];
	var month= obj[1];
	console.log(year);
	console.log(month);
    
	var filter= datas.filter(data=> {
		return  (new Date(data.time).getFullYear()==year)&&((new Date(data.time).getMonth()+1)==month);
	});
    
	console.log("filter length before reducer: "+filter.length);
	var retArr = reducerMonth(filter,month, year);
	console.log("array length after reducer: "+ retArr.length)
	return retArr;
	//return filter;
};

exports.dataFilterByMonth = dataFilterByMonth;



//path is where invoice pdf file is stored
function sendEmail(email, path){
	var transporter= nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.email,
			pass: process.env.password
		}
	});
 
  
	var mailOptions= {
		from: process.env.email,
		to: email,
		subject: `send email ${email}`,
		text: "that easy",
		attachments: [{
			filename:"invoice.pdf",
			path: path
		}]
      
	} ;
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log("email sent "+ info.response);
		}
	});
}

//how to deal with this one
//assum a user with email, so create a user folder to hold bill
//and create an html file every month then convert to pdf
exports.createFolder=  async function() {
	if (!fs.existsSync("./bill"))
	{
		fs.mkdirSync("./bill");
	}
	var users= await User.find({});
	users.forEach(function(user){
		var path= "./bill/"+ user.email+"_bill";
		if (!fs.existsSync(path)){
			fs.mkdirSync(path);
		}
	});
    
    
  
};


exports.createBill=async function(user_id, month) {//month in format  string yyyy-mm
	try {
		var user= await User.findById({_id: user_id});
	}
	catch(err) {
		console.log(err);
		return;
	}
	if (user) {
		console.log(user);
		try {
			var modbusData= await ModbusData.findById({_id: user.meter});
		}
		catch(err) {
			console.log(err);
			return ;
		}
		if (modbusData== null || modbusData==undefined) {
			console.log(`this ${user.email} account doesnot have meter connected`)
			return ;}
		var filterData= dataFilterByMonth(modbusData.datas, month);
		var total;
		if (filterData.length <= 1) total=0;

		else total= (filterData[filterData.length-1].value[1]- filterData[0].value[1]).toFixed(2);
		//total is sum amount power comsumption
		//need to discuss formula to calculate money
		var amount= (total*2000).toFixed(2);
		console.log(filterData[filterData.length-1]);
		console.log(filterData[0]);
		console.log(total);

		var html= "<html><head><style>"
		html+='div{margin-top: 30px;margin-bottom:50px;}h1,h3{color: green;text-align:center;margin-top:40px;margin-bottom:50px}p{text-align:center;margin-bottom:  20px;}strong{font-weight:bold}';
		

		
		html+= "</style></head>";
		html+=`<body><div class= "container"><h1>INVOICE</h1><h3>Bill to ${user.email}</h3>`;
		html+=`<p>Total power comsumption in month <strong>${month}</strong> is: <strong>${total}</strong> kWH</p>`;
		html+= `<p>Total charge: <strong>${amount}</strong> VND</p>`;
		html+="<p>Please pay before ... Thank you</p>";
		html+="</div></body></html>";
		if (!fs.existsSync("./bill")) //tao thu muc bill truoc
		{
			fs.mkdirSync("./bill");
		}
		var path= "./bill/"+ user.email+"_bill";// tao thu muc con cho user
		if (!fs.existsSync(path)){
			fs.mkdirSync(path);

		}
		var filePath=path+ "/"+ month+ ".html";
		fs.writeFileSync(filePath, html);
		convertToPDF(filePath);
	}

};
function convertToPDF(filename){
	fs.readFile(filename, "utf8", function(err, result){
		if (err) console.log(err);
		else console.log("file html: "+ result);
		var options= {
			format: "Letter"
		} ;
		var pdfpath= path.parse(filename).dir+"/"+path.parse(filename).name +".pdf";
		pdf.create(result, options).toFile(pdfpath, function(err, res){
			if (err) return console.log(err);
			console.log("converted ok");
			sendEmail("quocvietqng02@gmail.com", pdfpath);
		});

	});
}
exports.deleteFile= function(filename){
	if (fs.existsSync(filename)) {
		fs.unlink(filename, function(err){
			if (err) console.log(err);
			else console.log("removed");
		});
	}
};
//assume data: [kw, kwh]
exports.addRecord= async function(ip,slaveId,dateInput, n) {
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
		var record=[];
	var year= dateInput.getFullYear();
	var month= dateInput.getMonth();
	var date= dateInput.getDate();
	var hour= dateInput.getHours();
	var minute= dateInput.getMinutes();
	for (let i=0; i< n;i++){
		var  d= new Date(year, month, date, hour, minute+ 10*i, 0);
    
		record.push({time:d, value: [(100*Math.random()).toFixed(2),(10*Math.random()+10*i).toFixed(2),(10*Math.random()+10*i).toFixed(2)] });
	}
	console.log(date);
		console.log("meter datas length before concat with record: "+ data.datas.length);
		data.datas=data.datas.concat(record);
		console.log("meter datas length before concat with record: "+ data.datas.length);
		data.save(function(err){
			if (err) {console.log(err);
   
				return;
			}
   
		}); 
		return data.datas;
	}

};

	
//viet doan chuong trinh automating job 


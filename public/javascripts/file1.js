            //var id = !{JSON.stringify(id)}
            const canvas= document.getElementById("chart1")
            const context= canvas.getContext("2d");  
            const canvas2= document.getElementById("chart2")
            const context2= canvas2.getContext("2d"); 
           
             
          //view bill start
         
           //view bill end

            function get_current_kw() {
               
                
                fetch(`/admin/get_current_kw/${id}`, {
                    method: 'get',
                    headers: {
                        'content-type': 'application/json'
                    }
                })
               .then(response=> response.json())
                .then(data=> {
                    
                    
                    const current= document.getElementById("current")
                    if (typeof data =='string') {current.innerText= "no data"}
                     else {current.innerText= `Current power: ${data[0]} KW;\n current comsumption: ${data[1]} KWh `}
                    
                })
                .catch(err=> console.log(err))
            }
             get_current_kw()
             //plot when load
              
               
                var dateFormat= new Date()
                let date= `${dateFormat.getFullYear()}-${dateFormat.getMonth()+1}-${dateFormat.getDate()}`
                let month= `${dateFormat.getFullYear()}-${dateFormat.getMonth()+1}`
                handleDateClick(date)
                handleMonthClick(month)
            
            var dateElement= document.querySelector('input[type=date');
            dateElement.addEventListener('change', function(e){
              var date= e.target.value;
              handleDateClick(date);
            })

             
             var monthSelect= document.querySelector('input[type=month]')
             monthSelect.addEventListener('change', function(e){
               var month= e.target.value
               handleMonthClick(month)
             })
             function handleDateClick(date){
                
               
                
                fetch(`/admin/${id}/plot?date=${date}`, {
                    method: 'get',
                    'content-type': 'application/json'
                })
                .then(response=>response.json())
                .then(json=>{ 
                    console.log(json)
                    var existChart= Chart.getChart("chart1")
                    if (existChart) existChart.destroy()
                    if (typeof json =='string') {
                        context.font= "30px Arial"
                        context.fillText("no data to plot", 50, 50);
                        return;
                    }
                    
                  
                    var config= {
                        type: 'line',
                        data: {
                            labels: json.map(item=>item.time),
                            datasets: [
                                {
                                    label:`power(kw) on ${date}` ,
                                    data: json.map(item=> item.value[0])
                                }
                            ]
                        }

                    }
                    const myChar= new Chart(context, config)    
                             
                    })
                .catch((err)=> console.log(err))
                }
                function handleMonthClick(month){
              
               
                
                fetch(`/admin/${id}/plot?month=${month}`, {
                    method: 'get',
                    'content-type': 'application/json'
                })
                .then(response=>response.json())
                .then(json=>{ 
                    console.log(json)
                    let existChart= Chart.getChart("chart2")
                    if (existChart) existChart.destroy()
                    if (typeof json =='string') {
                        context2.font= "30px Arial"
                        context2.fillText("no data to plot", 50, 50);
                        return;
                    }
                    
                  
                   let config= {
                        type: 'bar',
                        data: {
                            labels: json.map(item=>item.time),
                            datasets: [
                                {
                                    label:`power(kwh) on ${month}` ,
                                    data: json.map(item=> item.value[1])
                                }
                            ]
                        }

                    }
                    const myChar1= new Chart(context2, config)    
                             
                    })
                .catch((err)=> console.log(err))
                }
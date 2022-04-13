const btn= document.getElementById('create');
btn.addEventListener('click', function(e){
    let month= document.querySelector('input').value;
    console.log("valueis", month);
   if (month=='') {
        const p= document.createElement('p');
        p.innerText= "pls choose month";
        document.body.appendChild(p);
        return;
   } else {
       fetch(`/admin/users/bill_create/bill?month=${month}`)
       .then(response=> response.json())
       .then(json=> console.log(json))
       .catch(err=>console.log(err))

   }
    
   
})
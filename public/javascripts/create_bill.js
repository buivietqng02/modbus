const btn= document.getElementById('create');
const loader= document.querySelector(".loader");
loader.style.display= "none";
btn.addEventListener('click', function(e){
    let month= document.querySelector('input').value;
    const bill_section= document.getElementById('bill-section');
    console.log("valueis", month);
   if (month=='') {

       let p1= document.querySelector(".month-msg");
       if (p1) return;
        const p= document.createElement('p');

        p.innerText= "pls choose month";
        p.setAttribute("class", "month-msg")
        bill_section.appendChild(p);
        return;
   } else {
       loader.style.display="block";
       const p= document.querySelector(".month-msg");
       if (p) p.parentNode.removeChild(p);

       fetch(`/admin/users/bill_create/bill?month=${month}`)
       .then(response=> response.json())
       .then(json=>{ 
           console.log(json);
           loader.style.display= "none";
        })
       .catch(err=> {
           console.log(err);
           loader.style.display= "none";
    })

   }
    
   
})
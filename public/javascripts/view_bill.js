const btnBillView= document.getElementById("view-bill");
const billDisplayDiv= document.getElementById("bill-html")
btnBillView.addEventListener('click', function(){
  let month= document.querySelector(".bill-month")
  let value= month.value;
  if (!value) return
  console.log(/\d{4}-\d{2}/.test(value))
  fetch(`/user/${id}/view-bill?month=${value}`)
  .then(response=> response.text())
  .then(text=>{
      console.log(text);
      billDisplayDiv.innerHTML= text;
 })
  .catch(err=> console.log(err))
 })
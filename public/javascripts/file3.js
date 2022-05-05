const viewChartBtn= document.getElementById("view-chart-btn");
           
viewChartBtn.style.marginRight="20px";
const viewBillBtn= document.getElementById("view-bill-btn");
const billSection= document.getElementById("bill-section");
const chartSection= document.getElementById("chart-section");
billSection.style.display= "none";
viewChartBtn.addEventListener('click', function() {
    chartSection.style.display="block";
    billSection.style.display= "none";

})
viewBillBtn.addEventListener('click', function() {
    chartSection.style.display="none";
    billSection.style.display= "block";

})
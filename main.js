window.addEventListener('DOMContentLoaded', function () {
  getVisitCount();
});

var functionApiUrl =
  'https://getresumecounterworking.azurewebsites.net/api/GetResumeCounter?code=aJSHAD2jrBoMcu32Dj4Q6b92qrhLPifESafqPZl5cdUJaQKTwdQjug==';

function getVisitCount() {
  fetch(functionApiUrl)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      console.log('Website called function API');
      if (window.animateCounter) {
        window.animateCounter(data.count);
      } else {
        var el = document.getElementById('counter');
        if (el) el.innerText = data.count;
      }
    })
    .catch(function (err) { console.log(err); });
}

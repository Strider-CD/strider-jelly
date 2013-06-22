<script type="text/javascript">
/*
 * This allows you to receive reporting from a series
 * of Jasmine tests in the form of a Jasmine Custom
 * Reporter that talks back to the strider server.
 */
//(function(){
// Tiny Ajax Post
var post = function (url, json, cb){
  var req;

  if (window.ActiveXObject)
    req = new ActiveXObject('Microsoft.XMLHTTP');
  else if (window.XMLHttpRequest)
    req = new XMLHttpRequest();
  else
    throw "Strider: No ajax"

  req.onreadystatechange = function () {
      if (req.readyState==4)
        cb(req.responseText);
    };
  var data = "data=" + JSON.stringify(json)
  req.open("POST", url, true);
  req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  req.setRequestHeader('Content-length',  data.length);
  req.setRequestHeader('Connection', 'close');
  req.send(data);
}

function JellyReporter() {
  this.executed = 0;
  this.failed = 0;
  this.passed = 0;
  this.errors = [];
}

JellyReporter.prototype = new jasmine.Reporter();

JellyReporter.prototype.reportRunnerResults = function (runner) {
  // When all the spec are finished //
  var result = runner.results();
  var data = {
      total: this.executed
    , passed : this.passed
    , failed : this.failed
    , tracebacks: this.errors
    , url : window.location.pathname
  }
  post("/_jelly/results", data, function(){});
};

JellyReporter.prototype.reportSuiteResults = function (suite) {}

JellyReporter.prototype.reportSpecResults = function(spec) {
    // When a single spec has finished running //

    this.executed ++;

    var result = spec.results();
    if (!result.passed()){
      this.errors.push([spec.description, result]);
      this.failed ++;
    } else {
      this.passed ++;
    }

    if (this.executed % 50 == 0){
      var data = {
          total: this.executed
        , passed : this.passed
        , failed : this.failed
        , tracebacks: this.errors
        , url : window.location.pathname
      }
      this.errors = [];
      post('/_jelly/progress', data, function(){}); 
    }
}


var jasmineEnv = jasmine.getEnv();
jasmineEnv.updateInterval = 1000;

var reporter = new JellyReporter();
jasmineEnv.addReporter(reporter);

//})();
</script>

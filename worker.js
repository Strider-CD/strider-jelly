var jp = require('jelly-proxy')
  , url = require('url')
  , path = require('path')
  , qs = require('querystring')

// URL jobID regex
var regex = /^\/(.*?)\//; //Smallest possible first url segment;

var bodyParse = function(cb){
  return function(req, res){
    var body = ''
    req.on('data', function (data) {
      body += data;
    });
    req.on('end', function () {
      var post = qs.parse(body);
      req.post = JSON.parse(post.data);
      cb(req, res);
    })
  }
}

module.exports = function(ctx, cb){
  var proxyServer
    , staticServer

  var prepare = function(ctx, cb){

    var handleProgress = function(req, res){
      req.post.id = (regex.exec(req.post.url) || ["!", "?"])[1]
      console.log("[JELLY:Progress]", req.post)
      ctx.striderMessage(
        "[JELLY:Progress] Job:"
        , req.post.id
        , "->"
        , req.post.total
        , " run, "
        , req.post.failed
        , " failures")
      
      if (req.post.tracebacks){
        for (var i = 0; i<req.post.tracebacks.length; i++){
          ctx.striderMessage("\n\n[ERROR]" + req.post.tracebacks[i]);
        }
      }
      res.writeHead(200)
      res.end()
     }
      

    var handleResults = function(req, res){
      req.post.id = (regex.exec(req.post.url) || ["!", "?"])[1]
      console.log("[JELLY:Results]", req.post);// TODO Req params
      if (req.post.tracebacks){
        for (var i = 0; i<req.post.tracebacks.length; i++){
          ctx.striderMessage("\n\n[ERROR]" + req.post.tracebacks[i]);
        }
      }
      ctx.events.emit("testDone", req.post)
      res.writeHead(200)
      res.end()
    }

    var routes = {
      "_jelly/progress" : bodyParse(handleProgress)
    , "_jelly/results" : bodyParse(handleResults)
    }

    var handleReq = function(req, res){
     var url = req.url;

     //strip leading '/'
     if (url.indexOf('/') == 0){
       url = url.slice(1);
     }

     if (routes[url]){
       routes[url](req, res)
     } else {
      res.writeHead(404);
      res.end()
     }
    }

    var repoconf = ctx.jobData.repo_config
      , payload = repoconf.jelly_payload
      , port = repoconf.jelly_port
      , jellyurl = repoconf.jelly_url

    if (! jellyurl) return cb(null, null);

    var uri = url.parse(jellyurl) 
      , proxyport = uri.port || 80
      , serveStatic = repoconf.jelly_static
      , staticpath = path.join(ctx.workingDir, repoconf.jelly_static_dir || '.')

    ctx.browsertestPort = port
    ctx.browsertestPath = uri.path

    var opts = {
      payload : payload
    , logger : function(req){
        console.log("[JellyProxy]", req.url)
      }
    , tag: "</head>" 
    }

    proxyServer = jp(opts, handleReq, proxyport)
    proxyServer.listen(port);
    console.log("JellyProxy:", port, " listening to traffic for", proxyport);
    
    if (serveStatic){
      var send = require('send')
        , http = require('http')

      staticServer = http.createServer(function(rq, rs){
        // Parse JOBID out of url
        rq.origUrl = rq.url;
        var m = regex.exec(rq.url)
        rq.jobID = m && m[1];
        if (rq.jobID){
          rq.url = rq.url.replace(regex, '/')
        }

        console.log("[static serve]", rq.url, "(", rq.jobID, ")")
        send(rq, url.parse(rq.url).pathname)
          .root(staticpath)
          .pipe(rs); 
      })
      staticServer.listen(proxyport)
      console.log("Static server:", proxyport, "serving", staticpath)
    }
    
    cb(null, null);
  }

  var cleanup = function(ctx, cb){
    if (proxyServer)
      proxyServer.close()
    if (staticServer)
      staticServer.close()

    cb(null, null);
  }

  ctx.addBuildHook({
    prepare: prepare
  , cleanup: cleanup 
  })
  console.log("Jelly Proxy loaded")
  cb(null);
}

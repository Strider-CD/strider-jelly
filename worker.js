var jp = require('jelly-proxy')
  , url = require('url')
  , path = require('path')

module.exports = function(ctx, cb){
  var proxyServer
    , staticServer

  var prepare = function(ctx, cb){

    var handleProgress = function(req, res){
      console.log("[JELLY:Progress]", req);// TODO Req params
      ctx.striderMessage("[JELLY:Progress]", req)
    }

    var handleResults = function(req, res){
      console.log("[JELLY:Results]", req);// TODO Req params
      ctx.events.emit("testDone", res) 
    }

    var routes = {
      "_jelly/progress" : handleProgress
    , "_jelly/results" : handleResults
    }

    var handleReq = function(req, res){
     if (routes[req.url]){
       routes[req.url](req, res)
     } else {
      res.writeHead(404);
      res.end()
     }
    }

    var repoconf = ctx.jobData.repo_config
      , payload = repoconf.jelly_payload
      , port = repoconf.jelly_port
      , jellyurl = repoconf.jelly_url

    if (! jellyurl) return;

    var uri = url.parse(jellyurl) 
      , proxyport = uri.port || 80
      , serveStatic = repoconf.jelly_static
      , staticpath = path.join(ctx.workingDir, repoconf.jelly_static_dir || '.')

    ctx.browsertestPort = port
    ctx.browsertestPath = jellyurl

    var opts = {
      payload : payload
    , logger : function(req){
        console.log("[JellyProxy]", req.url)
      }
    }

    proxyServer = jp(opts, handleReq, proxyport)
    proxyServer.listen(port);
    console.log("JellyProxy:", port, " listening to traffic for", proxyport);
    
    if (serveStatic){
      var send = require('send')
        , http = require('http')

      staticServer = http.createServer(function(rq, rs){
        console.log("[static serve]", rq.url)
        send(rq, rq.url)
          .root(staticpath)
          .pipe(rs); 
      })
      staticServer.listen(proxyport)
      console.log("Static server:", proxyport, "serving", staticpath)
    }

  }

  var cleanup = function(ctx, cb){
    proxyServer.close()
    if (staticServer)
      staticServer.close()
  }

  ctx.addBuildHook({
    prepare: prepare
  , cleanup: cleanup 
  })
  console.log("Jelly Proxy loaded")
  cb(null);
}

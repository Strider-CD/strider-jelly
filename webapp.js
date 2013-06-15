var path = require('path')

module.exports = function(ctx, cb){
  /*
   * GET /api/jelly/
   *
   * Get the current Strider config for specified project. This will be a JSON-encoded
   * object with the keys: 'test_files'
   *
   * @param url Github html_url of the project.
   */
  function getIndex(req, res) {
    var url = req.param("url")

    function error(err_msg) {
      console.error("Strider-Jelly: getIndex() - %s", err_msg)
      var r = {
        errors: [err_msg],
        status: "error"
      }
      res.statusCode = 400
      return res.end(JSON.stringify(r, null, '\t'))
    }

    req.user.get_repo_config(url, function(err, repo, access_level, owner_user_obj) {
      if (err) {
        return error("Error fetching Repo Config for url " + url + ": " + err)
      }
      var r = {
        status: "ok",
        errors: [],
        results: {
          jelly_url: repo.get("jelly_url")
        , jelly_port: repo.get("jelly_port")
        , jelly_payload: repo.get("jelly_payload")
        , jelly_static: repo.get("jelly_static")
        , jelly_static_dir: repo.get("jelly_static_dir")
        }
      }
      return res.end(JSON.stringify(r, null, '\t'))
    })
  }

  /*
   * POST /api/jelly/
   *
   * Set the current Strider config for specified project.
   *
   * @param url Github html_url of the project.
   *
   */
  function postIndex(req, res) {
    var url = req.param("url")
      , jelly_url = req.body["jelly_url"]
      , jelly_port = req.body["jelly_port"]
      , jelly_payload = req.body["jelly_payload"]
      , jelly_static = req.body["jelly_static"]
      , jelly_static_dir = req.body["jelly_static_dir"]


    function error(err_msg) {
      console.error("Strider-Jelly: postIndex() - %s", err_msg)
      var r = {
        errors: [err_msg],
        status: "error"
      }
      res.statusCode = 400
      return res.end(JSON.stringify(r, null, '\t'))
    }

    req.user.get_repo_config(url, function(err, repo, access_level, owner_user_obj) {
      if (err) {
        return error("Error fetching Repo Config for url " + url + ": " + err)
      }
      // must have access_level > 0 to be able to continue;
      if (access_level < 1) {
        console.debug(
          "User %s tried to change jelly config but doesn't have admin privileges on %s (access level: %s)",
          req.user.email, url, access_level);
        return error("You must have access level greater than 0 in order to be able to configure jelly.");
      }
      var q = {$set:{}}

      repo.set('jelly_url', jelly_url)
      repo.set('jelly_port', jelly_port)
      repo.set('jelly_payload', jelly_payload)
      repo.set('jelly_static', jelly_static)
      repo.set('jelly_static_dir', jelly_static_dir)

      var r = {
        status: "ok",
        errors: [],
        results: {
          set: [jelly_url, jelly_port, jelly_payload, jelly_static, jelly_static_dir]
        }
      }
      req.user.save(function(err) {
          if (err) {
            var errmsg = "Error saving jelly config " + req.user.email + ": " + err;
            return error(errmsg)
          }
          return res.end(JSON.stringify(r, null, '\t'))
      })
    })

  }

  // Add webserver routes
  ctx.route.get("/api/jelly",
    ctx.middleware.require_auth,
    ctx.middleware.require_params(["url"]),
    getIndex)
  ctx.route.post("/api/jelly",
    ctx.middleware.require_auth,
    ctx.middleware.require_params(["url"]),
    postIndex)


  // Extend RepoConfig model with 'Jelly' properties
  function jellyPlugin(schema, opts) {
    schema.add({
      jelly_url: String,
      jelly_port: Number,
      jelly_payload: String,
      jelly_static: Boolean,
      jelly_static_dir: String
    })
  }
  ctx.models.RepoConfig.plugin(jellyPlugin)

  // Add panel HTML snippet for project config page
  ctx.registerPanel('project_config', {
    src: path.join(__dirname, "templates", "project_config.html"),
    title: "Jelly-Proxy Config",
    id:"jelly_config",
  })

  cb(null);
}

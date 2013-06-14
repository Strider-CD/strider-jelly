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
          url: repo.get("jelly_url")
        , port: repo.get("jelly_port")
        , payload: repo.get("jelly_payload")
        , serve_static: repo.get("jelly_static")
        , static_dir: repoget("jelly_static_dir")
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

    function error(err_msg) {
      console.error("Strider-QUnit: postIndex() - %s", err_msg)
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
          "User %s tried to change qunit config but doesn't have admin privileges on %s (access level: %s)",
          req.user.email, url, access_level);
        return error("You must have access level greater than 0 in order to be able to configure qunit.");
      }
      var q = {$set:{}}
      if (path) {
        repo.set('qunit_path', path)
      }
      if (file) {
        repo.set('qunit_file', file)
      }

      var r = {
        status: "ok",
        errors: [],
        results: {
          files: repo.get('qunit_file'),
          path: repo.get('qunit_path')
        }
      }
      if (file || path) {
        req.user.save(function(err) {
            if (err) {
              var errmsg = "Error saving qunit config " + req.user.email + ": " + err;
              return error(errmsg)
            }
            return res.end(JSON.stringify(r, null, '\t'))
        })
      } else {
        return res.end(JSON.stringify(r, null, '\t'))
      }
    })

  }


  // Extend RepoConfig model with 'Jelly' properties
  function jellyPlugin(schema, opts) {
    schema.add({
      jelly_url: String,
      jelly_port: Number,
      jelly_payload: String,
      jelly_static: Boolean
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

}

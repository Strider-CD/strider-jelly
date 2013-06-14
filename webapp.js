var path = require('path')

module.exports = function(ctx, cb){
  // Add panel HTML snippet for project config page
  ctx.registerPanel('project_config', {
    src: path.join(__dirname, "templates", "project_config.html"),
    title: "Jelly-Proxy Config",
    id:"jelly_config",
  })

}

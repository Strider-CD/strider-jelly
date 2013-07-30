
;(function () {

  function save(url, data, done) {
    data = _.extend({url: url}, data);
    $.ajax({
      url: '/api/jelly',
      type: 'POST',
      data: data,
      dataType: 'json',
      success: function (data, ts, xhr) {
        done(null);
      },
      error: function (xhr, ts, e) {
        if (xhr && xhr.responseText) {
          var data = $.parseJSON(xhr.responseText);
          e = data.errors[0];
        }
        done(e);
      }
    });
  }

  app.controller('JellyCtrl', ['$scope', function ($scope) {
    $scope.data = $scope.panelData.jelly_config;
    $scope.save = function () {
      $scope.loading = true;
      save($scope.repo.url, $scope.data, function (err) {
        $scope.loading = false;
        if (err) {
          $scope.error('Failed to save jelly config: ' + err);
        } else {
          $scope.success('Saved jelly config');
        }
        $scope.$root.$digest();
      });
    };
  }]);
})();

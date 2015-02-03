angular.module('ddnApp').controller('navCtrl', ['$scope', '$location', function($scope, $location) {
	console.log('navCtrl loaded');

	$scope.isActive = function(viewLocation) {
		return $location.path() === viewLocation;
	};
}]);
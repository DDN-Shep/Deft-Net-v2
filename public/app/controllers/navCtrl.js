angular.module('ddnApp').controller('navCtrl', ['$scope', '$location', function($scope, $location) {
	console.log('navCtrl loaded');

	$scope.isActive = function(viewLocation) {
		console.log(viewLocation + ' === ' + $location.path());

		return $location.path() === viewLocation;
	};
}]);
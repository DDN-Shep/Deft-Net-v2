angular.module('ddnApp')
	.controller('navCtrl', ['$scope', '$location', 'navSvc',
		function($scope, $location, navSvc) {
			$scope.isActive = function(viewLocation) {
				return navSvc.isActive($location, viewLocation);
			};
		}]);

angular.module('ddnPortfolio')
	.controller('navCtrl', ['$scope', '$location', 'navSvc',
		function($scope, $location, navSvc) {
			$scope.isActive = function(viewLocation) {
				return navSvc.isActive($location, viewLocation);
			};
		}]);
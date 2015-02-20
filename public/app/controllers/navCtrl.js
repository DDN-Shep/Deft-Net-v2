angular.module('ddnApp')
	.controller('navCtrl', ['$scope', '$location', 'navSvc', 'identitySvc',
		function($scope, $location, navSvc, identitySvc) {
			$scope.isActive = function(viewLocation) {
				return navSvc.isActive($location, viewLocation);
			};

            $scope.identity = identitySvc;
		}]);

angular.module('ddnPortfolio')
	.controller('navCtrl', ['$scope', '$location', 'navSvc', 'identitySvc',
		function($scope, $location, navSvc, identitySvc) {
			$scope.isActive = function(viewLocation) {
				return navSvc.isActive($location, viewLocation);
			};

            $scope.identity = identitySvc;
		}]);
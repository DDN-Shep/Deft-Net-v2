'use strict';

angular.module('ddnApp')
	.controller('navCtrl', ['$scope', '$http', '$location', 'navSvc', 'identitySvc',
		function($scope, $http, $location, navSvc, identitySvc) {
            $scope.isCollapsed = true;

			$scope.isActive = function(viewLocation) {
				return navSvc.isActive($location, viewLocation);
			};

            $scope.signout = function(username) {
                $http.post('/api/account/signout', {
                    username: identitySvc.currentUser.username
                }).then(function() {
                    identitySvc.currentUser = undefined;

                    toastrSvc.info('Signed out!');
                });
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
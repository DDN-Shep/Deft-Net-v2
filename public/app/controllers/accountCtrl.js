angular.module('ddnApp')
	.controller('accountCtrl', ['$scope', '$http', 'toastrSvc', 'identitySvc',
		function($scope, $http, toastrSvc, identitySvc) {
			$scope.identity = identitySvc;

			$scope.signInData = {};

			$scope.signin = function(username, password) {

				username = username !== undefined ? username : $scope.signInData.username;
				password = password !== undefined ? password : $scope.signInData.password;

				console.log('Sign-in attempt: ' + username + ' - ' + password);

				$http.post('/api/account/signin', {
					username: username,
					password: password
				}).then(function(response) {
					if (response.data) {
						identitySvc.currentUser = response.data;

						toastrSvc.info('Logged in!');
					}
					else toastrSvc.error('Log in failed...');
				});
			};

			$scope.signout = function(username) {
				console.log('Sign-out attempt: ' + username);

				$http.post('/api/account/signout', {
					username: username
				}).then(function() {
					identitySvc.currentUser = undefined;

					toastrSvc.info('Signed out!');
				});
			};
		}]);
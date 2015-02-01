angular.module('ddnApp').controller('accountCtrl', ['$scope', '$http', 'toastrSrvc', 'identitySrvc',
	function($scope, $http, toastrSrvc, identitySrvc) {
		console.log('accountCtrl loaded');

		$scope.identity = identitySrvc;

		$scope.signin = function(username, password) {
			console.log('Sign-in attempt: ' + username + ' - ' + password);

			$http.post('/signin', {
				username: username,
				password: password
			}).then(function(response) {
				if (response.data.success) {
					identitySrvc.currentUser = response.data.user;

					toastrSrvc.notify('Logged in!');
				}
				else toastrSrvc.notify('Log in failed...');
			});
		}

		$scope.signout = function(username) {
			console.log('Sign-out attempt: ' + username);

			$http.post('/signout', {
				username: username
			}).then(function() {
				identitySrvc.currentUser = undefined;

				toastrSrvc.notify('Signed out!');
			});
		}
	}]);
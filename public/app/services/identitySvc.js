angular.module('ddnSvc')
	.factory('identitySvc', ['$window', function($window) {
        var currentUser = $window.ddnInject && $window.ddnInject.user
            ? $window.ddnInject.user
            : undefined;

		return {
			currentUser: currentUser,
			isAuthenticated: function() {
				return !!this.currentUser;
			}
		};
	}]);
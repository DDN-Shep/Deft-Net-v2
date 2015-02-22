'use strict';

angular.module('ddnSvc')
	.factory('identitySvc', ['$window', function($window) {

        var currentUser = $window.ddn && $window.ddn.user
            ? $window.ddn.user
            : undefined;

		return {
			currentUser: currentUser,
			isAuthenticated: function() {
				return !!this.currentUser;
			}
		};
	}]);
angular.module('ddnSvc')
	.factory('identitySvc', function() {
		return {
			currentUser: undefined,
			isAuthenticated: function() {
				return !!this.currentUser;
			}
		};
	});
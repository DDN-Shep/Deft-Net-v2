angular.module('ddnApp').factory('identitySrvc', function() {
	return {
		currentUser: undefined,
		isAuthenticated: function() {
			return !!this.currentUser;
		}
	};
});
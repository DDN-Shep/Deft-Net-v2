angular.module('ddnApp', ['ngResource', 'ngRoute']);

angular.module('ddnApp').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$locationProvider
		.html5Mode({
			enabled: false,
			requireBase: false
		});

	$routeProvider
		.when('/', {
			templateUrl: '/partials/blog',
			controller: 'mainCtrl'
		})
		.when('/account/signin', {
			templateUrl: '/account/partials/signin'
		})
		.when('/account/signup', {
			templateUrl: '/account/partials/signup'
		})
        .otherwise({
            redirectTo: '/'
        })
    ;
}]);
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
			templateUrl: '/account/partials/signin',
			controller: 'accountCtrl'
		})
		.when('/account/signup', {
			templateUrl: '/account/partials/signup',
			controller: 'accountCtrl'
		})
		.otherwise({
            redirectTo: '/portfolio/codepen'
		});
}]);

angular.module('ddnPortfolio', ['ngResource', 'ngRoute']);

angular.module('ddnPortfolio').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $locationProvider
        .html5Mode({
            enabled: false,
            requireBase: false
        });

    $routeProvider
        .when('/portfolio/codepen', {
            templateUrl: '/portfolio/codepen/partials/pens',
            controller: 'mainCtrl'
        })
        .otherwise({
            redirectTo: '/portfolio/codepen'
        })
    ;
}]);
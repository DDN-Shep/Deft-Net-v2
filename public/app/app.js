'use strict';

angular.module('ddnSvc', []);

angular.module('ddnApp', ['ddnSvc', 'ngResource', 'ngRoute', 'ui.bootstrap'])
	.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$locationProvider
			.html5Mode({
				enabled: false,
				requireBase: false
			});

		$routeProvider
			.when('/', {
				templateUrl: '/partials/blog'
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
				redirectTo: '/'
			});
	}]);

angular.module('ddnPortfolio', ['ddnSvc', 'ngResource', 'ngRoute', 'ui.bootstrap'])
	.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$locationProvider
			.html5Mode({
				enabled: false,
				requireBase: false
			});

		$routeProvider
			.when('/portfolio/codepen', {
				templateUrl: '/portfolio/codepen/partials/pens'
			})
			.otherwise({
				redirectTo: '/portfolio/codepen'
			});
	}]);
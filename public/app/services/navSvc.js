'use strict';

angular.module('ddnSvc')
	.factory('navSvc', function() {
		return {
			isActive: function($location, viewLocation) {
				return $location.path() === viewLocation;
			}
		};
	});
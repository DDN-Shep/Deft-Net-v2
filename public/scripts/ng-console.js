/* Immediately Invoked Function Expression (IIFE) */
(function() {
	var findWatchers = function(element) {
		var watchers = [];

		element = !element
			? angular.element(document.getElementsByTagName('body'))
      : angular.element(element);

		if (element.data().hasOwnProperty('$scope'))
			angular.forEach(element.data().$scope.$$watchers, function(watcher) {
				watchers.push(watcher);
			});

		angular.forEach(element.children(), function(childElement) {
			findWatchers(angular.element(childElement));
		});

		console.log(watchers.length);
	};

	console.ngWatchers = findWatchers;
})();
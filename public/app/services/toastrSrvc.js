angular.module('ddnApp').value('$toastr', toastr);

angular.module('ddnApp').factory('toastrSrvc', function($toastr) {
	console.log('toastrSrvc loaded');

	return {
		notify: function(message) {
			console.log(message);

			$toastr.info(message);
		}
	};
});
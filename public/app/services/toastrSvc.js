angular.module('ddnApp').value('$toastr', toastr);

angular.module('ddnApp').factory('toastrSvc', function($toastr) {
	console.log('toastrSvc loaded');

	angular.extend($toastr.options, {
		positionClass: 'toast-bottom-left'
	});

	return $toastr;
});
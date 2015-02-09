angular.module('ddnSvc')
	.value('$toastr', toastr)
	.factory('toastrSvc', ['$toastr', function($toastr) {
		angular.extend($toastr.options, {
			newestOnTop: false,
			positionClass: 'toast-bottom-left',
			iconClasses: {
				error: 'alert-danger toast-error',
				info: 'alert-info toast-info',
				success: 'alert-success toast-success',
				warning: 'alert-warning toast-warning'
			},
			toastClass: 'alert'
			/* DEBUG: Uncomment to make toasts sticky
			,timeOut: 0
			,extendedTimeOut: 0
			//*/
		});

		return $toastr;
	}]);
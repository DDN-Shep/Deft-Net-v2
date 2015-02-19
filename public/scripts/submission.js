var validus = window.validus = window.validus || {
	console: {
		vm: {
			submission: null
		}
	}
};

var Submission = function Submission(properties) {
		console.log("Base submission initialising...");

		this.Id = null;
		this.Name = null;
		this.Url = null;
		this.Settings = null;

		var _this = this,
		    _init = function _init(properties) {
			    console.log("Base submission (private) initialising...");

			    $.extend(_this, properties);

			    console.log("Base submission (private) initialised");

			    return _this;
		    }(properties || {});

		console.log("Base submission initialised");
	};

Submission.prototype = Object.create(Object.prototype, {
	DoSomething: {
		value: function() {
			console.log("Base submission 'DoSomething'...");
		},
		enumerable: true,
		configurable: true,
		writable: true
	},
	IterateProperties: {
		value: function() {
			for (var property in this) {
				console.log(property);
			};
		},
		enumerable: true,
		configurable: true,
		writable: true
	}
});

var	SubmissionAH = function SubmissionAH(properties) {
		console.log("AH submission initialising...");

		this.MoreSettings = null;

		var _this = this,
		    _init = function _init(properties) {
			    console.log("AH submission (private) initialising...");

			    $.extend(_this, properties);

			    Submission.call(this, properties);

			    console.log("AH submission (private) initialised");

			    return _this;
		    }(properties || {});

		console.log("AH submission initialised");
	};

SubmissionAH.prototype = Object.create(Submission.prototype, {
	DoSomethingMore: {
		value: function() {
			console.log("AH submission 'DoSomethingMore'...");
		},
		enumerable: true,
		configurable: true,
		writable: true
	}
});

var MySubmission = new Submission({
	    Name: "Base Widget"
    }),
    MySubmissionAH = new SubmissionAH({
	    Id: "7F2C598C-6C33-48EA-9BBC-6B713390363A"
    });

// Make the variables available from the window object for debugging purposes (i.e, Chrome console)
window.MySubmission = window.MySubmission || MySubmission;
window.MySubmissionAH = window.MySubmissionAH || MySubmissionAH;
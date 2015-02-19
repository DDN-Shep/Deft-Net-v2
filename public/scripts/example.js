;(function($document)
{
	$document.ajaxStart(function()
	{
		toastr.info("Ajax Request");
		console.log("Ajax Request");
		console.log(arguments);
	}).ajaxSuccess(function()
	{
		toastr.success("Ajax Request Complete");
		console.log("Ajax Request Complete");
		console.log(arguments);
	}).ajaxError(function()
	{
		toastr.error("Ajax Request Failed");
		console.log("Ajax Request Failed");
		console.log(arguments);
	});
}($(document)));

$(function()
{
	var GenerateGuid = function GenerateGuid()
	    {
		    var d = new Date().getTime();

		    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c)
		    {
			    var r = (d + Math.random() * 16) % 16 | 0;

			    d = Math.floor(d / 16);

			    return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
		    });
	    },
	    LocationGuid = function LocationGuid(location)
	    {
		    return location ? location.match(/[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}/i) : "";
	    };

	var Widget = function Widget(properties)
	{
		console.log("Base Widget Initialising...");

		this.Id = null;
		this.Name = null;
		this.Url = null;
		this.Settings = null;

		var _this = this,
		    _init = function _init(properties)
		    {
			    console.log("Base Widget Private Initialising...");

			    $.extend(_this, properties);

			    console.log("Base Widget Private Initialised");

			    return _this;
		    }(properties || {});

		console.log("Base Widget Initialised");
	}

	Widget.prototype = Object.create(Object.prototype, {
		render: {
			value: function($element)
			{
				console.log("Base Widget View Loading...");

				if ($element && this.Url && this.Url.View)
				{
					console.log("Base Widget View Async Loading...");

					$element.load(this.Url.View, function()
					{
						console.log("Base Widget View Async Loaded");
					});
				}

				console.log("Base Widget View Loaded");
			},
			enumerable: true,
			configurable: true,
			writable: true
		},
		load: {
			value: function()
			{
				console.log("Base Widget Settings Loading...");

				if (this.Url && this.Url.Api && this.Id)
				{
					console.log("Base Widget Async Settings Loading...");

					$.getJSON(this.Url.Api + "/" + this.Id, $.proxy(function(data, status, xhr)
					{
						this.Name = data.Name;

						if (data.Url)
							this.Url = JSON.parse(data.Url);

						if (data.Settings)
							this.Settings = JSON.parse(data.Settings);

						console.log("Base Widget Settings Async Loaded");
					}, this));
				}

				console.log("Base Widget Settings Loaded");
			},
			enumerable: true,
			configurable: true,
			writable: true
		},
		save: {
			value: function()
			{
				console.log("Base Widget Saving...");

				if (this.Url && this.Url.Api)
				{
					console.log("Base Widget Async Saving...");

					$.post(this.Url.Api, {
						Id: this.Id,
						Name: this.Name,
						Url: JSON.stringify(this.Url),
						Settings: JSON.stringify(this.Settings)
					}, $.proxy(function(data, status, xhr)
					{
						if (!this.Id)
						{
							var location = xhr.getResponseHeader("location");

							console.log("Location: " + location);

							this.Id = LocationGuid(location);

							console.log("Widget Id: " + this.Id);
						}

						console.log("Widget Settings Async Saved");
					}, this));
				}

				console.log("Base Widget Saved");
			},
			enumerable: true,
			configurable: true,
			writable: true
		}
	});

	var MyWidget = function MyWidget(properties)
	{
		console.log("My Widget Initialising...");

		Widget.call(this, properties);

		console.log("My Widget Initialised");
	}

	MyWidget.prototype = Object.create(Widget.prototype, {
		save: {
			value: function()
			{
				console.log("My Widget Saving...");

				Widget.prototype.save.apply(this, arguments);

				console.log("My Widget Saved");
			},
			enumerable: true,
			configurable: true,
			writable: true
		}
	});

	var $test = $("#test"),
	    defaults = {
		    Url: {
			    Api: "/api/widget",
			    View: "/widget"
		    }
	    },
	    base = new Widget($.extend({}, defaults, {
		    Name: "Base Widget"
	    })),
	    instance = new MyWidget($.extend({}, defaults, {
		    Id: "7F2C598C-6C33-48EA-9BBC-6B713390363A"
	    }));

	//7F2C598C-6C33-48EA-9BBC-6B713390363A

	window.Widget = window.Widget || Widget;
	window.MyWidget = window.MyWidget || MyWidget;

	window.MyBase = window.MyBase || base;
	window.MyInstance = window.MyInstance || instance;

	instance.render($test);
	instance.load();
	//instance.save();

	$.each([
		{ name: "Base", enumerable: base },
		{ name: "Instance", enumerable: instance }], function(index, item)
	{
		var _name = item.name,
		    _enum = item.enumerable,
		    _count = 0;

		console.log("---------------------- Enum " + _name + " ----------------------");

		$.each(_enum, function(index, property)
		{
			console.log(_count++ + ": " + index);
			console.log(_enum[index]);
		});

		console.log("---------------------- " + _name + " Count " + _count + " ----------------------");
	});
});
/// <reference path="../../_basicReferences.js" />

/*
 Base Submission View Model

 Description;
 This is the view model for a single Submission that contains all properties of the
 model AND client-side behaviour.

 Structure;
 Submission.Model.Options()[].OptionVersions()[].Quotes()[]
 Submission.Model.Options()[].CurrentVersion().Quotes()[]

 Usage;
 var vmSubmission = new Submission(0, "Id");

 ko.applyBindings(vmSubmission);

 TODO: Refactor vmSubmission to a simpler structure (group together functions, subscriptions, computed's, DTO's, etc)

 AutomationId Structure : "S:1-O:1-V:1-Q:1"
 */

/*
 TODO: Summary
 - Nest Submission view-model within a Home view-model (use Knockout binding handlers for tabs, etc)
 - Implement a User settings view-model AND take advantage of its observables
 - Extract bulky AJAX calls AND use a generic helper instead
 - Submission base to represent the model, not the DTO
 - Use Knockout binding context ($parents, $parent), not custom GetParent functions
 - Simplify Sync (generic AND recursive algorithm) AND remove KOTrim
 - Reduce the number of observables, functions, members, etc AND group them together
 - Attach Knockout validation
 - Remove commented-out-code (this file is big enough already!)
 - Comply with HTML5 standards
 */
function vmSubmission(id, domId, initialiseSelf, isReadOnly)
{
	var self = this;

	self.Id = id > 0 ? id : 0;
	self.Form = $(".form", $("#" + domId));

	self.OptionIndexToCopy = ko.observable(0);
	self.CreatingQuoteSheet = ko.observable(false);
	self.IsInitialised = ko.observable(false);
	self.IsSaving = ko.observable(false);
	self.IsReadOnly = ko.observable(isReadOnly || false);
	self.IsLoading = ko.observable(false);
	self.ValidationErrors = ko.observable("");

	self.Defaults = null;

	self.TeamQuoteTemplatesList = ko.observableArray([]);
	self.TeamId = ko.observable();

	self.BrokerRating = ko.observable("");
	self.BrokerScore = ko.observable("");
	self.BrokerCreditLimit = ko.observable("");
	self.WorldCheckCount = ko.observable("");
	self.CrossSellingCount = ko.observable("");
	self.LossRatioGraphProcessingImgVisible = ko.observable(false);

	self.SetSelectedQuoteAtSubmissionLevel = function() {
		var optionTab = $("li.active a[data-toggle='tab'][data-target^='#" + domId + "-option']"),
		    optionIndex = optionTab.length > 0 ? optionTab.parent().index() : 0,
		    optionDomId = optionTab.data("target");
		quoteDomId = optionDomId + " .carousel .carousel-inner div.active",
			quoteIndex = $(quoteDomId).index();

		$(".val-submission-top-level-quote",
			$("#" + domId + " .val-submission-top-level-option").hide().eq(optionIndex).show()
		).hide().eq(quoteIndex).show();
	};

	self.Model = {
		AutomationId: ko.observable("S:0"),

		Id: ko.observable(0),
		Timestamp: ko.observable(),
		Title: ko.observable("New Submission"),
		UnderwriterNotes: ko.observable(),
		QuoteSheetNotes: ko.observable(),

		Options: ko.observableArray([]),

		SubmissionMarketWordingsList: ko.observableArray(),
		CustomSubmissionMarketWordingsList: ko.observableArray(),
		
		SubmissionTermsNConditionWordingsList: ko.observableArray(),
		CustomSubmissionTermsNConditionWordingsList: ko.observableArray(),

		SubmissionSubjectToClauseWordingsList: ko.observableArray(), // TODO: Remove completely?
		CustomSubmissionSubjectToClauseWordingsList: ko.observableArray(),

		SubmissionWarrantyWordingsList: ko.observableArray(), // TODO: Remove completely?
		CustomSubmissionWarrantyWordingsList: ko.observableArray(),

		ExpiryDateOffset: 0,

		AuditTrails: []
	};

	self.MarketWordings = ko.observable();
	self.TermsAndConditions = ko.observable();
	self.Subjectivities = ko.observable();
	self.Warranties = ko.observable();

	self.RelatedInsureds = ko.observable();
	self.RelatedDocuments = ko.observable();

	self.ModelValidation = ko.validatedObservable(self.Model);
	self.errors = ko.validation.group(self.Model, {
		deep: true, observable: false
	});

	self.Functions = { // TODO: Move all functions into here
		LoadDefaultWordings: function(officeId)
		{
			var teamId = self.TeamId();

			if (teamId && officeId)
			{
				_.each([
					{ Name: "MarketWordingSettings", List: "SubmissionMarketWordingsList", Data: "MarketWording", Url: "/admin/getmarketwordingsforteamoffice" },
					{ Name: "TermsNConditionWordingSettings", List: "SubmissionTermsNConditionWordingsList", Data: "TermsNConditionWording", Url: "/admin/gettermsnconditionwordingsforteamoffice" },
					{ Name: "CustomSubjectToClauseWordingSettings", List: "CustomSubmissionSubjectToClauseWordingsList", Data: "SubjectToClauseWording", Url: "/admin/getsubjecttoclausewordingsforteamoffice" },
					{ Name: "CustomWarrantyWordingSettings", List: "CustomSubmissionWarrantyWordingsList", Data: "WarrantyWording", Url: "/admin/getwarrantywordingsforteamoffice" }
				], function(wording)
				{
					$.getJSON(wording.Url, { teamId: teamId, officeId: officeId }, function(data)
					{
						var vm = self.Model[wording.List],
						    add = _.filter(data, function(itemA)
						    {
							    return !_.find(vm(), function(itemB)
							    {
								    return itemA[wording.Data].Id == ko.utils.unwrapObservable(itemB.Id);
							    });
						    });

						_.each(add, function(item)
						{
							item[wording.Data].DisplayOrder = item.DisplayOrder || 0;
							item[wording.Data].IsStrikeThrough = item.IsStrikeThrough || false;
							item[wording.Data].IsSelected = false;

							vm.push(ko.mapping.fromJS(item[wording.Data]));
						});
					});
				});
			}
		},
		LoadRelatedInsureds: function($data, e)
		{
			if (!self.RelatedInsureds())
			{
				self.RelatedInsureds(new vmRelatedInsureds(
					{
						Url: "/insured/insureddetailsminimal",
						Template: "related-insureds-row-template"
					}).Initialise());

				if (!$.isBlank(self.SelectedQuote().InsuredName()))
					self.RelatedInsureds().Functions.Search(self.SelectedQuote().InsuredName());
			}
		},
		LoadRelatedDocuments: function()
		{
			if (!self.RelatedDocuments())
			{
				self.RelatedDocuments(new vmRelatedDocuments(
					{
						Url: "/uwdocument/relateddocuments",
						Template: "related-documents-row-template"
					}).Initialise());
			}

			var policyIds = [];

			_.each(self.Model.Options(), function(option)
			{
				_.each(option.OptionVersions(), function(version)
				{
					_.each(version.Quotes(), function(quote)
					{
						var policyId = quote.SubscribeReference(),
						    renewalId = quote.RenPolId();

						if (policyId) policyIds.push(policyId);
						if (renewalId) policyIds.push(renewalId);
					});
				});
			});

			self.RelatedDocuments().PolicyIds(policyIds);
		},
		LoadWordings: function($data, e)
		{
			var title = $(e.target).text();

			if (title == "Market Wordings" && !self.MarketWordings())
				self.MarketWordings(new vmWordings(
					{
						Url: "/admin/getmarketwordings_kendo",
						AvailableTemplate: "marketwordings-row-template",
						SelectedTemplate: "selected-marketwordings-row-template",
						CustomTemplate: "custom-marketwordings-row-template",
						SelectedData: self.Model.SubmissionMarketWordingsList,
						CustomData: self.Model.CustomSubmissionMarketWordingsList,
						SelectedColumns: [
							{ field: "WordingRefNumber", title: "Code", width: "25%" },
							{ field: "Title", title: "Description" }
						],
						CustomColumns: [
							{ field: "WordingRefNumber", title: "Code", width: "25%" },
							{ field: "Title", title: "Description" }
						]
					}).Initialise());
			else if (title == "Terms And Conditions" && !self.TermsAndConditions())
				self.TermsAndConditions(new vmWordings(
					{
						Url: "/admin/gettermsnconditionwordings_kendo",
						AvailableTemplate: "termsandconditions-row-template",
						SelectedTemplate: "selected-termsandconditions-row-template",
						CustomTemplate: "custom-termsandconditions-row-template",
						SelectedData: self.Model.SubmissionTermsNConditionWordingsList,
						CustomData: self.Model.CustomSubmissionTermsNConditionWordingsList
					}).Initialise());
			else if (title == "Subjectivities" && !self.Subjectivities())
				self.Subjectivities(new vmWordings(
					{
						CustomTemplate: "custom-subjectivities-row-template",
						CustomData: self.Model.CustomSubmissionSubjectToClauseWordingsList,
						CustomColumns: [
							{ field: "Title", title: "Description" },
							{ field: "IsStrikeThrough", title: "StrikeThrough", width: "20%" }
						],
						CodeRequired: false
					}).Initialise());
			else if (title == "Warranties" && !self.Warranties())
				self.Warranties(new vmWordings(
					{
						CustomTemplate: "custom-warranties-row-template",
						CustomData: self.Model.CustomSubmissionWarrantyWordingsList,
						CustomColumns: [
							{ field: "Title", title: "Description" },
							{ field: "IsStrikeThrough", title: "StrikeThrough", width: "20%" }
						],
						CodeRequired: false
					}).Initialise());
		}
	};

	self.Computeds = function(vm, model)
	{
		model.ActiveOptions = ko.computed(function()
		{
			return ko.utils.arrayFilter(model.Options(), function(options)
			{
				return options.Id() >= 0;
			});
		});

		model.CanSave = ko.computed(function()
		{
			return !vm.IsReadOnly()
				&& !vm.IsLoading()
				&& !vm.IsSaving()
				&& vm.ModelValidation.isValid();
		});

		model.CanCreateQuoteSheet = ko.computed(function()
		{
			var canCreate = model.CanSave() & !vm.CreatingQuoteSheet();

			ko.utils.arrayForEach(model.ActiveOptions(), function(option)
			{
				ko.utils.arrayForEach(option.CurrentVersion().ActiveQuotes(), function(quote)
				{
					canCreate &= quote.SubscribeReference() && quote.SubscribeReference().length > 0;

					return canCreate;
				});

				return canCreate;
			});

			return canCreate;
		});

		// TODO: Requires fix; this is currently fired twice when we add new quote.... when the quote collection changes.
		vm.SelectedQuote = ko.forcibleComputed(function()
		{
			var isInitialised = vm.IsInitialised(),
			    currentOption = isInitialised ? vm.CurrentOption() : null,
			    currentQuote = currentOption ? currentOption.CurrentQuote() : null;

			return currentQuote;
		});

		model.SetInsuredTabLabel = ko.computed(function()
		{
			var quote = vm.SelectedQuote(),
			    insured = quote && quote.InsuredName
				    ? quote.InsuredName() || "New Submission"
				    : "New Submission";

			$("a[href$='" + domId + "']:first")
				.attr("title", insured).attr("alt", insured)
				.children("span")
				.text(insured.length > 14 ? insured.substring(0, 12) + "..." : insured);
		});

		vm.SelectedQuoteIsValid = ko.computed(function()
		{
			return ko.validatedObservable(vm.SelectedQuote()).isValid();
		});
	};

	self.Subscriptions = function(vm, model) { };

	self.Initialise = function(vm, syncCallback)
	{
		if (!domId)
		{
			toastr.error("No DOM Id specified, cannot initialise Submission view model");

			self.Cancel();
		}
		else
		{
			amplify.subscribe(domId + "_val-worldcheck-matches", function(message)
			{
				self.SearchWorldCheck(message);
			});

			amplify.subscribe(domId + "_val-related-loss-ratios", function(message)
			{
				if (self.RelatedInsureds())
					self.RelatedInsureds().Functions.Search(message);
			});

			amplify.subscribe(domId + "_val-cross-selling", function (message)
			{
				self.CrossSellingCheck(message);
			});

			amplify.subscribe(domId + "_val-broker-lossratio", function (message)
			{
				self.SetBrokerLossRatios(message);
			});

			amplify.subscribe(domId + "_val-broker-summary", function (message)
			{
				self.SetBrokerSummary(message);
			});

			amplify.subscribe(domId + "_val-related-wordings", function(message)
			{
				self.Functions.LoadDefaultWordings(message);
			});

			self.Subscriptions(self, self.Model);
			self.Computeds(self, self.Model);

			self.Model.Options.push(new Option(0, domId, self));

			self.BindKO(vm);

			if (self.Id > 0) self.LoadSubmission("/api/submissionapi/getsubmission", syncCallback);
			else self.InitialiseForm();
		}
	};

	self.LoadSubmission = function(url, syncCallback)
	{
		self.IsLoading(true);

		self.ModelValidation.valueWillMutate();

		$.ajax(
			{
				url: url,
				type: "GET",
				data: { id: self.Id },
				dataType: "json",
				contentType: "application/json",
				success: function(data, status, xhr)
				{
					toastr.success("Submission retrieved");

					if (data.Submission)
					{
						self.syncJSON(data.Submission);

						if (syncCallback) syncCallback(data.Submission);

						self.InitialiseForm();

						toastr.success("Submission synchronised");
					}
					else toastr.warning("Submission data missing");
				},
				complete: function(xhr, status)
				{
					self.IsLoading(false);

					self.Functions.LoadRelatedDocuments();

					self.ModelValidation.valueHasMutated();
				}
			});
	};

	self.InitialiseForm = function() {
		self.GetAuditTrailsList(self.Id);
		self.InitialisePane();
		self.IsInitialised(true);

		self.DirtyReset();
	};

	self.auditTrailsPopupShown = false;
	self.ShowPopAuditTrails = function() {
		if (self.auditTrailsPopupShown === false)
		{
			$('.showAuditTrail', self.Form).popover({
				html: true,
				content: function()
				{
					return $('#popover-showAuditTrail', self.Form).html();
				},
				trigger: 'manual',
				placement: 'bottom',
				template: '<div class="popover" style="width:400px"><div class="arrow"></div><div class="popover-inner" style="width:400px"><div class="popover-content"><p></p></div></div></div>'
			});

			$('.showAuditTrail', self.Form).popover('show');
			self.auditTrailsPopupShown = true;
		} else {
			$('.showAuditTrail', self.Form).popover('toggle');
		}
	};

	self.GetQuoteTemplates = function(teamId)
	{
		self.TeamQuoteTemplatesList.removeAll();

		var ajaxConfig = { Url: "/Admin/GetQuoteTemplatesForTeam?teamId=" + teamId, VerbType: "GET" };

		var response = ConsoleApp.AjaxHelper(ajaxConfig);

		response.success(function(data)
		{

			if (data.length > 0)
			{
				$.each(data, function(key, value)
				{
					self.TeamQuoteTemplatesList.push(new ConsoleApp.QuoteTemplate()
						.Id(value.Id)
						.Name(value.Name)
						.RdlPath(value.RdlPath));
				});
			}
			else toastr.info("No Quote Templates for Team");
		});

	};

	self.auditTrailsList = ko.observableArray([]);
	// Kendo Grid
	self.AuditTrailsListTable = {
		data: self.auditTrailsList,
		columns: [
			{ field: "Description", title: "Name" },
			{ field: "CreatedOn", title: "Created On" },
			{ field: "CreatedBy", title: "Created By" }

		],
		pageable:
		{
			pageSize: 5,
			messages: { display: "{0:#,###0} - {1:#,###0} of {2:#,###0} items" },
			buttonCount: 5
		},
		sortable: false,
		scrollable: false,
		selectable: true,
		reorderable: false,
		serverFiltering: false,
		rowTemplate: 'AuditTrailsListTable-row-template',
		altRowTemplate: 'AuditTrailsListTable-row-template',
		useKOTemplates: true
	};

	self.GetAuditTrailsList = function(submissionId)
	{
		$.ajax(
			{
				url: "/Submission/WorldCheckAuditTrailForSubmission",
				type: "GET",
				data: { id: submissionId },
				dataType: "json",
				success: function(data)
				{
					if (data.total > 0) {
						var auditTrailsList = [];
						$.each(data.results, function(key, value) {
							auditTrailsList.push({
								Id: value.Id,
								Source: value.Source,
								Referenc: value.Reference,
								Title: value.Title,
								Description: value.Description.replace("World Check requested for insured name: ", ""),
								CreatedOn: value.CreatedOn,
								CreatedBy: value.CreatedBy.replace(".*\\\\(.*)", "$1")
							});
						});
						self.auditTrailsList(auditTrailsList);
					}
				}
			});
	};
	
	self.BindKO = function(viewModel)
	{

		if (viewModel === undefined) // TODO: What about null values ?
			ko.applyBindings(self, document.getElementById(domId));
		else
			ko.applyBindings(viewModel, document.getElementById(domId));
	};

	self.UnbindUnload = function()
	{
		$(window).unbind("beforeunload." + domId);
	};

	self.UnloadConfirmation = function(e)
	{
		//if (e)
		//{
		//	if (isDirty)
		//	{
		//		toastr.warning("Unsaved Submission changes detected");

		//		return "You have unsaved changes!";
		//	}

		//	return null;
		//}
		//else

		if (self.DirtyCheck())
		{
			toastr.warning("Unsaved Submission changes detected");

			var result = window.confirm("You have unsaved changes!\n\rAre you sure you wish to leave ?");

			//if (result) self.DirtyFlag.IsDirty(false);

			return result;
		}

		//return null;
		return true;
	};

	self.SelectedInsured_RefreshInfo = function (e) {
		amplify.publish(domId + "_val-worldcheck-matches", e.InsuredName());
	};

	self.AddAdditionalInsured = function()
	{
		var item = {
			Id: ko.observable(),
			InsuredId: ko.observable(),
			InsuredName: ko.observable(),
			InsuredType: ko.observable("Additional"),
			InsuredTypes: ["Additional", "Cedent", "Interested Party", "Reinsured", "Obligor", "Parent", "Loss Payee"],
			AutomationId: ko.computed(
				{
					read: function()
					{
						return self.SelectedQuote().AutomationId() + "_" + "AI";
					},
					deferEvaluation: true
				})
		};

		item.InsuredName.subscribe(function(value)
		{
			amplify.publish(domId + "_val-worldcheck-matches", value);
		});
		self.SelectedQuote().HideAdditionalInsureds(false);
		self.SelectedQuote().AdditionalInsuredList.push(item);
	};

	self.RemoveAdditionalInsured = function(item)
	{
		self.SelectedQuote().AdditionalInsuredList.remove(item);
	};

	// Note: Done at the inheriting submission level to add new properties at quote level etc...
	self.AddOption = function()
	{
		var length = self.Model.Options().length,
		    quoteSubData = self.SelectedQuote() ? self.SelectedQuote().koTrim() : null,
		    newOption = new Option(length, domId, self, quoteSubData),
		    submissionId = self.Model.Id();

		newOption.SubmissionId(submissionId);

		length = self.Model.Options.push(newOption);

		return length;
	};

	self.CopyOption = function()
	{
		self.ModelValidation.valueWillMutate();
		
		var length = self.Model.Options().length,
		    optionIndex = self.OptionIndexToCopy(),
		    originalOption = self.Model.Options()[optionIndex],
		    originalVersion = originalOption.CurrentVersion(),
		    newOptionData = originalOption.koTrim(),
		    newVersionData = originalVersion.koTrim(),
		    newOption = new Option(length, domId, self),
		    newOptionTitle = newOption.Title();

		newOptionData.Id = 0;
		newOptionData.Title = newOptionTitle;

		newVersionData.OptionId = 0;
		newVersionData.VersionNumber = 0;
		newVersionData.Title = "Version 1";
		newVersionData.IsLocked = false;

		// Remove the deleted quotes
		newVersionData.Quotes = $.grep(newVersionData.Quotes, function (quote) { return quote.Id > -1; });

		$.each(newVersionData.Quotes, function(quoteIndex, quoteItem)
		{
			quoteItem.Id = 0;
			quoteItem.OptionId = 0;
			quoteItem.VersionNumber = 0;
			quoteItem.SubmissionStatus = "SUBMITTED";
			quoteItem.IsSubscribeMaster = false;

			quoteItem.BenchmarkPremium = "";
			quoteItem.TechnicalPremium = "";
			quoteItem.QuotedPremium = "";
			quoteItem.LimitAmount = "";
			quoteItem.ExcessAmount = "";
			
			quoteItem.WrittenOrder = "";
			quoteItem.WrittenLine = "";
			quoteItem.WrittenAmount = "";
			quoteItem.OrderAmountIndicator = "true";
			quoteItem.WholeOrdIndicator = "true";
			quoteItem.PremiumSettlementCurrency = "";
			quoteItem.EstimatedSignedPercentage = "";
			
			$.each(quoteItem.AdditionalInsuredList, function (additionalInsuredIndex, additionalInsureItem) {
				additionalInsureItem.Id = 0;
			});

			self.QCopyOptionSetDefaults && self.QCopyOptionSetDefaults(quoteItem);
		});

		newOptionData.OptionVersions = [newVersionData];

		newOption.syncJSON(newOptionData);

		length = self.Model.Options.push(newOption);

		self.ModelValidation.valueHasMutated();

		return length;
	};

	self.QuoteSheetCreationCheck = function(element, e)
	{
		//if (self.DirtyFlag.IsDirty())
		{
			self.Save(element, e, function() { self.CreateQuoteSheet(element); });
		}
		//else
		{
			self.CreateQuoteSheet(element);
		}
	};

	self.CreateQuoteSheet = function(element, e)
	{
		var quoteSheetTemplateId;
		if (self.TeamQuoteTemplatesList().length === 0)
		{
			toastr.warning("No Templates for quote sheet");
			return;
		}
		else if (self.TeamQuoteTemplatesList().length === 1)
		{
			quoteSheetTemplateId = self.TeamQuoteTemplatesList()[0].Id();
		}
		else
		{
			quoteSheetTemplateId = element.Id();
		}

		var optionList = [];
		$.each(self.Model.Options(), function(optionIndex, optionItem)
		{
			if (optionItem.AddToQuoteSheet())
			{
				optionList.push(
					{
						OptionId: optionItem.Id(),
						OptionVersionNumberList: [optionItem.CurrentVersion().VersionNumber()]
					});
			}
		});

		if (optionList.length === 0)
		{
			toastr.warning("No options selected for quote sheet");
			return;
		}

		self.CreatingQuoteSheet(true);

		$.ajax(
			{
				url: "/quotesheet/CreateQuote",
				type: "POST",
				contentType: "application/json; charset=utf-8",
				data: JSON.stringify(
					{
						QuoteSheetTemplateId: quoteSheetTemplateId,
						SubmissionId: self.Model.Id(),
						OptionList: optionList,
						QuoteExpiry: self.Defaults.QuoteExpiry
					}),
				success: function(data, status, xhr)
				{
					toastr.info("Quote sheet created");

					if (data.Submission)
					{
						toastr.success("Submission updated");

						self.syncJSON(data.Submission);

						toastr.success("Submission synchronised");
					}

					var responseLocation = xhr.getResponseHeader("Location");

					if (responseLocation)
					{
						window.open(responseLocation, "_blank");
					}

					self.Save();

					if (self.RelatedDocuments())
						self.RelatedDocuments().Search();
				},
				complete: function(xhr, status)
				{
					self.CreatingQuoteSheet(false);
				}
			});
	};

	self.ToggleComparison = function()
	{
		$(".val-optioncomparison-datatable", $("#" + domId)).each(function()
		{
			if ($(this).is(":visible")) $(this).hide();
			else $(this).show();
		});
	};

	self.Cancel = function()
	{
		if (self.UnloadConfirmation(null))
		{
			self.UnbindUnload();

			// TODO: Kill view model ?
			// if this is updated an no londer used we need to update th Val_CloseTab function in tabFunctions as it is
			// assuming that we will be calling this Cancel method.
			Val_CloseTab(domId, function () {
				//remove subscription TODO: This is not working , need to modify the amplify code.
				amplify.unsubscribe(domId + "_val-worldcheck-matches");
				amplify.unsubscribe(domId + "_val-related-loss-ratios");
				amplify.unsubscribe(domId + "_val-cross-selling");
			}, self);
		}
	};

	self.Save = function(element, e, callback, url, syncCallback)
	{

		self.IsSaving(true);
		self.IsLoading(true);
		self.ValidationErrors("");

		var modelJSON = self.toJSON(),
		    isNew = self.Id === 0;

		toastr.info("Saving Submission");

		$.ajax(
			{
				url: url ? url : !isNew ? "/api/submissionapi/editsubmission" : "/api/submissionapi/createsubmission",
				headers: { 'X-SubmissionType': self.Model.submissionTypeId() },
				type: !isNew ? "PUT" : "POST",
				data: modelJSON,
				dataType: "json",
				contentType: "application/json",
				success: function(data, status, xhr)
				{
					$.each(self.Model.Options(), function(optionIndex, optionItem)
					{
						$.each(optionItem.OptionVersions(), function(versionIndex, versionItem)
						{
							$.each(versionItem.Quotes(), function(quoteIndex, quoteItem)
							{
								quoteItem.ValidationErrors("");
							});
						});
					});

					if (isNew) toastr.success("Submission created");
					else toastr.success("Submission edited");

					if (data.Submission)
					{
						self.syncJSON(data.Submission);

						if (syncCallback) syncCallback(data.Submission);

						self.GetAuditTrailsList(self.Model.Id());

						toastr.success("Submission synchronised");
					}

					if (callback) callback(element, e);

					if (isNew)
					{
						if (self.Model.Options()[0].OptionVersions()[0].Quotes()[0].RenPolId())
						{
							$.pubsub.publish("policyRenewed",
								{
									RenPolId: self.Model.Options()[0].OptionVersions()[0].Quotes()[0].RenPolId()
								});
						}
						else
						{
							$.pubsub.publish("submissionCreated",
								{
									SubscribeReference: self.Model.Options()[0].OptionVersions()[0].Quotes()[0].SubscribeReference()
								});
						}
					}

					self.DirtyReset();
				},
				error: function(xhr, status, error)
				{
					toastr.error("Saving Submission failed");

					if (xhr.status === 400)
					{
						var errorData = xhr.responseJSON ? xhr.responseJSON.Error : undefined,
						    errorsReturned = false,
						    errorHTML = [];

						if (errorData)
						{
							$.each(self.Model.Options(), function(optionIndex, optionItem)
							{
								var optionPattern = "Submission.Options[\\[]" + optionIndex + "[\\]]";

								$.each(optionItem.OptionVersions(), function(versionIndex, versionItem)
								{
									var versionPattern = optionPattern + "[.]OptionVersions[\\[]" + versionIndex + "[\\]]";

									$.each(versionItem.Quotes(), function(quoteIndex, quoteItem)
									{
										var quotePattern = versionPattern + "[.]Quotes[\\[]" + quoteIndex + "[\\]]",
										    errorPattern = quotePattern + "[^\"]*",
										    errorRegEx = new RegExp(errorPattern, "gi"),
										    errorMatches = xhr.responseText.match(errorRegEx);

										$(errorMatches).each(function(matchIndex, errorMatch)
										{
											$(errorData[errorMatch]).each(function(errorIndex, errorMessage)
											{
												errorMessage = /error converting value/i.test(errorMessage) || /required property/i.test(errorMessage)
													? (_.last(/\'([^'.]+|[^']+\[\d+\][^']+)\'/.exec(errorMessage)) || "Missing property")
													               .replace(/\'/, "")
													               .replace(/AdditionalInsuredList\[(\d+)\].InsuredId/, "Additional Insured at index '$1'")
													               .replace(/([A-Z])/g, " $1") + " is required."
													: errorMessage;

												if (errorMessage && $.inArray(errorMessage, errorHTML) === -1)
													errorHTML.push(errorMessage);

												delete errorData[errorMatch];
											});
										});

										errorsReturned = errorsReturned || errorHTML.length > 0

										quoteItem.ValidationErrors(errorHTML.length > 0 ? "<li>" + errorHTML.join("</li><li>") + "</li>" : "");
									});
								});
							});

							errorHTML = [];

							$.each(errorData, function(propertyIndex)
							{
								$(errorData[propertyIndex]).each(function(errorIndex, errorMessage)
								{
									errorMessage = /^Error converting value/i.test(errorMessage) || /^Required property/i.test(errorMessage)
										? (_.last(/\'([^'.]+|[^']+\[\d+\][^']+)\'/.exec(errorMessage)) || "Missing property")
										               .replace(/\'/, "")
										               .replace(/AdditionalInsuredList\[(\d+)\].InsuredId/, "Additional Insured at index '$1'")
										               .replace(/([A-Z])/g, " $1") + " is required."
										: errorMessage;

									if (errorMessage && $.inArray(errorMessage, errorHTML) === -1)
										errorHTML.push(errorMessage);
								});
							});
						}

						errorsReturned = errorsReturned || errorHTML.length > 0

						self.ValidationErrors(!errorsReturned ? "<li>No errors returned, please contact the administrator</li>" : (errorHTML.length > 0 ? "<li>" + errorHTML.join("</li><li>") + "</li>" : ""));
					}
				},
				complete: function(xhr, status)
				{
					self.IsLoading(false);
					self.IsSaving(false);

					self.Functions.LoadRelatedDocuments();
				}
			});
	};

	self.CurrentOption = function()
	{
		var optionTab = $("li.active a[data-toggle='tab'][data-target^='#" + domId + "-option']"),
		    optionIndex = optionTab.length > 0 ? optionTab.attr("data-target").match(/[0-9]{1,2}$/)[0] : 0;

		return (optionIndex >= 0)
			? self.Model.ActiveOptions()[optionIndex]
			: self.Model.ActiveOptions()[0];
	};

	self.InitialiseTabs = function(element)
	{
		ConsoleApp.InitialiseTabs(element, domId, self);
	};

	self.InitialisePane = function(element)
	{
		ConsoleApp.InitialisePane(element, self);
	};

	InitSubmissionKendoGrids(self);
	InitSubmissionSideBar(self);

	if (initialiseSelf)
	{
		self.Initialise();
	}
}

function Option(optionIndex, domId, parent, quoteSubData)
{
	var self = this;

	self.TitleoptionNumber = optionIndex + 1;

	self.GetParent = function()
	{ // TODO: Use knockout $parents
		return parent;
	};

	if (!!parent.Model.Options()[parent.Model.Options().length - 1])
	{
		var prevTitleoptionNumber = Number(parent.Model.Options()[parent.Model.Options().length - 1].Title().replace("Option ", ""));
		self.TitleoptionNumber = prevTitleoptionNumber + 1;
	}

	self.GetIndex = function()
	{
		return optionIndex;
	};

	self.SubmissionId = parent.Model.Id;

	self.Id = ko.observable(0);
	self.Timestamp = ko.observable("");
	self.Title = ko.observable("Option " + self.TitleoptionNumber);
	self.Comments = ko.observable("");
	self.VersionIndex = ko.observable(0);
	self.OptionVersions = ko.observableArray();

	self.OptionVersions.push(new OptionVersion(0, domId, self, quoteSubData)); // TODO: Move to initialise

	self.CanCopyOption = ko.observable(false);
	self.AddToQuoteSheet = ko.observable(true);
	self.EnableAddToQuoteSheet = ko.observable(true);

	// Initialise additional observables defined in inheriting
	if (parent.OAddAdditional)
		parent.OAddAdditional(self);
	
	self.Computeds = function(model)
	{

		model.CanCopy = ko.computed(function()
		{
			return model.CurrentVersion().CanCopy();
		});
	};

	self.Subscriptions = function(model)
	{
	};

	self.SetVersionIndex = function(data)
	{
		//var versionNumber = ko.utils.peekObservable(element.VersionNumber()),
		//	versionCount = self.OptionVersions().length,
		//	versionIndex = (versionCount - versionNumber) - 1;
		var versionIndex = self.OptionVersions.indexOf(data);

		self.VersionIndex(versionIndex);
	};

	self.AddOptionVersion = function()
	{
		var versionData = self.CurrentVersion().koTrim();

		return self.CopyOptionVersion(versionData);
	};

	self.CopyOptionVersion = function(versionData)
	{
		var length = self.OptionVersions().length,
		    newVersion = new OptionVersion(length, domId, self);

		versionData.Title = newVersion.Title();
		versionData.OptionId = 0;
		versionData.VersionNumber = newVersion.VersionNumber();
		versionData.IsLocked = false;
		
		// Remove the deleted quote.
		versionData.Quotes = $.grep(versionData.Quotes, function (quote) { return quote.Id > -1; });

		$.each(versionData.Quotes, function(quoteIndex, quoteItem)
		{
			quoteItem.Id = 0;
			quoteItem.OptionId = 0;
			quoteItem.VersionNumber = versionData.VersionNumber;
			quoteItem.Timestamp = "";
			quoteItem.SubmissionStatus = "SUBMITTED";

			if (quoteItem.IsSubscribeMaster === true)
			{
				if (self.CurrentVersion().Quotes()[quoteIndex].CorrelationToken() === quoteItem.CorrelationToken)
				{
					self.CurrentVersion().Quotes()[quoteIndex].IsSubscribeMaster(false);
				}
			}
		});

		newVersion.syncJSON(versionData);

		length = self.OptionVersions.unshift(newVersion);

		self.VersionIndex(0);

		return length;
	};

	self.NavigateToOption = function(element, e)
	{
		$("a[data-toggle='tab'][data-target='#" + domId + "-option" + optionIndex + "']").tab("show");
	};

	self.NavigateToQuote = function(element, e)
	{
		var optionDomId = domId + "-option" + optionIndex,
		    quoteIndex = parseInt($(e.target).text());

		if (isNaN(quoteIndex)) quoteIndex = 0;

		$("a[data-toggle='tab'][data-target='#" + optionDomId + "']").tab("show");
		$("#" + optionDomId + " .carousel").carousel(parseInt(quoteIndex));
	};

	self.SetMaster = function(element, e)
	{
		var optionDomId = domId + "-option" + optionIndex,
		    quoteIndex = parseInt($(e.target).text());

		if (isNaN(quoteIndex)) quoteIndex = $(e.target).parent("td").children("span:first");

		$("a[data-toggle='tab'][data-target='#" + optionDomId + "']").tab("show");
		$("#" + optionDomId + " .carousel").carousel(parseInt(quoteIndex));
	};

	self.VersionTitle = ko.computed(function()
	{
		var optionTitle = self.Title(),
		    versionIndex = self.VersionIndex(),
		    versionTitle = (self.OptionVersions()[versionIndex])
			    ? self.OptionVersions()[versionIndex].Title() : "";

		return optionTitle + " " + versionTitle.replace(/ersion /gi, "").toLowerCase();
	}, self);

	self.VersionCount = ko.computed(function()
	{
		return self.OptionVersions().length;
	}, self);

	self.CurrentVersion = ko.computed(function()
	{
		return self.OptionVersions()[self.VersionIndex()];
	}, self);

	self.AutomationId = ko.computed({
		read: function()
		{
			return 'S:0-O:' + parent.Model.Options.indexOf(self);
		},
		deferEvaluation: true
	});

	self.CurrentQuote = function()
	{
		var optionDomId = domId + "-option" + optionIndex,
		    quoteDomId = optionDomId + " .carousel .carousel-inner div.active",
		    quoteIndex = $("#" + quoteDomId).index(),
		    currentQuote = quoteIndex >= 0 && self.CurrentVersion().ActiveQuotes().length > quoteIndex
			    ? self.CurrentVersion().ActiveQuotes()[quoteIndex]
			    : self.CurrentVersion().ActiveQuotes()[0];

		return currentQuote;
	};

	self.ActiveOptionVersions = ko.computed(function()
	{
		return ko.utils.arrayFilter(self.OptionVersions(), function(optionVersion)
		{
			return optionVersion.OptionId() >= 0;
		});
	}, self);

	self.RequiredFieldsCheck = ko.computed(function()
	{
		var isValid = true;

		ko.utils.arrayForEach(self.CurrentVersion().Quotes(), function(quote)
		{
			isValid &= quote.COBId()
			&& quote.MOA()
			&& quote.OriginatingOfficeId()
			&& quote.AccountYear();

			return isValid;
		});

		self.CanCopyOption(isValid);

		return isValid;
	}, self);

	self.CanDelete = ko.computed(function()
	{
		var canDelete = parent.Model.Options().length > 1;

		$.each(self.ActiveOptionVersions(), function(versionIter, versionItem)
		{
			canDelete &= versionItem.Functions.CanDeleteCheck();
		});

		return canDelete;
	});

	self.DeleteOption = function(data, event) {
		var showOptionTabAfterDelete = $("a[data-toggle='tab'][data-target^='#" + domId + "-option" + "']").parent(".active").prev().length
			? $("a[data-toggle='tab'][data-target^='#" + domId + "-option" + "']").parent(".active").prev().children(":first")
			: $("a[data-toggle='tab'][data-target^='#" + domId + "-option" + "']").parent(".active").next().children(":first");
		event.preventDefault();

		if (data.Id() === 0)
		{
			ko.utils.arrayForEach(data.OptionVersions(), function(optionVersion)
			{
				ko.utils.arrayForEach(optionVersion.Quotes(), function(quote)
				{
					if (quote.IsSubscribeMaster())
					{
						var errorHtml = parent.ValidationErrors();
						errorHtml += '<li>Please note an unsaved master quote is removed.</li>';
						parent.ValidationErrors(errorHtml);
					}
				});
			});
			parent.Model.Options.remove(data);
		}
		else
		{
			ko.utils.arrayForEach(data.OptionVersions(), function(optionVersion)
			{
				ko.utils.arrayForEach(optionVersion.Quotes(), function(quote)
				{
					quote.Id(-1 * quote.Id());
				});
				optionVersion.OptionId(-1 * optionVersion.OptionId());
			});

			data.Id(-1 * data.Id());
		}

		showOptionTabAfterDelete.tab("show");
	};

	// TODO: This is to correct the option index for copy
	self.CopyOption = function(data, event)
	{
		var optionIndexToCopy = parent.Model.Options.indexOf(data);

		if (optionIndexToCopy > -1)
			parent.OptionIndexToCopy(optionIndexToCopy);

		parent.CopyOption();
	};
}

function OptionVersion(versionNumber, domId, parent, quoteSubData)
{
	var self = this;

	self.GetParent = function() // TODO: Use knockout $parents
	{
		return parent;
	};

	self.OptionId = ko.observable();
	self.VersionNumber = ko.observable(); // TODO: Computed/Subscription off parent.OptionVersions?
	self.IsExperiment = ko.observable();
	self.Timestamp = ko.observable();
	self.Title = ko.observable();

	self.Comments = ko.observable();
	self.IsLocked = ko.observable();
	self.Quotes = ko.observableArray();
	
	self.Functions = {
		AddQuote: function(e)
		{
			if (e) // User has initiated new Quote; copy sybmission level data.
			{
				quoteSubData = e.GetParent().SelectedQuote() ? e.GetParent().SelectedQuote().koTrim() : null;
				$.each(quoteSubData.AdditionalInsuredList, function (additionalInsuredIndex, additionalInsureItem) {
					additionalInsureItem.Id = 0;
				});
			}
			return self.Quotes.push(new Quote(domId, self, quoteSubData));
		},
		
		CanDeleteCheck: function() {
			var candelete = true;
			if (self.IsLocked()) return false;
			ko.utils.arrayForEach(self.ActiveQuotes(), function (quote) {
				candelete = candelete && quote.Functions.CanDeleteCheck();
			});
			return candelete;
		},
		
		Delete: function(version)
		{
			var current = parent.CurrentVersion(),
			    isNew = version.OptionId() === 0,
			    isCurrent = current === version;

			ko.utils.arrayForEach(version.ActiveQuotes(), function(quote)
			{
				quote.Functions.Delete();
			});

			if (isNew) parent.OptionVersions.remove(version); // TODO: Update version numbers too?
			else version.OptionId(-version.OptionId());

			parent.VersionIndex(parent.OptionVersions.indexOf(isCurrent
				? parent.ActiveOptionVersions()[0]
				: current)); // TODO: Shouldn't this be the version number?
		},
		SetDefaults: function()
		{
			self.OptionId(parent.Id());
			self.VersionNumber(versionNumber);
			self.Title = ko.observable("Version " + (versionNumber + 1));
			
			self.Functions.AddQuote();
		}
	};

	self.Computeds = function(model)
	{
		model.AutomationId = ko.computed(
			{
				read: function()
				{
					return "S:0"
						+ "-O:" + parent.GetParent().Model.Options.indexOf(parent)
						+ "-V:" + (parent.OptionVersions.peek().length -parent.OptionVersions.indexOf(model) -1);
				},
				deferEvaluation: true
			});

		model.ActiveQuotes = ko.computed(function()
		{
			return ko.utils.arrayFilter(model.Quotes(), function(quote)
			{
				return quote.Id() >= 0;
			});
		});

		model.CanAddQuotes = ko.computed(function()
		{
			var canAdd = !model.IsLocked() && model.VersionNumber() === 0;

			ko.utils.arrayForEach(model.ActiveQuotes(), function (quote)
			{
				canAdd &= !/^QUOTED$/i.test(quote.SubmissionStatus());

				return canAdd;
			});
			
			return canAdd && parent.GetParent().SelectedQuoteIsValid();
		});

		model.CanCopy = ko.computed(function()
		{
			return (!ko.utils.arrayFirst(model.ActiveQuotes(), function(quote)
				{
					return !(quote.COBId() && quote.COBId().length > 0
					&& quote.MOA() && quote.MOA().length > 0
					&& quote.OriginatingOfficeId() && quote.OriginatingOfficeId().length > 0
					&& quote.AccountYear() && quote.AccountYear().length > 0);
				})) && parent.GetParent().SelectedQuoteIsValid();
		});

		model.CanDelete = ko.computed(function()
		{
			return model.Functions.CanDeleteCheck()
				&& parent.ActiveOptionVersions && parent.ActiveOptionVersions() && parent.ActiveOptionVersions().length > 1;
		});
	};

	self.Subscriptions = function(model)
	{
		parent.OptionVersions.subscribe(function(value)
		{
			model.Title("Version " + (parent.OptionVersions().length - parent.OptionVersions.indexOf(model)));
		});
	};

	// Initialise additional observables defined in inheriting
	if (parent.GetParent().OVAddAdditional)
		parent.GetParent().OVAddAdditional(self);

	self.Initialise = function()
	{
		self.Functions.SetDefaults();

		self.Computeds(self);
		self.Subscriptions(self);
	};

	self.Initialise();
}

function Quote(domId, parent, quoteSubData)
{
	var self = this,
	    token = $.generateGuid(),
	    expiryOffset = 30;

	self.GetParent = function()
	{// TODO: Use knockout $parents
		return parent;
	};

	// Submission
	self.PolicyStatus = ko.observable();
	self.InsuredId = ko.observable();
	self.InsuredName = ko.observable();
	self.AdditionalInsuredList = ko.observableArray([]);
	self.COB = ko.observable();
	self.Coverholders = [];
	self._Coverholders = ko.observable();
	self.AnalysisCodes = ko.observableArray([]);
	self.BrokerCode = ko.observable();
	self.BrokerSequenceId = ko.observable();
	self.BrokerPseudonym = ko.observable();
	self.BrokerGroupCode = ko.observable();
	self.BrokerContact = ko.observable().extend({
		required: {
			message: "The broker contact is required",
			onlyIf: function () {
				return (self.PolicyStatus() === "BINDER" || self.PolicyStatus() === "MONBINDER" || self.PolicyStatus() === "COVER" || self.PolicyStatus() === "MONCOVER");
			}
		}
	});
	self.BrokerContactPhone = ko.observable();
	self.BrokerContactEmail = ko.observable();
	self.NonLondonBrokerCode= ko.observable();
	self.NonLondonBrokerName = ko.observable();
	self.UnderwriterCode = ko.observable();
	self.UnderwriterContactCode = ko.observable();
	self.LeaderNo= ko.observable();
	self.Leader = ko.observable();
	self.Domicile = ko.observable();
	self.Brokerage = ko.observable();
	self.QuotingOfficeId = ko.observable();
	self.GeoCode = ko.observable();

	// Identifiers
	self.OptionId = parent.OptionId;
	self.VersionNumber = parent.VersionNumber;
	
	self.Id = ko.observable();
	self.CorrelationToken = ko.observable();
	self.Timestamp = ko.observable();
	self.SubscribeTimestamp = ko.observable();

	// Descriptions
	self.Comment = ko.observable();
	self.Description = ko.observable();

	// Policy
	self.SubscribeReference = ko.observable();
	self.OrgSubscribeReference = ko.observable();
	self.FacilityRef = ko.observable();
	self.RenPolId = ko.observable();
	self.COBId = ko.observable();
	self.DeclinatureComments = ko.observable();
	self.DeclinatureReason = ko.observable();
	self.EntryStatus = ko.observable();
	self.MOA = ko.observable();
	self.FSAClass = ko.observable().extend({
		required: {
			message: "The FSA class is required",
			onlyIf: function () {
				return (self.PolicyStatus() === "BINDER" || self.PolicyStatus() === "MONBINDER" || self.PolicyStatus() === "COVER" || self.PolicyStatus() === "MONCOVER");
			}
		}
	});
	self.WordingRequired = ko.observable().extend({
		required: {
			message: "The wording is required",
			onlyIf: function () {
				return (self.PolicyStatus() === "BINDER" || self.PolicyStatus() === "MONBINDER" || self.PolicyStatus() === "COVER" || self.PolicyStatus() === "MONCOVER");
			}
		}
	});
	self.AggsRequired = ko.observable().extend({
		required: {
			message: "The aggregates are required",
			onlyIf: function () {
				return (self.PolicyStatus() === "BINDER" || self.PolicyStatus() === "MONBINDER" || self.PolicyStatus() === "COVER" || self.PolicyStatus() === "MONCOVER");
			}
		}
	});
	self.OriginatingOfficeId = ko.observable();
	self.PolicyType = ko.observable();
	self.SubmissionStatus = ko.observable();
	self.BusinessPlanDetailId = ko.observable();

	// Period
	self.AccountYear = ko.observable().extend({ moment: "YYYY" });
	self.InceptionDate = ko.observable().extend({ moment: "DD MMM YYYY" });
	self.ExpiryDate = ko.observable().extend({ moment: "DD MMM YYYY" });
	self.WrittenDate = ko.observable().extend({ moment: "DD MMM YYYY" });
	self.QuoteExpiryDate = ko.observable().extend({ moment: "DD MMM YYYY" });
	self.SettlementDueDate = ko.observable().extend({ moment: "DD MMM YYYY" }).extend({
		required: {
			message: "The settlement due date is required",
			onlyIf: function()
			{
				return (self.SubmissionStatus() === "QUOTED"
				|| self.SubmissionStatus() === "NON-BIND IND"
				|| self.SubmissionStatus() === "FIRM ORDER");
			}
		}
	});

	// Limit
	self.LimitCCY = ko.observable();
	self.LimitAmount = ko.observable();
	self.limitsBreach = ko.observable();

	// Excess
	self.ExcessCCY = ko.observable();
	self.ExcessAmount = ko.observable();

	// Pricing
	self.Currency = ko.observable();
	self.TechnicalPremium = ko.observable();
	self.BenchmarkPremium = ko.observable();
	self.TechnicalPricingBindStatus = ko.observable().extend({
		required: {
			message: "The technical pricing bind state is required",
			onlyIf: function () {
				return (self.PolicyStatus() === "BINDER" || self.PolicyStatus() === "MONBINDER" || self.PolicyStatus() === "COVER" || self.PolicyStatus() === "MONCOVER");
			}
		}
	});
	self.TechnicalPricingMethod = ko.observable().extend({
		required: {
			message: "The Technical pricing primary method is required",
			onlyIf: function () {
				return (self.PolicyStatus() === "BINDER" || self.PolicyStatus() === "MONBINDER" || self.PolicyStatus() === "COVER" || self.PolicyStatus() === "MONCOVER");
			}
		}
	});
	self.TechnicalPricingPremiumPctgAmt = ko.observable();

	// Premium & EPI
	self.IsEPIlocked = ko.observable(false);
	self.PremiumCurrency = ko.observable();
	self.QuotedPremium = ko.observable();
	self.WrittenOrder = ko.observable();
	self.WrittenLine = ko.observable();
	self.WrittenAmount = ko.observable();
	self.OrderAmountIndicator = ko.observable();
	self.WholeOrdIndicator = ko.observable().extend({
		pattern: {
			params: "true|undefined|^$",
			message: 'Invalid type',
			onlyIf: function () {
				return (self.OrderAmountIndicator() === "false");
			}
		}
	});
	self.PremiumSettlementCurrency = ko.observable();
	self.EstimatedSignedPercentage = ko.observable().extend({
		required: {
			message: "The estimated signed percentage is required",
			onlyIf: function () {
				return (self.PolicyStatus() === "BINDER" || self.PolicyStatus() === "MONBINDER" || self.PolicyStatus() === "COVER" || self.PolicyStatus() === "MONCOVER");
			}
		}
	});
	
	// Other
	self.IsInitialised = ko.observable();
	self.IsSubscribeMaster = ko.observable();
	self.ValidationErrors = ko.observable();
	self.IsSyncJson = ko.observable(false);
	self.HideAdditionalInsureds = ko.observable(true);

	// Initialise additional observables defined in inheriting
	if (parent.GetParent().GetParent().QAddAdditional)
		parent.GetParent().GetParent().QAddAdditional(self); // TODO: Remove

	self.Functions = {
		CanDeleteCheck: function()
		{
			return !(self.IsSubscribeMaster() && self.SubscribeReference() ? self.SubscribeReference().length > 0 : false);
		},
		ClearBrokerContact: function(e)
		{
			self.BrokerContact("");
			self.BrokerContactPhone(null);
			self.BrokerContactEmail(null);
		},
		ClearNonLondonBroker: function (e)
		{
			self.NonLondonBrokerCode("");
		},
		Delete: function()
		{
			var currentId = self.Id();

			if (self.IsSubscribeMaster())
			{
				var submission = parent.GetParent().GetParent(),
				    firstSlave = null;
				
				ko.utils.arrayFirst(submission.Model.ActiveOptions(), function(option)
				{
					ko.utils.arrayFirst(option.ActiveOptionVersions(), function(version)
					{
						firstSlave = ko.utils.arrayFirst(version.ActiveQuotes(), function(quote)
						{
							return quote.CorrelationToken() === self.CorrelationToken() && quote !== self;
						});

						return firstSlave;
					});

					return firstSlave;
				});

				if (firstSlave)
				{
					firstSlave.IsSubscribeMaster.valueWillMutate();
					firstSlave.IsSubscribeMaster(true);
					firstSlave.IsSubscribeMaster.valueHasMutated();
					
					self.IsSubscribeMaster(false);
				}
			}

			if (!currentId) parent.Quotes.remove(self);
			else self.Id(-currentId);
		}, // TODO: Move out to OptionVersion?
		SetSyncSlaveSubscriptions: function()
		{
			var slaveObservables = ["AccountYear",
				"AnalysisCodes",
				"COBId",
				"DeclinatureComments",
				"DeclinatureReason",
				"Description",
				"EntryStatus",
				"ExpiryDate",
				"FacilityRef",
				"InceptionDate",
				"IsSubscribeMaster",
				"MOA",
				"FSAClass",
				"WordingRequired",
				"AggsRequired",
				"OriginatingOfficeId",
				"PolicyType",
				"SubmissionStatus"];

			for (var slaveIter in slaveObservables)
			{
				var slaveObservable = slaveObservables[slaveIter];

				if (ko.isObservable(self[slaveObservable]))
				{
					self.Functions.SetSyncSlaveSubscription(slaveObservable);
				}
			}
		},
		SetSyncSlaveSubscription: function(observableName, isDisposing)
		{
			self[observableName].subscribe(function(value)
			{
				self.Functions.SyncSlaveObservables(observableName, value);
			});
		},
		SetDefaults: function()
		{
			var vmSubmission = parent.GetParent().GetParent();

			if (!vmSubmission.Defaults)
			{
				$.when($.ajax(
					{
						url: "/admin/getdefaultsettingsbysubmissiontypeid",
						type: "GET",
						dataType: "json",
						data: { typeId: vmSubmission.Model.submissionTypeId() },
						cache: false
					})).done(function(data)
				{
					vmSubmission.TeamId(data.TeamId);
					vmSubmission.GetQuoteTemplates(data.TeamId);

					vmSubmission.Defaults = {
						PrimaryOffice: data.DefaultPrimaryOffice,
						Office: data.DefaultOffice,
						PolicyType: data.DefaultPolicyType,
						Underwriter: data.DefaultUnderwriter,
						DefaultBroker: data.DefaultBroker,
						DefaultBrokerage: data.DefaultBrokerage,
						ExpiryDateOffset: data.ExpiryDateOffset,
						ExpandAdditionalInsureds: data.ExpandAdditionalInsureds
					};

					data.DefaultQuoteExpiry = parseInt(data.DefaultQuoteExpiry);

					if (!isNaN(data.DefaultQuoteExpiry))
					{
						var quoteExpiryDate = moment().add("d", data.DefaultQuoteExpiry);

						if (quoteExpiryDate && quoteExpiryDate.isValid())
							vmSubmission.Defaults.QuoteExpiry = quoteExpiryDate;
					}

					self.Functions.SetUserDefaults(vmSubmission);
				});
			}
			else self.Functions.SetUserDefaults(vmSubmission);
			
			self.Id(0);
			self.EntryStatus("PARTIAL");
			self.SubmissionStatus("SUBMITTED");
			self.PolicyStatus("QUOTE");
			self.CorrelationToken(token);
			self.IsSubscribeMaster(true);
			self.TechnicalPricingPremiumPctgAmt("%");
			self.WrittenOrder(100);
			self.EstimatedSignedPercentage(100);
			self.OrderAmountIndicator("true");
			self.WholeOrdIndicator("true");

			if (parent.GetParent().GetParent().QSetDefaults)
				parent.GetParent().GetParent().QSetDefaults(self);
		},
		SetUserDefaults: function(vmSubmission)
		{
			if (vmSubmission.Defaults.Office)
			{
				if (!self.QuotingOfficeId())
					self.QuotingOfficeId(vmSubmission.Defaults.PrimaryOffice);

				if (!self.OriginatingOfficeId())
					self.OriginatingOfficeId(vmSubmission.Defaults.Office);
			}

			if (vmSubmission.Defaults.ExpandAdditionalInsureds)
			{
				if (vmSubmission.Defaults.ExpandAdditionalInsureds)
				{
					self.HideAdditionalInsureds(false);
				}
			}

			if (vmSubmission.Defaults.Underwriter)
			{
				if (!self.UnderwriterCode())
					self.UnderwriterCode(vmSubmission.Defaults.Underwriter);

				if (!self.UnderwriterContactCode())
					self.UnderwriterContactCode(vmSubmission.Defaults.Underwriter);
			}

			if (vmSubmission.Defaults.PolicyType && !self.PolicyType())
				self.PolicyType(vmSubmission.Defaults.PolicyType);

			if (vmSubmission.Defaults.QuoteExpiry && !self.QuoteExpiryDate())
				self.QuoteExpiryDate(vmSubmission.Defaults.QuoteExpiry);

			if (vmSubmission.Defaults.DefaultBroker)
			{
				if (!self.BrokerSequenceId())
					self.BrokerSequenceId(vmSubmission.Defaults.DefaultBroker);
			}

			if (vmSubmission.Defaults.DefaultBrokerage)
			{
				if (!self.Brokerage())
					self.Brokerage(vmSubmission.Defaults.DefaultBrokerage);
			}

			if (vmSubmission.Defaults.ExpiryDateOffset)
				expiryOffset = vmSubmission.Model.ExpiryDateOffset = vmSubmission.Defaults.ExpiryDateOffset;

			vmSubmission.DirtyReset();
		},
		SetSubDefaults: function() {
			var subObservables = [
				"InsuredName",
				"InsuredId",
				"AdditionalInsuredList",
				"BrokerCode",
				"BrokerSequenceId",
				"BrokerPseudonym",
				"BrokerGroupCode",
				"BrokerContact",
				"NonLondonBrokerCode",
				"NonLondonBrokerName",
				"UnderwriterCode",
				"UnderwriterContactCode",
				"LeaderNo",
				"Leader",
				"Domicile",
				"GeoCode",
				"Brokerage",
				"QuotingOfficeId"
			];

			if (parent.GetParent().GetParent().QetSubDefaults)
				parent.GetParent().GetParent().QetSubDefaults(subObservables);

			for (var subIter in subObservables)
			{
				var subObservable = subObservables[subIter];

				if (ko.isObservable(self[subObservable]))
				{
					self.Functions.SetSyncSlaveSubscription(subObservable);

					if (quoteSubData)
					{
						self[subObservable](quoteSubData[subObservable]);
					}
				}
			}
		},
		SetupAnalysisCodes: function()
		{
			_.each(["INTEREST", "MULTIYEAR", "NCBR", "OCCUPIER", "RADIOLOGIC", "RSK", "SRCC", "TERRORM", "WAR"], function(type)
			{
				var codeType = "AnlyCd" + type;

				if (!self[codeType])
				{
					self[codeType] = ko.computed(
						{
							read: function()
							{
								var codes = self.AnalysisCodes(),
								    item = codes ? _.findWhere(codes, { Type: type }) || {} : {};

								return item.Code;
							},
							write: function(value)
							{
								var codes = self.AnalysisCodes(),
								    id = 0,
								    item = null,
								    index = null;

								if (!value)
								{
									if (item = codes ? _.findWhere(codes, { Type: type }) : null)
									{
										if (!item.Id)
											self.AnalysisCodes.remove(item);
										else
											item.Id = -item.Id;
									}
								}
								else
								{
									_.each(codes, function(_item, _index)
									{
										if (_item.Type === type)
										{
											id = _item.Id < 0 ? -_item.Id : 0;
											item = _item;
											index = _index;
										}

										return !item;
									});

									item = $.extend({}, item || {}, {
										Id: id,
										Type: type,
										Code: value
									});

									if (index != null && index >= 0)
									{
										//self.AnalysisCodes.valueWillMutate();

										self.AnalysisCodes()[index] = item;

										//self.AnalysisCodes.valueHasMutated();
									}
									else self.AnalysisCodes.push(item);
								}
							}
						});
				}
			});
		},
		SetSettlementDueDate: function()
		{
			var sdd = self.SettlementDueDate();

			// Use the settlement due date if it exists
			//if (!sdd)
			{
				var inception = moment(self.InceptionDate(), "DD MMM YYYY", true),
				    expiry = moment(self.QuoteExpiryDate(), "DD MMM YYYY", true);

				// If the inception date is null
				if (!inception.isValid())
				{
					// Use the quote expiry date if it exists (with the expiry date offset applied)
					if (expiry.isValid()) sdd = expiry.add("d", expiryOffset);
				}
				// Else check against the quote expiry date
				else
				{
					// If the inception date is less than the quote expiry date then use the quote expiry date
					// Else use the inception date + 1 day
					sdd = expiry.isValid() && inception.isBefore(expiry) ? expiry : inception.add("d", 1);
				}

				if (sdd) self.SettlementDueDate(sdd);
			}
		},
		ShowDeclinatureDialog: function()
		{
			var vmOption = parent.GetParent(),
			    optionDomId = domId + "-option" + vmOption.GetIndex(),
			    quoteDomId = optionDomId + " .carousel .carousel-inner div.active",
			    modalDomId = quoteDomId + " .val-declinature:first";

			$("#" + modalDomId).modal("show");
		}, // TODO: Refactor required ?
		SyncSlaveObservables: function(observableName, value)
		{
			if (self.IsSubscribeMaster())
			{
				var submission = parent.GetParent().GetParent();

				ko.utils.arrayForEach(submission.Model.ActiveOptions(), function(option)
				{
					ko.utils.arrayForEach(option.ActiveOptionVersions(), function(version)
					{
						if (!version.IsLocked() || observableName === "IsSubscribeMaster")
						{
							ko.utils.arrayForEach(version.ActiveQuotes(), function(quote)
							{
								if (quote.CorrelationToken() === self.CorrelationToken() && quote !== self)
								{
									quote[observableName](observableName !== "IsSubscribeMaster" ? value : false);
								}
							});
						}
					});
				});
			}
		}
	};

	self.Computeds = function(model)
	{
		model.AutomationId = ko.computed(
			{
				read: function () {
					return 'S:0' + '-O:' + parent.GetParent().GetParent().Model.Options.indexOf(parent.GetParent()) +
						'-V:' + (parent.GetParent().OptionVersions.peek().length- parent.GetParent().OptionVersions.indexOf(parent) - 1) +
						'-Q:' + parent.Quotes.indexOf(model);
				},
				deferEvaluation: true
			});

		model.CanDelete = ko.computed(function()
		{
			return !(model.SubscribeReference() && model.SubscribeReference().length > 0)
				&& parent.Quotes().length > 1;
		});

		model.IsDeclinature = ko.computed(function()
		{
			var isDeclinature = /^DECLINED$/i.test(model.SubmissionStatus());

			if (!isDeclinature)
			{
				model.DeclinatureReason("");
				model.DeclinatureComments("");
			}
			
			return isDeclinature;
		});

		model.IsQuoted = ko.computed(function()
		{
			return /^QUOTED$/i.test(model.SubmissionStatus());
		});

		model.IsLiveOrCancelled = ko.computed(function()
		{
			return /^LIVE|CANCELLED$/i.test(model.EntryStatus());
		});

		model.IsLocked = ko.computed(function()
		{
			return model.IsQuoted()
				|| model.IsLiveOrCancelled();
		});
	};

	self.Subscriptions = function(model)
	{
		model.IsInitialised.subscribe(function(value)
		{
			model.DirtyInitialisation();
		});

		model.BrokerGroupCode.subscribe(function(value)
		{
			amplify.publish(domId + "_val-broker-lossratio", value);
			amplify.publish(domId + "_val-broker-summary", value);
		});

		model.FacilityRef.subscribe(function(value)
		{
			if (/(^[A-Z]{2})\S*(\d{2}$)/i.test(value))
			{
				model.COBId(RegExp.$1.toUpperCase());
			}
		});

		model.InceptionDate.subscribe(function(value)
		{
			var inceptionDate = moment(value, model.InceptionDate.momentFormats, true);

			if (inceptionDate.isValid())
			{
				model.AccountYear(inceptionDate);
				model.ExpiryDate(inceptionDate.add("y", 1).subtract("d", 1));
			}

			model.Functions.SetSettlementDueDate(value);
		});

		model.QuoteExpiryDate.subscribe(model.Functions.SetSettlementDueDate);

		model.InsuredName.subscribe(function(value)
		{
			amplify.publish(domId + "_val-worldcheck-matches", value);
			amplify.publish(domId + "_val-related-loss-ratios", value);
			amplify.publish(domId + "_val-cross-selling", value);
		});

		model.AdditionalInsuredList.subscribe(function(changes)
		{
			changes.forEach(function(change)
			{
				if (change.status === 'added')
				{
					change.value.InsuredName.subscribe(function(value)
					{
						amplify.publish(domId + "_val-worldcheck-matches", value);
					});
				}
				//else if (change.status === 'deleted')
				//{

				//}
			});

		}, null, "arrayChange");

		model.LimitCCY.subscribe(function (value) {
			// limitsAndBreachesCheck();
			if (!self.IsSyncJson() && value && value !== -1)
			{
				if (!model.ExcessCCY())
					model.ExcessCCY(value);

				if (!model.PremiumCurrency())
					model.PremiumCurrency(value);

				if (model.VesselTopLimitCurrency && !model.VesselTopLimitCurrency())
					model.VesselTopLimitCurrency(value);
			}
		});

		model.LimitAmount.subscribe(function (value) {
			// limitsAndBreachesCheck();
		});

		/*
		 if the Limit CCY or Limit Amount changes
		 check the limits AND breaches api
		 API Docs at: http://localhost:55516/
		 Task # 4023
		 */
		/*
		 DS - Jan 05 2015
		 Commented out as Limits AND breaches are changing.
		 */
		/*
		 function limitsAndBreachesCheck() {
		 // if we aren't AH - we shouldn't demo this!
		 if (self.COBId() != 'AH')
		 return;

		 // make sure we have what is needed to satisfy the api
		 if (!model.LimitAmount()
		 || !model.LimitCCY()
		 || !model.AccountYear() > 2013)
		 return;

		 if (!model.AccountYear()) {
		 var d = new Date();
		 var n = d.getFullYear();
		 model.AccountYear(n);
		 }

		 // var debugUrl = 'http://localhost:55516/limit-check/v1/';
		 var debugUrl = 'http://10.31.20.60:8011/limit-check/v1/';

		 var url = debugUrl + model.AccountYear() + '/AH/AH/KX/' + model.LimitAmount() + '/' + model.LimitCCY();

		 console.log(url);

		 model.limitsBreach("");

		 $.ajax({
		 url: url,
		 type: "GET",
		 dataType: "json",
		 cache: false,
		 contentType: "application/json",
		 success: function (data) {
		 if (data.Exceeded) {
		 //toastr.warning("Limits Exceeded");
		 model.limitsBreach("Warning: The limit entered breaches Authority Limits for this category of business");
		 } else {
		 //toastr.success("Limits OK");

		 }
		 },
		 error: function(error) {
		 console.log('ajax error');
		 console.log(error);
		 model.limitsBreach("Warning: We are only currently able to check limits in the four settlement currencies");
		 }
		 });
		 };
		 */

		model.QuotingOfficeId.subscribe(function(value)
		{
			amplify.publish(domId + "_val-related-wordings", value);
			//bug: 2903 Release 6 - Submission (ALL) - Non-London broker removed on copied option
			//	model.NonLondonBrokerCode("");
		});

		model.OrderAmountIndicator.subscribe(function (value) {
			if (!self.IsSyncJson() && value) {
				if (value == "true") model.WrittenAmount("");
				if (value == "false") model.WrittenLine("");
			}
		});

		if (parent.GetParent().GetParent().QSubscriptions)
			parent.GetParent().GetParent().QSubscriptions(model); // TODO: Remove
	};

	self.Initialise = function()
	{
		self.IsInitialised(false);

		self.Functions.SetDefaults();
		self.Functions.SetSubDefaults();
		self.Computeds(self);
		self.Subscriptions(self);
		self.Functions.SetupAnalysisCodes();
		self.Functions.SetSyncSlaveSubscriptions();

		self.IsInitialised(true);
	};
	
	self.Initialise();
}

/*
 Submission / Option / Option Version / Quote Sync-JSON Extensions

 Description;
 These are functions that map JSON data to theSubmission / Option / Option Version / Quote
 view models.

 Usage;
 thisSubmission.syncJSON(jsonData);
 */
vmSubmission.prototype.syncJSON = function(submissionData)
{
	var self = this,
	    vmSubmission = this.Model;

	self.Id = submissionData.Id;
	vmSubmission.AuditTrails.length = 0;
	vmSubmission.Id(submissionData.Id);
	vmSubmission.Timestamp(submissionData.Timestamp);
	vmSubmission.Title(submissionData.Title);

	//  Call the additional sync tasks defined in inherited.
	if (self.SSyncJSONAdditional)
		self.SSyncJSONAdditional(vmSubmission, submissionData);

	vmSubmission.UnderwriterNotes(submissionData.UnderwriterNotes);
	vmSubmission.QuoteSheetNotes(submissionData.QuoteSheetNotes);

	if (vmSubmission.Options().length !== submissionData.Options.length)
	{
		while (vmSubmission.Options().length !== 0)
		{// TODO: Don't use while loops
			vmSubmission.Options.pop();
		}
	}

	$.each(submissionData.Options, function(optionIndex, optionData)
	{
		var vmOption = vmSubmission.Options()[optionIndex];

		if (!vmOption)
		{
			var optionsLength = self.AddOption();

			vmOption = vmSubmission.Options()[optionsLength - 1];
		}

		vmSubmission.Options()[optionIndex] = vmOption.syncJSON(optionData);
	});

	_.each([
		{ Name: "MarketWordingSettings", List: "SubmissionMarketWordingsList", Data: "MarketWording" },
		{ Name: "CustomMarketWordingSettings", List: "CustomSubmissionMarketWordingsList", Data: "MarketWording" },
		{ Name: "TermsNConditionWordingSettings", List: "SubmissionTermsNConditionWordingsList", Data: "TermsNConditionWording" },
		{ Name: "CustomTermsNConditionWordingSettings", List: "CustomSubmissionTermsNConditionWordingsList", Data: "TermsNConditionWording" },
		{ Name: "CustomSubjectToClauseWordingSettings", List: "CustomSubmissionSubjectToClauseWordingsList", Data: "SubjectToClauseWording" },
		{ Name: "CustomWarrantyWordingSettings", List: "CustomSubmissionWarrantyWordingsList", Data: "WarrantyWording" }
	], function(wording)
	{
		var vm = vmSubmission[wording.List],
		    data = submissionData[wording.Name],
		    add = _.filter(data, function(itemA)
		    {
			    return !_.find(vm(), function(itemB)
			    {
				    return itemA[wording.Data].Id == ko.utils.unwrapObservable(itemB.Id);
			    });
		    }),
		    remove = _.filter(vm(), function(itemA)
		    {
			    return !_.find(data, function(itemB)
			    {
				    return itemB[wording.Data].Id == ko.utils.unwrapObservable(itemA.Id);
			    });
		    });

		_.each(add, function(item)
		{
			item[wording.Data].DisplayOrder = item.DisplayOrder || 0;
			item[wording.Data].IsStrikeThrough = item.IsStrikeThrough || false;
			item[wording.Data].IsSelected = false;

			vm.push(ko.mapping.fromJS(item[wording.Data]));
		});

		_.each(remove, function(item)
		{
			vm.remove(item);
		});
	});

	return vmSubmission;
};

Option.prototype.syncJSON = function(optionData)
{
	var vmOption = this;

	vmOption.Id(optionData.Id);
	vmOption.SubmissionId(optionData.SubmissionId);
	vmOption.Timestamp(optionData.Timestamp);

	vmOption.Title(optionData.Title);
	vmOption.Comments(optionData.Comments);
	// TODO: vmOption.VersionIndex(???);

	//  Call the additional sync tasks defined in inherited.
	if (vmOption.GetParent().OSyncJSONAdditional)
		vmOption.GetParent().OSyncJSONAdditional(vmOption, optionData);

	while (vmOption.OptionVersions().length > optionData.OptionVersions.length)
	{// TODO: Don't use while loops
		vmOption.OptionVersions().pop();
	}

	while (vmOption.OptionVersions().length < optionData.OptionVersions.length)
	{// TODO: Don't use while loops
		vmOption.AddOptionVersion();
	}

	optionData.OptionVersions.sort(function(versionA, versionB)
	{
		return (versionA.VersionNumber < versionB.VersionNumber)
			? 1 : (versionA.VersionNumber > versionB.VersionNumber)
			       ? -1 : 0;
	});

	$.each(optionData.OptionVersions, function(versionIndex, versionData)
	{
		var vmVersion = vmOption.OptionVersions()[versionIndex];

		if (!vmVersion)
			vmOption.CopyOptionVersion(versionData);
		else
			vmOption.OptionVersions()[versionIndex] = vmVersion.syncJSON(versionData);
	});

	return vmOption;
};

OptionVersion.prototype.syncJSON = function(versionData)
{
	var vmVersion = this;

	vmVersion.OptionId(versionData.OptionId);
	vmVersion.VersionNumber(versionData.VersionNumber);
	vmVersion.Timestamp(versionData.Timestamp);

	vmVersion.Title(versionData.Title);
	vmVersion.Comments(versionData.Comments);
	vmVersion.IsExperiment(versionData.IsExperiment);
	vmVersion.IsLocked(versionData.IsLocked);

	if (vmVersion.GetParent().GetParent().OVSyncJSONAdditional)
		vmVersion.GetParent().GetParent().OVSyncJSONAdditional(vmVersion, versionData);

	while (vmVersion.Quotes().length > versionData.Quotes.length)
	{ // TODO: Don't use while loops
		vmVersion.Quotes.pop();
	}

	$.each(versionData.Quotes, function(quoteIndex, quoteData)
	{
		var vmQuote = vmVersion.Quotes()[quoteIndex];

		if (!vmQuote)
		{
			var quotesLength = vmVersion.Functions.AddQuote();

			vmQuote = vmVersion.Quotes()[quotesLength - 1];
		}

		vmVersion.Quotes()[quoteIndex] = vmQuote.syncJSON(quoteData);
	});

	return vmVersion;
};

Quote.prototype.syncJSON = function(quoteData)
{
	var vmQuote = this;

	// IsSyncJson - Is SET back to false at end of function...
	// Used to stop model.LimitCCY.subscribe AND model.PremiumCurrency.subscribe from firing when not required
	vmQuote.IsSyncJson(true);

	vmQuote.InceptionDate(quoteData.InceptionDate);
	vmQuote.ExpiryDate(quoteData.ExpiryDate);
	vmQuote.QuoteExpiryDate(quoteData.QuoteExpiryDate);

	vmQuote.Id(quoteData.Id);
	// TODO: Verify use of parent observable vmQuote.OptionId(quoteData.OptionId);
	// TODO: Verify use of parent observable vmQuote.VersionNumber(quoteData.VersionNumber);

	/*
	 Declinature reason must be synchronised first due to a subscription
	 in the Quote view model that overwrites the Submission Status
	 */
	vmQuote.DeclinatureReason(quoteData.DeclinatureReason);
	vmQuote.DeclinatureComments(quoteData.DeclinatureComments);

	vmQuote.SubmissionStatus(quoteData.SubmissionStatus);

	vmQuote.SubscribeTimestamp(quoteData.SubscribeTimestamp);
	vmQuote.Timestamp(quoteData.Timestamp);

	vmQuote.InsuredName(quoteData.InsuredName);
	vmQuote.InsuredId(quoteData.InsuredId);
	vmQuote.PolicyStatus(quoteData.PolicyStatus);

	vmQuote.AnalysisCodes.removeAll();
	
	if (quoteData.AnalysisCodes)
		vmQuote.AnalysisCodes(_.map(quoteData.AnalysisCodes, function(item)
		{
			return {
				Id: item.Id,
				Code: item.Code,
				Type: item.Type
			};
		}));

	if (quoteData.AdditionalInsuredList)
	{
		vmQuote.AdditionalInsuredList.removeAll();

		$.each(quoteData.AdditionalInsuredList, function(index, item)
		{
			vmQuote.AdditionalInsuredList.push(
				{
					Id: ko.observable(item.Id),
					InsuredName: ko.observable(item.InsuredName),
					InsuredId: ko.observable(item.InsuredId),
					InsuredType: ko.observable(item.InsuredType),
					InsuredTypes: ["Additional", "Cedent", "Interested Party", "Reinsured", "Obligor", "Parent", "Loss Payee"],
					AutomationId: ko.computed({
						read: function()
						{
							return self.SelectedQuote ? self.SelectedQuote().AutomationId() + "_" + "AI" : "AI";
						},
						deferEvaluation: true
					})
				});
		});
	}

	vmQuote.BrokerCode(quoteData.BrokerCode);
	vmQuote.BrokerSequenceId(quoteData.BrokerSequenceId);
	vmQuote.BrokerPseudonym(quoteData.BrokerPseudonym);
	vmQuote.BrokerGroupCode(quoteData.BrokerGroupCode);
	vmQuote.BrokerContact(quoteData.BrokerContact);
	vmQuote.NonLondonBrokerCode(quoteData.NonLondonBrokerCode);
	vmQuote.NonLondonBrokerName(quoteData.NonLondonBrokerName);

	vmQuote.UnderwriterCode(quoteData.UnderwriterCode);
	vmQuote.UnderwriterContactCode(quoteData.UnderwriterContactCode);
	vmQuote.LeaderNo(quoteData.LeaderNo);
	vmQuote.Leader(quoteData.Leader);
	vmQuote.Domicile(quoteData.Domicile);
	vmQuote.Brokerage(quoteData.Brokerage);
	vmQuote.QuotingOfficeId(quoteData.QuotingOfficeId);

	vmQuote.GeoCode(quoteData.GeoCode);

	vmQuote.SubscribeReference(quoteData.SubscribeReference);
	vmQuote.OrgSubscribeReference(quoteData.OrgSubscribeReference);
	vmQuote.FacilityRef(quoteData.FacilityRef);
	vmQuote.RenPolId(quoteData.RenPolId);

	vmQuote.AccountYear(quoteData.AccountYear);
	
	vmQuote.COBId(quoteData.COBId);
	vmQuote.MOA(quoteData.MOA);
	vmQuote.FSAClass(quoteData.FSAClass);
	vmQuote.WordingRequired(quoteData.WordingRequired);
	vmQuote.AggsRequired(quoteData.AggsRequired);
	vmQuote.OriginatingOfficeId(quoteData.OriginatingOfficeId);
	vmQuote.EntryStatus(quoteData.EntryStatus);
	vmQuote.PolicyType(quoteData.PolicyType);

	vmQuote.LimitCCY(quoteData.LimitCCY);
	vmQuote.LimitAmount(quoteData.LimitAmount);

	vmQuote.ExcessCCY(quoteData.ExcessCCY);
	vmQuote.ExcessAmount(quoteData.ExcessAmount);

	if (vmQuote.PremiumCurrency && quoteData.PremiumCurrency)
		vmQuote.PremiumCurrency(quoteData.PremiumCurrency);
	vmQuote.IsEPIlocked(quoteData.IsEPIlocked);
	vmQuote.WrittenOrder(quoteData.WrittenOrder);
	vmQuote.WrittenLine(quoteData.WrittenLine);
	vmQuote.WrittenAmount(quoteData.WrittenAmount);
	vmQuote.WholeOrdIndicator(quoteData.WholeOrdIndicator);
	vmQuote.OrderAmountIndicator(quoteData.OrderAmountIndicator);
	vmQuote.PremiumSettlementCurrency(quoteData.PremiumSettlementCurrency);
	vmQuote.EstimatedSignedPercentage(quoteData.EstimatedSignedPercentage);
	vmQuote.SettlementDueDate(quoteData.SettlementDueDate);
	
	vmQuote.WrittenDate(quoteData.WrittenDate);

	if (quoteData.Coverholders)
	{
		// TODO: ??? vmQuote.Coverholders = quoteData.Coverholders;

		vmQuote._Coverholders(_.map(quoteData.Coverholders, function(item)
		{
			return item.CoverholderCode;
		}).join(','));

		//$.each(quoteData.Coverholders, function(index, item)
		//{
		//	vmQuote._Coverholders.push(item.CoverholderCode);
		//     //{
		//     //	Id: item.Id,
		//     //	CoverholderSequenceNumber: item.CoverholderSequenceNumber,
		//     //	CoverholderCode: item.CoverholderCode,
		//     //	CoverholderStatus: item.CoverholderStatus,
		//     //	CoverholderName: item.CoverholderName
		//     //});
		//});
	}

	vmQuote.Currency(quoteData.Currency);
	vmQuote.TechnicalPricingBindStatus(quoteData.TechnicalPricingBindStatus);
	vmQuote.TechnicalPricingPremiumPctgAmt(quoteData.TechnicalPricingPremiumPctgAmt);
	vmQuote.TechnicalPricingMethod(quoteData.TechnicalPricingMethod);

	vmQuote.TechnicalPremium(quoteData.TechnicalPremium);
	vmQuote.BenchmarkPremium(quoteData.BenchmarkPremium);
	vmQuote.QuotedPremium(quoteData.QuotedPremium);

	vmQuote.Comment(quoteData.Comment);
	vmQuote.Description(quoteData.Description);

	vmQuote.IsSubscribeMaster(quoteData.IsSubscribeMaster);
	vmQuote.CorrelationToken(quoteData.CorrelationToken);

	vmQuote.BusinessPlanDetailId(quoteData.BusinessPlanDetailId);

	if (vmQuote.GetParent().GetParent().GetParent().QSyncJSONAdditional)
		vmQuote.GetParent().GetParent().GetParent().QSyncJSONAdditional(vmQuote, quoteData);
	
	vmQuote.IsSyncJson(false);

	return vmQuote;
};

/*
 Submission / Option / Option Version / Quote To-JSON & KO-Trim Extensions

 Description;
 These are functions that clean up the Submission / Option / Option Version / Quote
 view models in preparation to be sent to the server or copied over to another instance.

 Descriptions;
 Front-End;
 Display user-friendly information AND populate back-end observables with the
 actual data required by the server.

 Entity Framework;
 Must not send back to server due to a problem with the entity framework
 handling objects, so use their equivalent Id observables instead.

 Garbage;
 Computed functions AND other objects that are garbage to the Submission model

 Usage;
 var jsonData = thisSubmission.toJSON();
 var koData = thisSubmission.koTrim();

 Refactor Possibilities;
 A generic method of synchronising any Knockout view model with JSON.

 ko.syncJSON = function(source, target)
 {
 target = target || this;

 for (var property in source)
 {
 if (!target[property]) continue;

 if (ko.isObservableArray(target[property]))
 {
 for (var sourceIndex in source[property])
 {
 self.syncJSON(source[property][sourceIndex], target[property]);
 }
 }
 else if (ko.isObservable(target[property]))
 {
 target[property](source[property]);
 }
 else target[property] = source[property];
 }
 };
 */
vmSubmission.prototype.toJSON = function()
{
	var vmSubmission = this.koTrim();

	return ko.toJSON(vmSubmission);
};

vmSubmission.prototype.koTrim = function()
{
	var vmSubmission = ko.toJS(this.Model);

	delete vmSubmission.ActiveOptions;
	
	delete vmSubmission.Functions;
	delete vmSubmission.Subscriptions;

	delete vmSubmission.CanSave;
	delete vmSubmission.CanCreateQuoteSheet;
	
	delete vmSubmission.koTrim;
	delete vmSubmission.syncJSON;
	delete vmSubmission.toJSON;

	$.each(vmSubmission.Options, function(optionIndex, optionItem)
	{
		vmSubmission.Options[optionIndex] = optionItem.koTrim(optionItem);
	});

	return vmSubmission;
};

Option.prototype.toJSON = function()
{
	var vmOption = this.koTrim();

	return ko.toJSON(vmOption);
};

Option.prototype.koTrim = function(thisOption)
{
	var vmOption = (!thisOption) ? ko.toJS(this) : thisOption;

	delete vmOption.Functions;
	delete vmOption.Subscriptions;

	delete vmOption.TitleoptionNumber;
	delete vmOption.TitleoptionNumber;

	delete vmOption.optionNumber;
	delete vmOption.GetParent;
	delete vmOption.GetIndex;

	delete vmOption.VersionIndex; // TODO: Should we keep this ?

	delete vmOption.AddToQuoteSheet;
	delete vmOption.EnableAddToQuoteSheet;

	delete vmOption.VersionTitle;
	delete vmOption.VersionCount;

	delete vmOption.CurrentVersion;
	delete vmOption.CurrentQuote;

	delete vmOption.SetVersionIndex;

	delete vmOption.AddOptionVersion;
	delete vmOption.CopyOptionVersion;
	delete vmOption.CanCopyOption;
	delete vmOption.RequiredFieldsCheck;

	delete vmOption.CanDelete;
	delete vmOption.DeleteOption;
	delete vmOption.ActiveOptionVersions;
	delete vmOption.CopyOption;

	delete vmOption.NavigateToOption;
	delete vmOption.NavigateToQuote;

	delete vmOption.SetMaster;

	delete vmOption.koTrim;
	delete vmOption.syncJSON;
	delete vmOption.toJSON;

	$.each(vmOption.OptionVersions, function(versionIndex, versionItem)
	{
		vmOption.OptionVersions[versionIndex] = versionItem.koTrim(versionItem);
	});

	return vmOption;
};

OptionVersion.prototype.toJSON = function()
{
	var vmVersion = this.koTrim();

	return ko.toJSON(vmVersion);
};

OptionVersion.prototype.koTrim = function(thisVersion)
{
	var vmVersion = (!thisVersion) ? ko.toJS(this) : thisVersion;

	delete vmVersion.Functions;
	delete vmVersion.Subscriptions;

	delete vmVersion.TitleVersionNumber;
	
	delete vmVersion.GetParent;

	delete vmVersion.AddQuote;
	delete vmVersion.CanAddQuotes;
	delete vmVersion.CanCopy;
	delete vmVersion.Initialise;

	delete vmVersion.koTrim;
	delete vmVersion.syncJSON;
	delete vmVersion.toJSON;

	delete vmVersion.CanDeleteCheck;
	delete vmVersion.CanDelete;
	delete vmVersion.DeleteOptionVersion;
	delete vmVersion.ActiveQuotes;

	$.each(vmVersion.Quotes, function(quoteIndex, quoteItem)
	{
		vmVersion.Quotes[quoteIndex] = quoteItem.koTrim(quoteItem);
	});

	return vmVersion;
};

Quote.prototype.toJSON = function(dirty)
{
	var vmQuote = this.koTrim(null, dirty);

	return ko.toJSON(vmQuote);
};

Quote.prototype.koTrim = function(thisQuote, dirty)
{
	var vmQuote = thisQuote || ko.toJS(this);

	if (dirty)
	{
		delete vmQuote.AnlyCdINTEREST;
		delete vmQuote.AnlyCdMULTIYEAR;
		delete vmQuote.AnlyCdNCBR;
		delete vmQuote.AnlyCdOCCUPIER;
		delete vmQuote.AnlyCdRADIOLOGIC;
		delete vmQuote.AnlyCdRSK;
		delete vmQuote.AnlyCdSRCC;
		delete vmQuote.AnlyCdTERRORM;
		delete vmQuote.AnlyCdWAR;
		delete vmQuote.AutomationId;
		delete vmQuote.BrokerCode;
		delete vmQuote.BrokerGroupCode;
		delete vmQuote.BrokerPseudonym;
		delete vmQuote.BusinessPlanDetailId;
		delete vmQuote.COB;
		delete vmQuote.CorrelationToken;
		delete vmQuote.errors;
		delete vmQuote.HideAdditionalInsureds;
		delete vmQuote.Id;
		delete vmQuote.IsEPIlocked;
		delete vmQuote.IsLocked;
		delete vmQuote.IsSyncJson;
		delete vmQuote.Leader;
		delete vmQuote.limitsBreach;
		delete vmQuote.NonLondonBrokerName;
		delete vmQuote.OptionId;
		delete vmQuote.OrderAmountIndicator;
		delete vmQuote.OrgSubscribeReference;
		delete vmQuote.SubscribeReference;
		delete vmQuote.SubscribeTimestamp;
		delete vmQuote.Timestamp;
		delete vmQuote.VersionNumber;
		delete vmQuote.WholeOrdIndicator;
	}

	delete vmQuote.IsInitialised;
	delete vmQuote.CanDelete;
	delete vmQuote.IsDeclinature;
	delete vmQuote.IsQuoted;
	delete vmQuote.IsLiveOrCancelled;
	
	delete vmQuote.Functions;
	delete vmQuote.GetParent;
	delete vmQuote.Initialise;
	delete vmQuote.Subscriptions;
	delete vmQuote.ValidationErrors;

	delete vmQuote.koTrim;
	delete vmQuote.syncJSON;
	delete vmQuote.toJSON;

	return vmQuote;
};

vmSubmission.prototype.DirtyCheck = function()
{
	var self = this,
	    isDirty = false;

	_.each(self.Model.Options(), function(option)
	{
		return _.each(option.OptionVersions(), function(version)
		{
			return _.each(version.Quotes(), function(quote)
			{
				return isDirty = quote.Functions.DirtyCheck();
			});
		});
	});

	return isDirty;
};

vmSubmission.prototype.DirtyReset = function()
{
	var self = this,
	    isDirty = false;

	_.each(self.Model.Options(), function(option)
	{
		return _.each(option.OptionVersions(), function(version)
		{
			return _.each(version.Quotes(), function(quote)
			{
				return isDirty = quote.Functions.DirtyReset();
			});
		});
	});

	return isDirty;
};

Quote.prototype.DirtyInitialisation = function()
{
	var self = this,
	    original = null,
	    stringify = function(object)
	    {
		    return ko.toJSON(object.koTrim(null, true), function(key, value)
		    {
			    return value ? value : undefined;
		    });
	    };

	if (self.Functions)
	{
		self.Functions.DirtyCheck = function()
		{
			console.log("Dirty Check");

			return original !== stringify(self);
		};

		self.Functions.DirtyReset = function()
		{
			console.log("Dirty Reset");

			original = stringify(self);
		};

		self.Functions.DirtyReset();
	}
};
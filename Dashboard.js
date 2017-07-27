'use strict';

angular.module('TechHealApp').controller('Dashboard', function ($scope, $rootScope, Activities, DashboardService, TicketsService, UserService, AppMessages, GeneralService, Session, CommonConstants, CustomersService, $filter, OrdersService, ReportService, URLS,DataSharingService) {
    var currentDate = new Date(), activityPageNo = 0;
    $scope.TicketsCountByStatus = "";
    $scope.selectedTicketStatus = "Pending";
    $scope.selectedTicketStatusId = "1";
    $scope.activities = [];
    $scope.user = {};
    $scope.firstOwner = {};
    $scope.caseDateRange = {
        startDate: '',
        endDate: ''
    };
    $scope.pageNumber = 1;
    
    $scope.objReport = new RevenueOutflowReportPivot();
    $scope.TicketInput = new Ticket();
    
    
    var objReminder = new Reminder();
    objReminder.reminderTo = Session.activeUserId;
    objReminder.count = 30;
    objReminder.pageNo = 1;
    objReminder.forSupports = 0;
    objReminder.reportId = 0;

    $scope.RemiderFor = 'today';
    $scope.Ticket = new Ticket();

    $scope.oneAtATime = true;
    $scope.oneTabAtATime = true;
    $scope.isopen = 0;

    $scope.ShowCases = HasAccess(Activities.ViewTickets);

    // Get count for all moudules like leads,cases,customers,orders,reminders
    GetAllModuleCounts();
    
    
    
    $scope.pushActivity = function (data){
        data.imageId = data.imageId === "" ? "img/21.jpg" : URLS.AppUrl + '/getimage?imageName=' + encodeURIComponent(data.imageId);
        $scope.$apply(function () {
            $scope.activities.unshift({createdByName: data.userName, imageId: data.imageId, createdOn: "few seconds ago", activityName: data.activity});
        });
        var moduleName = data.module.toLowerCase();
        
        if(moduleName == 'case' && (data.entityId == 0)){
           $scope.$apply(function () {
                $scope.todayCaseCount = parseInt($scope.todayCaseCount) + 1;
            });
        }
        else if(moduleName == 'order' && (data.entityId == 0)){
            $scope.$apply(function () {
                $scope.todayOrderCount = parseInt($scope.todayOrderCount) + 1;
            })
        }
        else if(moduleName == 'lead' && (data.entityId == 0)){
            $scope.$apply(function () {
                $scope.todayLeadCount = parseInt($scope.todayLeadCount) + 1;
            })
        }
        else if(moduleName == 'customer' && (data.entityId == 0)){
            $scope.$apply(function () {
                $scope.todayCustomerCount = parseInt($scope.todayCustomerCount) + 1;
            })
        }
    };
    Session.linkDashboardMethod($scope.pushActivity);

    $scope.getRecentActivities = function () {
        activityPageNo = activityPageNo + 1;
        DashboardService.getActivityLogStream(activityPageNo, 10).then(function (result) {
            angular.forEach(result.data.logActivities, function (value, key) {
                value.imageId = value.imageId === "" ? "img/21.jpg" : URLS.AppUrl + '/getimage?imageName=' + encodeURIComponent(value.imageId);
                $scope.activities.push({createdByName: value.createdByName, imageId: value.imageId, createdOn: $scope.DifferenceBetweenCurrentDateAndGivenDate($scope.ConvertESTServerDateToLocal(value.createdOn)), activityName: value.activityName});
            });
        });
    };
    $scope.getRecentActivities();
    $scope.GetReminders = function () {
        $scope.ShowMyRemindersDiv = false;
        $scope.ShowImage = true;
        $scope.ReminderShowEmptyDataDiv = false;

        var param = $scope.RemiderFor;
        var today = moment();
        if (param == 'today')
        {
            objReminder.fromDateTime = today.format("YYYY-MM-DD hh:mm:ss");
            objReminder.toDateTime = today.add('days', 1).format("YYYY-MM-DD 00:00:00");
        } else if (param.toLowerCase() == 'tomorrow')
        {
            var tomorrow = today.add('days', 1);
            objReminder.fromDateTime = tomorrow.format("YYYY-MM-DD 00:00:00");
            objReminder.toDateTime = tomorrow.add('days', 1).format("YYYY-MM-DD 00:00:00");
        } else if (param.toLowerCase() == 'week')
        {
            objReminder.fromDateTime = today.format("YYYY-MM-DD hh:mm:ss");
            objReminder.toDateTime = today.add('days', 8).format("YYYY-MM-DD 00:00:00");
        } else if (param.toLowerCase() == 'month')
        {
            objReminder.fromDateTime = today.format("YYYY-MM-DD hh:mm:ss");
            objReminder.toDateTime = today.endOf('month').add('days', 1).format("YYYY-MM-DD 00:00:00");
        }
        objReminder.forSupports = 0;
        objReminder.reminderTo = Session.activeUserId;


        GeneralService.GetReminders(objReminder).then(function (result) {

            if (result.data.reminders && result.data.reminders.length > 0)
            {
                $scope.ReminderShowEmptyDataDiv = false;
                $scope.ShowMyRemindersDiv = true;
                $scope.reminders = result.data.reminders;

                if ($scope.RemiderFor.toLowerCase() == 'week')
                {
                    $scope.listofDatesInWeek = _.uniq(_.pluck($scope.reminders, 'remindOnDate'));
                }
            } else
            {
                $scope.ReminderShowEmptyDataDiv = true;
            }
            $scope.ShowImage = false;
        });
    };
    $scope.GetRemindersForSuports = function () {
        $scope.ShowReportRemindersDiv = false;
        $scope.ShowReportDataLoading = true;
        $scope.ReportReminderShowEmptyDataDiv = false;
        objReminder.forSupports = 1;
        objReminder.reminderTo = 0;

        var param = $scope.RemiderFor;
        var today = moment();
        if (param == 'today')
        {
            objReminder.fromDateTime = today.format("YYYY-MM-DD hh:mm:ss");
            objReminder.toDateTime = today.add('days', 1).format("YYYY-MM-DD 00:00:00");
        } else if (param.toLowerCase() == 'tomorrow')
        {
            var tomorrow = today.add('days', 1);
            objReminder.fromDateTime = tomorrow.format("YYYY-MM-DD 00:00:00");
            objReminder.toDateTime = tomorrow.add('days', 1).format("YYYY-MM-DD 00:00:00");
        } else if (param.toLowerCase() == 'week')
        {
            objReminder.fromDateTime = today.format("YYYY-MM-DD hh:mm:ss");
            objReminder.toDateTime = today.add('days', 8).format("YYYY-MM-DD 00:00:00");
        } else if (param.toLowerCase() == 'month')
        {
            objReminder.fromDateTime = today.format("YYYY-MM-DD hh:mm:ss");
            objReminder.toDateTime = today.endOf('month').add('days', 1).format("YYYY-MM-DD 00:00:00");
        }

        GeneralService.GetReminders(objReminder).then(function (result) {
            if (result.data.reminders && result.data.reminders.length > 0)
            {
                $scope.ShowReportRemindersDiv = true;
                $scope.ReportReminderShowEmptyDataDiv = false;
                $scope.lstSupportReminders = result.data.reminders;
                if ($scope.RemiderFor.toLowerCase() == 'week')
                {
                    $scope.listofDatesInWeekForSupports = _.uniq(_.pluck($scope.lstSupportReminders, 'remindOnDate'));
                }
            } else
            {
                $scope.ReportReminderShowEmptyDataDiv = true;
            }
            $scope.ShowReportDataLoading = false;
        });
        objReminder.forSupports = 0;
        objReminder.reminderTo = Session.activeUserId;
    }

//    UserService.GetUsersListForDropDown("").then(function (result) {
//        $scope.Users = result.data.userList;
//        $scope.FirstOwners = result.data.userList;
//    });
//
//    $scope.getTicketsByStatus = function (status) {
//        TicketsService.GetTicketsByStatus(status).then(function (result) {
//            $scope.ticketsList = result.data.ticketsList;
//
//        });
//    };
//
//    searchTickets();
//
//    DashboardService.GetTicketsCountByStatus("", "", "", "", "", "").then(function (result) {
//
//        $scope.TicketsCountByStatus = [];
//        angular.forEach(result.data.ticketsCount, function (value, key) {
//            var obj = new Object();
//
//            obj.ticketStatus = value.ticketStatus;
//            obj.count = value.count;
//
//            if (key == 0)
//                obj.StatusCountColour = "tabStyle2";
//            if (key == 1)
//                obj.StatusCountColour = "tabStyle3";
//            if (key == 2)
//                obj.StatusCountColour = "tabStyle4";
//            if (key == 3)
//                obj.StatusCountColour = "tabStyle5";
//            if (key == 4)
//                obj.StatusCountColour = "tabStyle6";
//            if (key == 5)
//                obj.StatusCountColour = "tabStyle7";
//
//            obj.ticketStatusId = value.ticketStatusId;
//
//            $scope.TicketsCountByStatus.push(obj);
//        });
//    });
//
//    function getSearchParametersObj() {
//
//            $scope.Ticket.StartDateTime = $scope.caseDateRange.startDate;
//            $scope.Ticket.EndDateTime = $scope.caseDateRange.endDate;
//            $scope.Ticket.TicketStatusId = $scope.selectedTicketStatusId;
//            
//            if ($scope.user.selected) 
//                $scope.Ticket.RaisedBy = $scope.user.selected.userId;
//            
//            if ($scope.firstOwner.selected) 
//                $scope.Ticket.firstOwner = $scope.firstOwner.selected.userId;
//            
//            //clears request data timeout when new data is searched
//            clearTimeout(mobileDataTimeOutVar);
//            clearTimeout(emailDataTimeOutVar);
//    }
//
//    function searchTickets() {
//        
//        getSearchParametersObj();
//        $scope.showLoader = true;
//        $scope.ticketsList = [];
//        TicketsService.SearchTickets($scope.Ticket).then(function (result) {
//            $scope.showLoader = false;
//            $scope.total = result.data.totalRecords;
//
//            if ($scope.total && $scope.total > 0) {
//                var lstObj = [];
//
//                $scope.mobilePhonePermitted = true;
//                $scope.emailPermitted = true;
//                if (!("phoneMobile" in result.data.tickets[0]))
//                    $scope.mobilePhonePermitted = false;
//
//                if (!("email" in result.data.tickets[0]))
//                    $scope.emailPermitted = false;
//
//                angular.forEach(result.data.tickets, function (value, key) {
//                    var obj = new Object();
//                    obj.supportTicketId = value.supportTicketId;
//                    obj.customerName = value.customerName;
//                    obj.currentOwner = value.currentOwner;
//
//                    if (!value.phoneMobile)
//                        obj.phoneMobile = 'notpresent';
//                    else
//                        obj.phoneMobile = value.phoneMobile;
//
//                    if (!value.email)
//                        obj.email = 'notpresent';
//                    else
//                        obj.email = value.email;
//
//                    obj.raisedByName = value.raisedByName;
//                    obj.raisedOn = value.raisedOn;
//                    obj.customerId = value.customerId;
//                    obj.agentEmail = value.agentEmail;
//
//                    lstObj.push(obj);
//                })
//                $scope.ticketsList = lstObj;
//            }
//            else {
//                $scope.ticketsList = [];
//                $scope.total = 0;
//            }
//        });
//
//    }
//    
//    $scope.GetTickets = function(pageNumber,pageSize){
//        if($scope.isSearchButtonClicked){
//            $scope.Ticket.PageNumber = 1;
//            searchTickets();
//        }
//        else
//        {
//            $scope.Ticket.PageNumber = pageNumber;
//            $scope.Ticket.PageSize = pageSize;
//            searchTickets();
//        }
//    }
//
//    $scope.updateTicketsList = function (ticket) {
//        $scope.selectedTicketStatus = ticket.ticketStatus;
//        $scope.selectedTicketStatusId = ticket.ticketStatusId;
//        
//        searchTickets();
//    };
//
//    $scope.refreshFilter = function () {
//        $scope.caseDateRange ={startDate: '', endDate: ''};
//        $scope.user.selected = undefined;
//        $scope.firstOwner.selected = undefined;
//        $scope.Ticket.RaisedBy = '';
//        $scope.Ticket.firstOwner = '';
//        searchTickets();
//    };
    $scope.loadMoreReminders = function () {
        objReminder.count = objReminder.count + 5;
        $scope.GetReminders();
    };
    $scope.GetSubstringOfDelimitedString = function (index, delimiter, string) {
        var arrString = string.split(delimiter);
        return arrString[index];
    }
    $scope.ViewUserDetail = function (createdById) {
        location.href = "#/AddEditUser/" + createdById;
    }
    $scope.getTimeLeft = function (remindOnDate, remindOnTime) {
        var remindOn = remindOnDate + ' ' + remindOnTime;
        //debugger;

        var message = '';

        var remindOn = new Date(new Date(remindOn.substr(0, 4), remindOn.substr(5, 2) - 1, remindOn.substr(8, 2), remindOn.substr(11, 2), remindOn.substr(14, 2), remindOn.substr(17, 2)));

        var miliSeconds = Math.abs(remindOn.getTime() - currentDate.getTime());
        var mins = parseInt(miliSeconds / (1000 * 60));

        var diff = new moment.duration(miliSeconds);

        var minsLeft = Math.round(diff.asMinutes().toFixed(2));
        var hoursLeft = diff.asHours().toFixed(2);
        var daysLeft = diff.asDays().toFixed(2);

//        var daysLeft = parseInt(mins / (60 * 24));
//        var mins = mins - daysLeft * 60 * 24;
//        var hoursLeft = parseInt(mins / (60));
//        var minsLeft = mins - hoursLeft * 60;

        if (daysLeft >= 1) {
            if (daysLeft == 1)
                message += daysLeft + ' day '
            else
                message += daysLeft + ' days '
        }
        if (hoursLeft >= 1)
            message += hoursLeft + 'h '
        if (minsLeft)
            message += minsLeft + 'm '

        return message + 'left';
    };

    $scope.editReminder = function (objEvent, placement, objReminder, index) {

        var element = angular.element(objEvent.target);
        $scope.ShowAngularStrapPopOver(element, 'Views/Common/RemindMe.html', objReminder, placement, "#divDashboardView");
    };

    $scope.addReminder = function (objEvent, placement, objData, index) {

        objData = new Reminder();

        objData.dataRowIndex = index;
        var element = angular.element(objEvent.target);
        $scope.ShowAngularStrapPopOver(element, 'Views/Common/RemindMe.html', objData, placement, "#divDashboardView");
    };

    $scope.$on('reminderPopOverClosed', function (event, args) {
        $scope.GetReminders();
    });
    $scope.refreshUsers = function (searchParam) {
        UserService.GetUsersListForDropDown(searchParam).then(function (result) {
            $scope.Users = result.data.userList;
        });
    };
    $scope.refreshFirstOwner = function (searchParam) {
        UserService.GetUsersListForDropDown(searchParam).then(function (result) {
            $scope.FirstOwners = result.data.userList;
        });
    };
    $scope.Request = function (objEvent, customerId, requestFor, index) {
        var requestObject = $scope.$new(true);

        requestObject.customerId = customerId;
        requestObject.requestFor = requestFor;
        requestObject.index = index;

        var element = angular.element(objEvent.target);

        $scope.ShowAngularStrapPopOver(element, 'Views/Common/CustomerRequestDataReason.html', requestObject, 'right');
    };
    $scope.$on('popOverClosed', function (event, args) {
        showRequestedDataOnGrid(args.requestFor, args.index, args.data);
        $rootScope.$$listeners.popOverClosed = []; // Done beacause my event was calling multiple times
    });

    var mobileDataTimeOutVar = '';
    var emailDataTimeOutVar = '';

    function showRequestedDataOnGrid(requestFor, atIndex, customerData) {
        if (requestFor === 'mobile')
        {
            $scope.ticketsList[atIndex].phoneMobile = customerData.phoneMobile ? customerData.phoneMobile : $scope.notifyNotice(AppMessages.NoData);
            mobileDataTimeOutVar = setTimeout(function () {
                $scope.$apply(function () {
                    $scope.ticketsList[atIndex].phoneMobile = 'notpresent';
                });
            }, CommonConstants.CustomerDataDisplayTime);
        }
        if (requestFor === 'email')
        {
            $scope.ticketsList[atIndex].email = customerData.email ? customerData.email : $scope.notifyNotice(AppMessages.NoData);
            emailDataTimeOutVar = setTimeout(function () {
                $scope.$apply(function () {
                    $scope.ticketsList[atIndex].email = 'notpresent';
                });
            }, CommonConstants.CustomerDataDisplayTime);
        }
    }

    $scope.getSubString = function (str, startIndex, lastIndex) {
        if (str)
            return str.substring(startIndex, lastIndex);
        else
            return '';
    }
    $scope.CountNumberOfRemindersByDate = function (date) {
        var arr = _.where($scope.reminders, {remindOnDate: date});
        return  arr.length;
    }
    $scope.GetRemindersByDate = function (date) {
        objReminder.reminderTo = Session.activeUserId;
        objReminder.forSupports = 0;
        objReminder.fromDateTime = moment(date).format("YYYY-MM-DD 00:00:00");
        objReminder.toDateTime = moment(date).add('days', 1).format("YYYY-MM-DD 00:00:00");

        GeneralService.GetReminders(objReminder).then(function (result) {
            $scope.lstRemindersByDate = result.data.reminders;
        });
    }
    $scope.GetRemindersForSupportsByDate = function (date) {
        objReminder.forSupports = 1;
        objReminder.reminderTo = 0;

        objReminder.fromDateTime = moment(date).format("YYYY-MM-DD 00:00:00");
        objReminder.toDateTime = moment(date).add('days', 1).format("YYYY-MM-DD 00:00:00");

        GeneralService.GetReminders(objReminder).then(function (result) {
            $scope.lstRemindersByDateForSupports = result.data.reminders;
        });
        objReminder.reminderTo = Session.activeUserId;
        objReminder.forSupports = 0;
    }
    $scope.GetReminders();
    $scope.GetRemindersForSuports();
    $scope.LoggedInUser = Session.userId;
    $scope.LoggedInUserRole = Session.userRoleName;

    function GetAllModuleCounts() {
        $scope.todayReminderCount = 0;
        $scope.totalCustomers = 0;
        $scope.todayLeadCount = 0;
        $scope.todayOrderCount = 0;
        $scope.totalLeads = 0;
        $scope.todayCaseCount = 0;
        $scope.todayReportReminderCount = 0;
        $scope.todayCustomerCount = 0;
        $scope.totalReminders = 0;
        $scope.totalReportReminders = 0;
        $scope.totalOrders = 0;
        $scope.totalCases = 0;

        DashboardService.getCountsOfAllModules().then(function (result) {
            
            $scope.todayReminderCount = result.data.todayReminderCount;
            $scope.todayCustomerCount = result.data.todayCustomerCount;
            $scope.todayLeadCount = result.data.todayLeadCount;
            $scope.todayOrderCount = result.data.todayOrderCount;
            $scope.todayCaseCount = result.data.todayCaseCount;
            $scope.todayReportReminderCount = result.data.todayReportReminderCount;

//            $scope.todayReminderCount = 1000023;
//            $scope.todayCustomerCount = 100023;
//            $scope.todayLeadCount = 1000023;
//            $scope.todayOrderCount = 1000023;
//            $scope.todayCaseCount = 1000023;
//            $scope.todayReportReminderCount = 1002323;

//        $scope.totalReminders = result.data.totalReminders;
//        $scope.totalReportReminders = result.data.totalReportReminders;
//        $scope.totalOrders = result.data.totalOrders;
//        $scope.totalCases = result.data.totalCases;
//        $scope.totalLeads = result.data.totalLeads;
//        $scope.totalCustomers = result.data.totalCustomers;
        })
    }
    
    $scope.GetLeadData = function () {
//        var startDate = $filter('date')(new Date($scope.leadDateRange.startDate), 'yyyy-MM-dd');
//        var endDate = $filter('date')(new Date($scope.leadDateRange.endDate), 'yyyy-MM-dd');

        if ($scope.leadBySourceOrRating == "leadbysource") {
            CustomersService.GetLeadsBySourceCount(0, $scope.leadYear, '', '', '').then(function (result) {
                var listData = result.data.leadsCount;

                var referralRatingData = _.pluck(_.where(listData, {type: "Referral"}), 'count'); // find array of  lead  counts belonging to Referral source
                var sumOfReferralRatingData = 0;
                
                if(referralRatingData.length>0)
                    sumOfReferralRatingData = referralRatingData.reduce((prev, curr) => parseInt(prev) + parseInt(curr)); // sum of lead  counts belonging to Referral source
                
                var tradeShowRatingData = _.pluck(_.where(listData, {type: "TradeShow"}), 'count');
                var sumOfTradeShowRatingData = 0;
                
                if(tradeShowRatingData.length > 0 )
                    sumOfTradeShowRatingData = tradeShowRatingData.reduce((prev, curr) => parseInt(prev) + parseInt(curr)); // sum of lead  counts belonging to TradeShow source
                    
                var webRatingData = _.pluck(_.where(listData, {type: "Web"}), 'count');
                var sumOfWebRatingData = 0;
                
                if(webRatingData.length > 0)
                    sumOfWebRatingData = webRatingData.reduce((prev, curr) => parseInt(prev) + parseInt(curr)); // sum of lead  counts belonging to Web source
                
                var techHealRatingData = _.pluck(_.where(listData, {type: "TechHeal"}), 'count');
                var sumOfTechHealRatingData = 0;
                
                if(techHealRatingData.length > 0)
                    sumOfTechHealRatingData = techHealRatingData.reduce((prev, curr) => parseInt(prev) + parseInt(curr)); // sum of lead  counts belonging to TechHeal source
                
                var campaignRatingData = _.pluck(_.where(listData, {type: "Campaign"}), 'count');
                var sumOfCampaignRatingData = 0;
                
                if(campaignRatingData.length > 0)
                    sumOfCampaignRatingData = campaignRatingData.reduce((prev, curr) => parseInt(prev) + parseInt(curr)); // sum of lead  counts belonging to Campaign source
                
                var data = [
                    ['Source', 'Count'],
                    ['Referral', parseInt(sumOfReferralRatingData)],
                    ['TradeShow', parseInt(sumOfTradeShowRatingData)],
                    ['Web', parseInt(sumOfWebRatingData)],
                    ['TechHeal', parseInt(sumOfTechHealRatingData)],
                    ['Campaign', parseInt(sumOfCampaignRatingData)]
                ];
                var options = {
                    title: 'Lead by source',
                    chartArea: {
                        height: "80%",
                        width: "80%"
                    },
                    legend : {
                        position : 'bottom'
                    }
                };
//                $(document).ready(function () {
                    DrawPieChart(data, 'PieChartMenu', options)
//                })
            })
        } else {
            CustomersService.GetLeadsByRatingCount(0, $scope.leadYear, '', '', '').then(function (result) {
                var listData = result.data.leadsCount;

                var coldRatingData = _.pluck(_.where(listData, {type: "Cold"}), 'count'); // find array of  lead  counts belonging to cold rating
                var sumOfColdRatingData = 0;
                
                if(coldRatingData .length > 0)
                    sumOfColdRatingData = coldRatingData.reduce((prev, curr) => parseInt(prev) + parseInt(curr)); // sum of lead  counts belonging to cold rating

                var warmRatingData = _.pluck(_.where(listData, {type: "Warm"}), 'count');
                var sumOfWarmRatingData = 0;
                
                if(warmRatingData.length > 0)
                    sumOfWarmRatingData = warmRatingData.reduce((prev, curr) => parseInt(prev) + parseInt(curr)); // sum of lead  counts belonging to Warm rating

                var hotRatingData = _.pluck(_.where(listData, {type: "Hot"}), 'count');
                var sumOfHotRatingData = 0;
                        
                if(hotRatingData.length > 0)
                    sumOfHotRatingData = hotRatingData.reduce((prev, curr) => parseInt(prev) + parseInt(curr)); // sum of lead  counts belonging to Hot rating
                
                var lostRatingData = _.pluck(_.where(listData, {type: "Lost"}), 'count');
                var sumOfLostRatingData = 0 ;
                
                if(lostRatingData.length>0)
                    sumOfLostRatingData = lostRatingData.reduce((prev, curr) => parseInt(prev) + parseInt(curr)); // sum of lead  counts belonging to Lost rating
                        
                var data = [
                    ['Rating', 'Count'],
                    ['Cold', parseInt(sumOfColdRatingData)],
                    ['Warm', parseInt(sumOfWarmRatingData)],
                    ['Hot', parseInt(sumOfHotRatingData)],
                    ['Lost', parseInt(sumOfLostRatingData)]
                ];
                var options = {
                    title: 'Lead by rating',
                    chartArea: {
                        height: "80%",
                        width: "80%"
                    },
                    legend : {
                        position : 'bottom'
                    }
                };
//                $(document).ready(function () {
                    DrawPieChart(data, 'PieChartMenu', options)
//                })
            })
        }
    }
    function DrawPieChart(data, divId, options) {
        
        var data = google.visualization.arrayToDataTable(data);
        var chart = new google.visualization.PieChart(document.getElementById(divId));
        chart.draw(data, options);
    }

    function generateDataForStackChart(minNegative) {
        var stackChartDataArray = [];
        var noOfRecords = 15;
        var currentDate = new Date(2014, 0, 1);
        var dateOfJoining = currentDate;
        var minVal;
        if (!isNaN(minNegative)) {
            minVal = minNegative;
        } else {
            minVal = 10;
        }

        var colorJson = {"pending": "red", "approved": "cyan", 'rejected': "blue", "halted": "orange"};
        for (var i = 1; i < noOfRecords; i++) {
            var id = i;
            dateOfJoining.setMonth(dateOfJoining.getMonth() + 1);
            var doj = convertDateIntoYYMMDD(dateOfJoining);
            var pending = generateRandomNumber(minVal, 100);
            var approved = generateRandomNumber(minVal, 50);
            var rejected = generateRandomNumber(minVal, 10);
            var halted = generateRandomNumber(minVal, 100);

            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
            var fomratttedDate = monthNames[(new Date(doj)).getMonth()] + "'" + (new Date(doj)).getFullYear().toString().substring(2, 4);

            var obj = {"doj": fomratttedDate, "pending": pending, "approved": approved, 'rejected': rejected, "halted": halted};
            stackChartDataArray.push(obj);
        }

        return stackChartDataArray;
    }
    function generateRandomNumber(minLimit, maxLimit) {
        return Math.floor(Math.random() * (maxLimit - minLimit + 1) + minLimit);
    };
    function convertDateIntoYYMMDD(date) {
        var month = date.getMonth() + 1;
        var dateInDigit = date.getDate();
        if (month < 10) {
            month = "0" + month;
        }
        if (dateInDigit < 10) {
            dateInDigit = "0" + dateInDigit;
        }
        var dateInString = date.getFullYear() + "-" + month + "-" + dateInDigit;
        return dateInString;
    }

    OrdersService.getYearForOrders().then(function (result) {
        $scope.yearList = result.data.yearList;
        $scope.objReport.year = (new Date()).getFullYear();
        $scope.orderYear = $scope.objReport.year.toString();
        drawGraphAndGrid();
    })
    $scope.changeOrderYear = function (year) {
        $scope.objReport.year = year;
        drawGraphAndGrid();
    }

    function drawGraphAndGrid() {
        $scope.objReport.PageSize = 12;
        $scope.objReport.groupBy = 0;
        $scope.objReport.sortOrder = 1;

        $scope.revenueOutflowData = [];
        $scope.showLoader = true;

        ReportService.revenueOutflowReportPivot($scope.objReport).then(function (result) {
            $scope.showLoader = false;
            $scope.total = result.data.totalRecords;

            if ($scope.total > 0) {
                $scope.revenueOutflowData = result.data.reportSaleSummary;
                $scope.DisablePrintRevenueAndOutflowReport = !HasAccess(Activities.PrintRevenueAndOutflowReport);
                $scope.DisableDownloadRevenueAndOutflowPDFReport = !HasAccess(Activities.DownloadRevenueAndOutflowPDFReport);
                $scope.DisableDownloadRevenueAndOutflowExcelReport = !HasAccess(Activities.DownloadRevenueAndOutflowExcelReport);
            } else {
                $scope.total = 0;
                $scope.DisablePrintRevenueAndOutflowReport = true;
                $scope.DisableDownloadRevenueAndOutflowPDFReport = true;
                $scope.DisableDownloadRevenueAndOutflowExcelReport = true;
            }

            $scope.chartType = 'line';
            $scope.gridHeading = $scope.gridHeadingPart + $scope.objReport.year + '(Total records:' + $scope.total + ')';
            $scope.chartData = getFormattedLineChartData($scope.revenueOutflowData);
        });
    }


    //Format data for chart
    function getFormattedLineChartData(chartData) {
        var colour = ["cyan", "blue", "orange", "brown", "black", "red"];
        var xAxisData = _.pluck(chartData, 'date');
//        console.log(xAxisData);
        var yAxisDataArr = [];
        var lstSaleCount = [];
        var lstRefundCount = [];
        var lstPartiallyRefundCount = [];
        var lstPendingCount = [];
        var arrStatus = ["Sale", "Refunded", "Partially Refunded", "Pending"];
        for (var i = 0; i < chartData.length; i++) {
            isNaN(chartData[i].saleCount) ? lstSaleCount.push(0) : lstSaleCount.push(parseInt(chartData[i].saleCount));
            isNaN(chartData[i].refundCount) ? lstRefundCount.push(0) : lstRefundCount.push(parseInt(chartData[i].refundCount));
            isNaN(chartData[i].partiallyRefundCount) ? lstPartiallyRefundCount.push(0) : lstPartiallyRefundCount.push(parseInt(chartData[i].partiallyRefundCount));
            isNaN(chartData[i].pendingCount) ? lstPendingCount.push(0) : lstPendingCount.push(parseInt(chartData[i].pendingCount));
        }

        yAxisDataArr.push({
            "Name": arrStatus[0],
            "Shape": "circle",
            "color": colour[0],
            "data": lstSaleCount
        }, {
            "Name": arrStatus[1],
            "Shape": "circle",
            "color": colour[1],
            "data": lstRefundCount
        }, {
            "Name": arrStatus[2],
            "Shape": "circle",
            "color": colour[2],
            "data": lstPartiallyRefundCount
        }, {
            "Name": arrStatus[3],
            "Shape": "circle",
            "color": colour[3],
            "data": lstPendingCount
        });
        var basicLineData = {
            xAxisTickArray: xAxisData,
            yAxisfactor: "Number Of Orders",
            yLabelColor: "red",
            xAxisfactor: "Month Wise Data",
            xLabelColor: "green",
            padding: 30,
            yAxisData: yAxisDataArr
        };
        return basicLineData;
    }
    $scope.changeLeadYear = function () {
        $scope.GetLeadData();
    }
    CustomersService.GetLeadDataYear(1).then(function (result) {
        $scope.leadYearList = result.data.year;
        $scope.leadYear = $scope.leadYearList[0];
    })
    $scope.dateRange = {
        startDate : '',
        endDate : ''
    }
    $scope.changeDate = function () {
        
        if($scope.dateRange.startDate)
            $scope.TicketInput.StartDateTime = $scope.dateRange.startDate;
        
        if($scope.dateRange.endDate)
            $scope.TicketInput.EndDateTime = $scope.dateRange.endDate;
        
        ShowTickets();
    };
    function ShowTickets() {
        $scope.Tickets = [];
        TicketsService.SearchTickets($scope.TicketInput).then(function (result) {
            $scope.total = result.data.totalRecords;
        
            $scope.Tickets = result.data.tickets;
            var data = [
                    ['status','count'],
                    ["Pending",parseInt(result.data.pendingCount)], 
                    ["Refunded",parseInt(result.data.refundedCount)], 
                    ["Resolved",parseInt(result.data.resolvedCount)], 
                    ["Unresolved",parseInt(result.data.unresolvedCount)], 
                    ["Reopen",parseInt(result.data.reopenCount)], 
                    ["Closed",parseInt(result.data.closedCount)]
                  ];
                var options = {
                    legend:{ 
                        position:'bottom'
                    },
                    title: 'Case by status',
                    pieHole: 0.4,
                    chartArea: {
                            height: "80%",
                            width: "80%"
                        }
                };
            var data = google.visualization.arrayToDataTable(data);
            var chart = new google.visualization.PieChart(document.getElementById('casePieChart'));
            chart.draw(data, options);
        });
    }
    
    var currentDate = new Date();
    $scope.dateRange.startDate = currentDate.getFullYear() + '-1-1';
    $scope.dateRange.endDate =   currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate();       
    google.charts.setOnLoadCallback($scope.changeDate); // Calls when doc is ready so that graphs can get their container
    
    $scope.leadYear = currentDate.getFullYear();
    google.charts.setOnLoadCallback($scope.GetLeadData);    // Calls when doc is ready so that graphs can get their container
    $scope.changeDate();
    
    $scope.ClickNewCustomer = function(route,count){
        if(count>0){
            var obj = new Customer();
            obj.CreatedOn = $filter('date')(new Date(), 'yyyy-MM-dd');
            
            DataSharingService.Customer = obj;
            location.href = route;
        }
        else return '';
    }
    $scope.ClickNewLeads = function(route,count){
        if(count>0){
            var obj = {createdOn : $filter('date')(new Date(), 'yyyy-MM-dd') };
             
            DataSharingService.dataObject = obj;
            location.href = route;
        }
        else return '';
    }
    $scope.ClickNewCases = function(route,count){
        if(count>0)
        {
            var obj = new Ticket();
            obj.RaisedOn = $filter('date')(new Date(), 'yyyy-MM-dd');
            DataSharingService.Ticket = obj;
            location.href = route;
        }
        else return '';
    }
    $scope.ClickNewOrders = function(route,count){
        if(count>0)
        {
            var obj = new Order();
            obj.CreatedOn = $filter('date')(new Date(), 'yyyy-MM-dd');
            DataSharingService.Order = obj;
            location.href = route;
        }
        else return '';
    }
  });    
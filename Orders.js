'use strict';

angular.module('TechHealApp').controller('Orders', function ($scope, $rootScope, Activities, CustomersService, $routeParams, OrdersService, UserService, ProductService, $location, DataSharingService, AppMessages, CommonConstants) {

    var CustomerId = $routeParams.CustomerId;

    if (HasAccess(Activities.ViewOrders)) {
        $scope.user = {};
        $scope.customer = {};
    } else {
        var routeArr = '';

        if ($location.path())
            routeArr = $location.path().split('/');

        if (routeArr.length > 0 && routeArr[0].toLowerCase() == 'orders')
            location.href = "#/NotAuthorized";
    }
    permissionChecker();
    $scope.Order = new Order();
    $scope.multipleAssignedTo = {};
    $scope.multipleAssignedTo.selectedAssignedTo = [];
    $scope.assignedTo = {};
    $scope.MaxEndDate = new Date();
    var mobileDataTimeOutVar = '';
    debugger;
    $scope.moreFiltersVisible = 0;
    $scope.ShowMoreOrLessFilter = "More Filters <span class='glyphicon glyphicon-chevron-down' aria-hidden='true'></span>";

    $scope.Toggle = function (cls) {
        $(cls).slideToggle("1000");
        $scope.moreFiltersVisible = !$scope.moreFiltersVisible;

        if ($scope.moreFiltersVisible)
            $scope.ShowMoreOrLessFilter = "Less Filters <span class='glyphicon glyphicon-chevron-up' aria-hidden='true'></span>";
        else
            $scope.ShowMoreOrLessFilter = "More Filters <span class='glyphicon glyphicon-chevron-down' aria-hidden='true'></span>";
    }
    
    // this is to maintain search data when we come back from inside the orders
    if (DataSharingService.Order != null) {
        $scope.Order = DataSharingService.Order;
        $scope.Toggle('.btntoggle');
        
        if ($scope.Order.CustomerId) {
            CustomersService.GetCustomerDetailById($scope.Order.CustomerId).then(function (result) {
                $scope.customer.selected = result.data;
            });
        }


        DataSharingService.Order = null;
    }

    if (CustomerId > 0) {
        $scope.ShowCustomerDropDown = true;
        if ($scope.customer.selected) {
            $scope.customer.selected.customerId = CustomerId;
        }
        $scope.HideCustomerName = true;
    } else
        $scope.ShowCustomerDropDown = false;


    function permissionChecker() {
        $scope.ShowAddOrder = HasAccess(Activities.AddOrder);
        $scope.ShowEditOrder = HasAccess(Activities.EditOrder);
        $scope.ShowCutomerDetail = HasAccess(Activities.ViewCustomerDetail);
        $scope.ShowOrderDetail = HasAccess(Activities.ViewOrderDetail);
        $scope.ShowRefund = HasAccess(Activities.Order_Refund);
    }

    function getSearchParametersObj() {

        if (CustomerId !== '' && CustomerId !== "0")
            $scope.Order.CustomerId = CustomerId;
        else if ($scope.customer.selected !== undefined)
            $scope.Order.CustomerId = $scope.customer.selected.customerId;
        else
            $scope.Order.CustomerId = $scope.Order.CustomerId;

        if (!$scope.Order.SaleOn)
            $scope.Order.SaleOn = '';
        else
            $scope.Order.SaleOn = $scope.Order.SaleOn;

        $scope.Order.SortOrder = 0;
        $scope.Order.SortBy = 2;

        //clears request data timeout when new data is searched
        clearTimeout(mobileDataTimeOutVar);

    }

    $scope.refreshAssignedTo = function (searchParam) { // for user drop down called every time when search is performed
        UserService.GetUsersListForDropDown(searchParam).then(function (result) {
            $scope.userList = result.data.userList;
        });
    };
    $scope.setAssignedTo = function () {
        var assignedToIds = _.pluck($scope.multipleAssignedTo.selectedAssignedTo, "userId");
        $scope.Order.AssignedTo = assignedToIds.join(",");
        $scope.Order.AssignedToId = assignedToIds.join(",");
        //$scope.ShowOrders();
    };

    $scope.refundOrder = function (orderId) {
        DataSharingService.PushOrder($scope.Order);
        if (CustomerId > 0) {
            // pushing data for exchanging between controllers
            DataSharingService.PushCustomer($rootScope.mainGridData);
        }
        location.href = "#/RefundOrder/" + orderId + "/" + CustomerId + "/Orders";
    };

    function getOrders() {

        getSearchParametersObj();

        $scope.Orders = [];
        $scope.showLoader = true;
        $scope.HeadingAndNumberOfRecords = "Orders&nbsp;<label class='lblRecords'>(Total records:0)</label>";

        OrdersService.GetAllOrdersInDetail($scope.Order).then(function (result) {

            $scope.showLoader = false;
            $scope.total = result.data.totalRecords;

            if ($scope.total > 0) {
                var lstObj = [],
                    saleOn;
                var estCurrentTime = moment().subtract(CommonConstants.ISTAndEstMinDifference, 'minutes');
                $scope.HeadingAndNumberOfRecords = "Orders&nbsp;<label class='lblRecords'>(Total records:" + result.data.totalRecords + ")</label>";
                
                
                $scope.mobilePhonePermitted = true;

                if (!("phoneMobile" in result.data.orders[0]))
                    $scope.mobilePhonePermitted = false;
                
                angular.forEach(result.data.orders, function (value, key) {

                    var obj = new Object();

                    saleOn = moment(value.saleOn + ' ' + value.saleOnTime);

                    if (estCurrentTime.diff(saleOn, 'minutes') > 15) {
                        obj.classRequestBtn = "requestBtn btn-disabled-req";
                        obj.isDisable = true;
                        obj.title = "Not allowed.";

                    } else {
                        obj.title = "Register Order";
                        obj.isDisable = false;
                        obj.classRequestBtn = 'requestBtn';
                    }



                    obj.productOrderId = value.productOrderId;
                    obj.customerName = value.customerName;
                    obj.skus = value.skus;

                    if (!value.phoneMobile)
                        obj.phoneMobile = 'notpresent';
                    else
                        obj.phoneMobile = value.phoneMobile;

                    obj.saleOn = value.saleOn;
                    obj.assignedToName = value.assignedToName;



                    obj.orderStatus = value.orderStatus;
                    obj.orderId = value.orderId;
                    obj.customerId = value.customerId;
                    if(value.saleOnTime == '0:00:00')
                            obj.saleOnTime = '';
                    else
                            obj.saleOnTime = value.saleOnTime;
                    lstObj.push(obj);
                })

            } else {
                $scope.total = 0;
            }

            $scope.Orders = lstObj;
        });

    }

    $scope.ShowOrders = function (page, pageSize) {
        if ($scope.isSearchButtonClicked) {
            $scope.Order.PageNumber = 1;
            if (!($scope.Order.SaleOn == "" && $scope.Order.MainPhone == "" && $scope.Order.AssignedTo == "" && $scope.Order.CallId == "" && ($scope.Order.StatusId == "" || $scope.Order.StatusId == null) && $scope.customer.selected == undefined && $scope.Order.CreatedOn == ""))
                getOrders();
            else
                $scope.notifyError(AppMessages.EmptySearch);
        } else {
            $scope.Order.PageNumber = page;
            $scope.Order.PageSize = pageSize;

            getOrders();
        }
    };

    getOrders();

    UserService.GetUsersListForDropDown("").then(function (result) {
        $scope.Users = result.data.userList;
    });
    ProductService.GetProducts().then(function (result) {
        $scope.Products = result.data.productList;
    })
    CustomersService.GetCustomersForDropDown("").then(function (result) {
        $scope.Customers = result.data.customerList;
    })

    $scope.RefreshSearch = function () {
        $scope.Order = new Order();
        $scope.user = {};
        $scope.customer = {};
        $scope.multipleAssignedTo.selectedAssignedTo = [];

        getOrders();
    };
    $scope.refreshUsers = function (searchParam) {
        UserService.GetUsersListForDropDown(searchParam).then(function (result) {
            $scope.Users = result.data.userList;
        });
    };
    $scope.refreshCustomers = function (searchParam) {
        CustomersService.GetCustomersForDropDown(searchParam).then(function (result) {
            $scope.Customers = result.data.customerList;
        });
    };
    $scope.ViewOrder = function (orderId) {
        // pushing data for exchanging between controllers
        DataSharingService.PushOrder($scope.Order);

        if (CustomerId > 0) {
            // pushing data for exchanging between controllers
            DataSharingService.PushCustomer($rootScope.mainGridData);
        }

        location.href = "#/ViewOrder/" + orderId + "/" + CustomerId + "/Orders";
    }
    $scope.AddOrder = function () {
        // pushing data for exchanging between controllers
        DataSharingService.PushOrder($scope.Order);

        if (CustomerId > 0) {
            // pushing data for exchanging between controllers
            DataSharingService.PushCustomer($rootScope.mainGridData);
        }

        location.href = "#/AddEditOrder/0/" + CustomerId + "/Orders";
    }
    $scope.EditOrder = function (orderId) {
        // pushing data for exchanging between controllers
        DataSharingService.PushOrder($scope.Order);

        if (CustomerId > 0) {
            // pushing data for exchanging between controllers
            DataSharingService.PushCustomer($rootScope.mainGridData);
        }

        location.href = "#/AddEditOrder/" + orderId + "/" + CustomerId + "/Orders";
    }
    $scope.RefreshCustomers = function () {
        if ($scope.customer && $scope.customer.selected)
            $scope.customer.selected = undefined;
    }

    GetOrderStatusList();

    function GetOrderStatusList() {

        OrdersService.GetOrderStatusList().then(function (result) {
            $scope.orderStatusList = result.data.orderStatusList;

            if ($scope.Order.StatusId)
                $scope.Order.StatusId = $scope.Order.StatusId;
        })
    }

    


    // request data for 20 sec of permission is not allowed
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

    function showRequestedDataOnGrid(requestFor, atIndex, customerData) {
        switch (requestFor) {
        case 'mobile':
            $scope.Orders[atIndex].phoneMobile = customerData.phoneMobile ? customerData.phoneMobile : $scope.notifyNotice(AppMessages.NoData);
            mobileDataTimeOutVar = setTimeout(function () {
                $scope.$apply(function () {
                    $scope.Orders[atIndex].phoneMobile = 'notpresent';
                });
            }, CommonConstants.CustomerDataDisplayTime);
            break;

        } // switch 
    } //showRequestedDataOnGrid


    $scope.registerOrder = function (objEvent, orderId, index) {
        var objOrder = $scope.$new(true);

        objOrder.orderId = orderId;
        objOrder.index = index;

        var element = angular.element(objEvent.target);

        $scope.ShowAngularStrapPopOver(element, 'Views/Common/RegisterOrder.html', objOrder, 'right');
    };

    $scope.$on('registerOrderPopoverClosed', function (event, args) {
        getOrders();
        $rootScope.$$listeners.registerOrderPopoverClosed = []; // Done beacause my event was calling multiple times
    });


});
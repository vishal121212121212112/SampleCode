'use strict';

angular.module('TechHealApp').controller('OrderRefund', function ($scope, $q, Session, CommonConstants, GeneralService, $http, $modalInstance, $rootScope, Activities, URLS, CustomersService, $routeParams, OrdersService, ProductService, UserService, $route, dataObject, notificationService, $location, AppModules) {
    
    
    var OrderId = $routeParams.OrderDetailId;
    var customerId = dataObject.customerId;

    var CustomerName = $routeParams.CustomerName;
    var CustomerEmail = $routeParams.CustomerEmail

    var CustomerEmail = $routeParams.CustomerEmail
    $scope.Order = new Order();
    $scope.Order.RefundAmount = dataObject.Price;

    $scope.multipleProductDemo = {};
    $scope.multipleProductDemo.selectedProductWithGroupBy = [];
    $scope.user = {};

    $scope.refreshUsers = function (searchParam) {

        UserService.GetUsersListForDropDown(searchParam).then(function (result) {
            $scope.Users = result.data.userList;
        });
    };
    UserService.GetUsersListForDropDown("").then(function (result) {
        $scope.Users = result.data.userList;

    });

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
    $scope.save = function (obj) {
        if ($scope.user.selected)
            obj.AssignedToId = $scope.user.selected.userId;

        obj.OrderDetailId = dataObject.order_detail_id;

        if (obj.AssignedToId == '' || obj.RefundAmount == '' || obj.RefundDescription == '' || obj.ReasonId == '') {
            notificationService.error("Please fill all required(*) fields");
            return;
        }

        if ($location.path().indexOf("TechHealOrdersDetail") > -1)
        {
            obj.Product.IsThisTechhealProduct = 1;
        }

        OrdersService.SaveOrderRefund(obj).then(function (result) {
            notificationService.success("Order refunded successfully");
            $modalInstance.dismiss('cancel');

//            GeneralService.GetEmailTemplate(AppModules.RefundOrder).then(function (result) {
//
//                var msg = result.data.emailTemplateList[0].message;
//                msg = msg.toString().replace(/\n/g, '<br/>');
//                msg = msg.toString().replace(/ /gi, '&nbsp; ');
//                msg = msg.toString().replace(/<CustomerName>/g, CustomerName);
//                msg = msg.toString().replace(/<RefundAmount>/g, $scope.Order.RefundAmount);
//                //msg = msg.toString().replace(/<ProductName>/g, );
//                msg = $rootScope.EmailTemplateGenerator(msg);
//
//                var objEmail = {
//                    'recipientEmail': CustomerEmail,
//                    'body': msg,
//                    'subject': "Product refunded succesfully",
//                    'fromName': CommonConstants.SendEmailByName,
//                    'fromEmail': CommonConstants.SendEmailFrom
//                }
//                GeneralService.SendEmailTemplate(objEmail).then(function (result) {
//                    notificationService.success("Email sent successfully!");
//                });
//            });

            $route.reload();

        })
    };



    $scope.GetRefundDetailById = function (orderDetailId) {
        
        OrdersService.GetRefundDetailById(orderDetailId).then(function (result) {
            if (result.data.statusCode != '202') {
                $scope.Order.ReasonId = result.data.ReasonId;
                $scope.Order.RefundDescription = result.data.Description;
                $scope.Order.RefundAmount = $rootScope.NoneValueReplacer(result.data.Amount);
                $scope.Order.OrderRefundChargebackId = result.data.OrderRefundChargebackId;

                if ($scope.Order.OrderRefundChargebackId > 0 && $scope.Order.OrderRefundChargebackId != '') {
                    UserService.GetUserById(result.data.modified_by).then(function (result) {
                        $scope.user.selected = result.data;
                    });
                } else {
                    UserService.GetUserById(result.data.created_by).then(function (result) {
                        $scope.user.selected = result.data;
                    });
                }
            } else {
                UserService.GetUserById(Session.activeUserId).then(function (result) {
                    $scope.user.selected = result.data;
                });
            }
        })
    }

    $scope.GetRefundDetailById(dataObject.order_detail_id);

    OrdersService.GetRefundReasonList().then(function (result) {
        $scope.RefundReasons = result.data.refundReasonList;
    })
    $scope.RefreshAssignedTo = function () {
        if ($scope.user && $scope.user.selected) {

            $scope.user.selected = undefined;

        }
    };

});
 
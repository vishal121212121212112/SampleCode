/// <reference path="../../../Views/Orders/Payment.html" />
/// <reference path="../../../Views/Orders/Payment.html" />
'use strict';
angular.module('TechHealApp').controller('AddEditOrder', function ($scope, Session, $rootScope, Activities, CustomersService, $routeParams, OrdersService, ProductService, UserService, DataSharingService, CommonConstants, $filter, GeneralService, AppModules) {

    if (!HasAccess(Activities.AddOrder) || !HasAccess(Activities.EditOrder))
        location.href = "#/NotAuthorized";
    //Coming from url paramteres
    var OrderId = $routeParams.OrderId;
    var CustomerOrLeadId = $routeParams.CustomerOrLeadId;
    var ComingFrom = $routeParams.ComingFrom;
    var orderId = $routeParams.OrderId;
    //Initializing variables
    var isOrderIdUnique = false;
    $scope.totalProduct = 0;
    $scope.Product = new Product();
    $scope.oneAtATime = true;
    $scope.editOrder = false;
    $scope.ShowNext = true;
    $scope.ShowCustomerDropDown = true;
    $scope.total = 0;
    $scope.arrSelectedProducts = [];
    $scope.totalAmount = 0;
    $scope.Order = new Order();
    $scope.Order.CustomerId = CustomerOrLeadId;
    //For ui select drop downs
    $scope.Order.selectedCustomer = {};
    $scope.Order.selectedUser = {};
    $scope.Order.orderId = orderId;
    $scope.Customer = new Customer();
    // Just for sharing data between controllers
    var mainGridData = DataSharingService.Order;
    DataSharingService.Order = null;
    //Conditions for edit order or add order
    if (OrderId > 0) { // edditing order
        $scope.ShowOrderDetail = true;
        $scope.editOrder = true;
//        $scope.ShowNext = false;
        $scope.ShowSaveBasicInfo = true;
        isOrderIdUnique = true; // by default this is false so if someone edit order it is unique

        OrdersService.GetOrderById(OrderId).then(function (result) {
            $scope.Order.SaleOn = result.data.saleOn;
            $scope.Order.CallOrderId = result.data.callOrderId;
            $scope.Order.Description = result.data.orderDescription;
            if (result.data.productNameCsv && result.data.productNameCsv != 'None' && result.data.productNameCsv != '')
                $scope.ArrProductNames = result.data.productNameCsv.split(',');
            else
                $scope.ArrProductNames = [];
            if (result.data.productIdCSV)
            {
                $scope.ArrProductIds = result.data.productIdCSV.split(',');
                //Shows all products section if products are not added
                $scope.ShowOrderDetails = true;
            } else {
                $scope.ArrProductIds = [];
                //Hides all products section if products are not added
                $scope.ShowOrderDetails = false;
            }

            if (result.data.priceCsv)
                $scope.ArrPriceCsv = result.data.priceCsv.split(',');
            else
                $scope.ArrPriceCsv = [];
            if (result.data.discountCsv)
                $scope.ArrDiscountCsv = result.data.discountCsv.split(',');
            else
                $scope.ArrDiscountCsv = [];
            if (result.data.additionalChargesCsv)
                $scope.ArrAdditionalChargesCsv = result.data.additionalChargesCsv.split(',');
            else
                $scope.ArrAdditionalChargesCsv = [];
            if (result.data.skuCsv)
                $scope.ArrSKUCsv = result.data.skuCsv.split(',');
            else
                $scope.ArrSKUCsv = [];
            if (result.data.orderDetailIdCSV)
                $scope.ArrOrderDetailIdCsv = result.data.orderDetailIdCSV.split(',');
            else
                $scope.ArrOrderDetailIdCsv = [];
            if (result.data.currentStatusCsv)
                $scope.ArrOrderDetailStatusCsv = result.data.currentStatusCsv.split(',');
            else
                $scope.ArrOrderDetailStatusCsv = [];
            function CheckStatusArr(element, index, array) {
                return (element === 'Refunded' || element === 'refunded');
            }

            if (!$scope.ArrOrderDetailStatusCsv.every(CheckStatusArr))
                $scope.ShowRefundLink = true;
            if (HasAccess(Activities.Order_Refund))
                $scope.ShowRefundLink = true;
            else
                $scope.ShowRefundLink = false;
            UserService.GetUserById(result.data.assignedTo).then(function (result) {
                $scope.Order.selectedUser = result.data;
            });
            $scope.CustomerNameAndEmail = true;
            $scope.Order.CustomerId = result.data.customerId;
            $scope.CustomerId = $scope.Order.CustomerId;
            $scope.Order.StatusId = result.data.orderStatusId;
            CustomersService.GetCustomerDetailById(result.data.customerId).then(function (result) {
                var objData = result.data;
                $scope.Order.selectedCustomer = objData;
                if ((objData.firstName === '' || objData.firstName === 'None') && (objData.email === '' || objData.email === 'None') && (objData.lastName === '' || objData.lastName === 'None')) {
                    $scope.CustomerNameAndEmail = false;
                } else {
                    var objCustomer = new Customer();
                    objCustomer.FirstName = objData.firstName;
                    if (objData.email == undefined) {
                        $scope.emailPermitted = false;
                        objCustomer.PrimaryEmail = 'notpresent';
                    } else
                        objCustomer.PrimaryEmail = objData.email;
                    objCustomer.LastName = objData.lastName;
                    $scope.Customer = objCustomer;
                }
            });
        });
    } else {
        UserService.GetUserById(Session.activeUserId).then(function (result) {
            $scope.Order.selectedUser = result.data;
        });
    }

    if (CustomerOrLeadId > 0) {
        $scope.ShowCustomerDropDown = false;
        $scope.CustomerNameAndEmail = true;
        CustomersService.GetCustomerDetailById(CustomerOrLeadId).then(function (result) {

            var objData = result.data;
            var objCustomer = new Customer();
            objCustomer.FirstName = objData.firstName;
            if (objData.email == undefined) {
                $scope.emailPermitted = false;
                objCustomer.PrimaryEmail = 'notpresent';
            } else
                objCustomer.PrimaryEmail = objData.email;
            objCustomer.LastName = objData.lastName;
            $scope.Customer = objCustomer;
        });
    }

// Filling order status drop down first time
    OrdersService.GetOrderStatusList().then(function (result) {
        $scope.orderStatusList = result.data.orderStatusList;
    });
    $scope.togglePaginationFlag = function () {
        debugger;
        $scope.Order.AssignedTo = $scope.Order.selectedUser.userId;
        if (OrderId == 0 && CustomerOrLeadId == 0)
            $scope.Order.CustomerId = $scope.Order.selectedCustomer.customerId;
        if (!$scope.Order.CustomerId)
            jquery_Lower_1_7_2('#customerName').validationEngine('showPrompt', 'Customer Name is required', 'error', 'topRight', true);
        if (!$scope.Order.AssignedTo)
            jquery_Lower_1_7_2('#assignedTo').validationEngine('showPrompt', 'Assigned To is required', 'error', 'topRight', true);
        if (!isOrderIdUnique)
            jquery_Lower_1_7_2('#callOrderId').validationEngine('showPrompt', 'Order Id is not available', 'error', 'topRight', true);
        $scope.Order.saleOn = $filter('date')(new Date($("#SaleOn").val()), 'yyyy-MM-dd HH:mm:ss');
        var options = {
            formId: "formOrderInfo",
            formClass: "",
            promptPosition: "topRight",
            fadeDuration: "",
            autoHidePrompt: true,
            autoHideDelay: "",
            focusFirstField: false,
            maxErrorsPerField: 1,
            scroll: false
        };
        $rootScope.attachValidationEngineToForm(options);
        if (!$scope.Order.AssignedTo ||
                !$scope.Order.CallOrderId ||
                !$scope.Order.CustomerId ||
                !$scope.Order.Description ||
                !$scope.Order.SaleOn ||
                !isOrderIdUnique) {
            return false;
        }

        if (orderId > 0)
            $scope.ShowOrderDetail = true;
        $scope.ShowProductsToAdd = true;
        return true;
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
    $scope.addProduct = function (selectedProduct, packageName) {
        debugger;
        if (selectedProduct.Package.packageId == '')
            $scope.notifyNotice("Please select any package");
        else {
            $scope.arrSelectedProducts.push({
                'productId': selectedProduct.ProductId,
                'productName': selectedProduct.ProductName,
                'price': selectedProduct.PlanCost,
                'discount': selectedProduct.Discount,
                'additionalCharges': selectedProduct.AdditionalCharges,
                'packageId': selectedProduct.packageId,
                'orderExpiry': selectedProduct.Duration,
                'packageName': selectedProduct.PackageName,
                'sku': selectedProduct.StockKeepingUnit,
                'orderDetailId': ((selectedProduct.OrderDetailId) ? selectedProduct.OrderDetailId : '0')
            });
            $scope.totalAmount += parseFloat(selectedProduct.PlanCost) - parseFloat(selectedProduct.Discount) + parseFloat(selectedProduct.AdditionalCharges);
            $scope.totalProduct += 1;
            $scope.notifySuccess("Product " + selectedProduct.ProductName + '(' + selectedProduct.StockKeepingUnit + ') with package ' + selectedProduct.PackageName + ' ) added successfully');
        }
    };
    $scope.CalculateProdutPrice = function (objProduct) {
        debugger;
        return ((parseFloat(objProduct.price) - parseFloat(objProduct.discount)) + parseFloat(objProduct.additionalCharges)).toFixed(2);
    }
    $scope.CalculateProdutPriceForView = function (index) {

        if ($scope.ArrPriceCsv[index] == 'None')
            $scope.ArrPriceCsv[index] = 0;
        if ($scope.ArrDiscountCsv[index] == 'None')
            $scope.ArrDiscountCsv[index] = 0;
        if ($scope.ArrAdditionalChargesCsv[index] == 'None')
            $scope.ArrAdditionalChargesCsv[index] = 0;
        return ((parseFloat($scope.ArrPriceCsv[index]) - parseFloat($scope.ArrDiscountCsv[index])) + parseFloat($scope.ArrAdditionalChargesCsv[index])).toFixed(2);
    }

    $scope.saveOrder = function (objOrder) {
        debugger;
        if (CustomerOrLeadId > 0)
            $scope.Order.customerId = CustomerOrLeadId;
        else {
            if ($scope.Order.selectedCustomer)
                objOrder.customerId = $scope.Order.selectedCustomer.customerId;
        }

        if ($scope.Order.selectedUser)
            objOrder.assignedTo = $scope.Order.selectedUser.userId;
        $scope.Order.AssignedTo = $scope.Order.selectedUser.userId;
        if (OrderId == 0 && CustomerOrLeadId == 0)
            $scope.Order.CustomerId = $scope.Order.selectedCustomer.customerId;
        if (!$scope.Order.CustomerId)
            jquery_Lower_1_7_2('#customerName').validationEngine('showPrompt', 'Customer Name is required', 'error', 'topRight', true);
        if (!$scope.Order.AssignedTo)
            jquery_Lower_1_7_2('#assignedTo').validationEngine('showPrompt', 'Assigned To is required', 'error', 'topRight', true);
        if (!isOrderIdUnique)
            jquery_Lower_1_7_2('#callOrderId').validationEngine('showPrompt', 'Order Id is not available', 'error', 'topRight', true);
        var options = {
            formId: "formOrderInfo",
            formClass: "",
            promptPosition: "topRight",
            fadeDuration: "",
            autoHidePrompt: true,
            autoHideDelay: "",
            focusFirstField: false,
            maxErrorsPerField: 1,
            scroll: false
        };
        $rootScope.attachValidationEngineToForm(options);
        objOrder.callOrderId = objOrder.CallOrderId;
        objOrder.currencyId = objOrder.CurrencyId;
        objOrder.orderDescription = objOrder.Description;
        objOrder.saleOn = $filter('date')($("#SaleOn").val(), 'yyyy-MM-dd HH:mm:ss');
        objOrder.totalAmount = $scope.totalAmount;
        objOrder.orderDetail = JSON.stringify({"orderDetail": $scope.arrSelectedProducts});
        if (jquery_Lower_1_7_2('#formOrderInfo').validationEngine('validate') && isOrderIdUnique) {
            CustomersService.SaveOrder(objOrder).then(function (result) {
                var orderId = result.data.code; // returned as orderId
                var orderDetailId = result.data.orderDetailId; // returned as orderId

                if (!result.data.error) {
                    $scope.notifySuccess("Order placed successfully");
                    if ($scope.Customer.PrimaryEmail == 'notpresent' || $scope.Customer.PrimaryEmail === '') { // user may not have access on email field
                        CustomersService.getCustomerEmailById(objOrder.customerId).then(function (result) {
                            $scope.Customer.PrimaryEmail = result.data.result;
                            sendPaymentEmail(orderId),orderDetailId;
                        });
                    } else
                        sendPaymentEmail(orderId,orderDetailId);
                } else
                    $scope.error("Something went wrong !");
            });
        }
//        } else
//            $scope.notifyNotice("Please select atleast one product");

    };
    function sendPaymentEmail(orderId, orderDetailId) {
debugger
        var emailBody, productSkuCsv = _.pluck($scope.arrSelectedProducts, 'sku'); // to check for free techheal product
        if (CommonConstants.FreeTechheal.indexOf(productSkuCsv) <= -1) { // not exist
            $scope.paymentUrl = CommonConstants.AppUrlOrigin + "/Views/Orders/Payment.html?P1=" + orderId + "&P2=" + Session.id + "&P3=" + $scope.Customer.PrimaryEmail + "&P4=" + Session.activeUserId;
            emailBody = "Confirm ur order " + $scope.paymentUrl;
            GeneralService.GetEmailTemplate(AppModules.AddOrder).then(function (result) {

                var msg = result.data.emailTemplateList[0].message;
                msg = msg.toString().replace(/\n/g, '<br/>');
                msg = msg.toString().replace(/ /gi, '&nbsp; ');
                msg = msg.toString().replace(/<CustomerName>/g, $scope.Customer.FirstName + ' ' + $scope.Customer.LastName);
                msg = msg.toString().replace(/<PaymentLink>/g, $scope.paymentUrl);
                msg = $rootScope.EmailTemplateGenerator(msg);
                var objEmail = {
                    'recipientEmail': $scope.Customer.PrimaryEmail,
                    'body': msg,
                    'subject': "Order Placed",
                    'fromName': CommonConstants.SendEmailByName,
                    'fromEmail': CommonConstants.SendEmailFrom
                }
                GeneralService.SendEmailTemplate(objEmail).then(function (result) {
                    $scope.notifySuccess("email sent for adding order");
                });
            });
        } else { // genrate key and send as email body

            var genKeyDetails = {
                "order_detail_id": orderDetailId,
                "comments": "Order added for free techheal"
            };
            CustomersService.GenerateSerialKey(genKeyDetails).then(function (result) {
                if (result.data.statusCode === '1600') {
                    $scope.notifySuccess("Serial Key updated successfully.")
                    var serialKey = result.data.skey;

                    GeneralService.GetEmailTemplate(AppModules.UpdateSerialKey).then(function (result) {

                        var msg = result.data.emailTemplateList[0].message;
                        msg = msg.toString().replace(/\n/g, '<br/>');
                        msg = msg.toString().replace(/ /gi, '&nbsp; ');
                        msg = msg.toString().replace(/<SerialKey>/g, serialKey);
                        msg = msg.toString().replace(/<CustomerName>/g, $scope.Customer.FirstName + ' ' + $scope.Customer.LastName);
                        msg = $rootScope.EmailTemplateGenerator(msg);

                        var objEmail = {
                            'recipientEmail': $scope.Customer.PrimaryEmail,
                            'body': msg,
                            'subject': "Serial key for techheal order",
                            'fromName': CommonConstants.SendEmailByName,
                            'fromEmail': CommonConstants.SendEmailFrom
                        }
                        GeneralService.SendEmailTemplate(objEmail).then(function (result) {
                            $scope.notifySuccess("Email sent successfully");
                        });
                    });
                }
            })
        }

        if (ComingFrom == 'Customers' || ComingFrom == 'customers')
            location.href = "#/ViewCustomer";
        else {
            $rootScope.$broadcast('closeOrderSummaryModal');
            //                        $scope.close();
            //                        $modalInstance.dismiss('cancel');
            window.history.back();
        }
    }

    $scope.ClickCart = function () {
        if ($scope.arrSelectedProducts.length > 0)
            $scope.openPopUp('Products.html', 'Products', 'lg', '', $scope);
    }

    $scope.SearchProducts = function (page, pageSize) {
        if (page && pageSize) {
            $scope.Product.PageNumber = page;
            $scope.Product.PageSize = pageSize;
            SearchProducts();
        } else
            SearchProducts();
    };
    SearchProducts();
    function SearchProducts() {
        debugger;
        $scope.Products = [];
        $scope.showLoader = true;
        ProductService.SearchProducts($scope.Product).then(function (result) {
            $scope.showLoader = false;
            $scope.total = parseInt(result.data.totalRecords);
            if ($scope.total > 0) {
                $scope.NumberOfRecords = "Total records:" + $scope.total;
                var products = [];
                angular.forEach(result.data.products, function (obj) {

                    var objProduct = new Product();
                    objProduct.ProductId = obj.productId;
                    objProduct.ProductName = obj.productName;
                    objProduct.PackageNameCsv = obj.packageNameCsv;
                    objProduct.PackageIdCsv = obj.packageIdCsv;
                    objProduct.Description = obj.description;
                    objProduct.LaunchedOn = obj.launchedOn;
                    objProduct.CurrencyId = obj.currencyId;
                    objProduct.CurrencyCode = obj.currencyCode;
                    objProduct.PlanCost = '';
                    objProduct.Duration = '';
                    objProduct.Discount = '';
                    objProduct.AdditionalCharges = '';
                    objProduct.StockKeepingUnit = obj.stockKeepingUnit;
                    objProduct.PackageName = '';
                    objProduct.PackageId = '';
                    var objEmptyPackage = new ProductPackage();
                    objEmptyPackage.packageName = "-Select-";
                    objEmptyPackage.packageId = "";
                    objProduct.ProductPackages.push(objEmptyPackage);
                    if (objProduct.PackageNameCsv && objProduct.PackageNameCsv != 'None' && objProduct.PackageNameCsv != '') {


                        angular.forEach(objProduct.PackageNameCsv.split(','), function (value, key) {

                            if (value != 'None' && value != '') {
                                var objPackage = new ProductPackage();
                                objPackage.packageName = value;
                                objPackage.packageId = objProduct.PackageIdCsv.split(',')[key];
                                objProduct.ProductPackages.push(objPackage);
                            }
                        })
                    }
                    products.push(objProduct);
                })
                $scope.Products = products;
            } else {
                $scope.NumberOfRecords = "Total records:0";
                $scope.total = 0;
            }
        });
    }

    $scope.EditProduct = function (productId) {
        location.href = "#/AddEditProduct/" + productId;
    };
    $scope.RefreshSearch = function () {
        $scope.Product = new Product();
        $("#txtDate").val('');
        SearchProducts();
    };
    $scope.GetProductPackagesInformationByPackageId = function (packageId, index) {
        $scope.index = index;
        if (packageId != null && packageId != '' && packageId != 0) {
            ProductService.GetProductPackagesInformationByPackageId(packageId).then(function (result) {

                $scope.Products[$scope.index].PlanCost = result.data.price;
                $scope.Products[$scope.index].Duration = result.data.duration;
                $scope.Products[$scope.index].Discount = result.data.discount;
                $scope.Products[$scope.index].AdditionalCharges = result.data.additionalCharges;
                $scope.Products[$scope.index].PackageName = result.data.packageName;
            })
        } else {

            $scope.Products[$scope.index].PlanCost = 0;
            $scope.Products[$scope.index].Duration = 0;
            $scope.Products[$scope.index].Discount = 0;
            $scope.Products[$scope.index].AdditionalCharges = 0;
        }
    }
    $scope.RemoveProduct = function (objProduct) {

        var txt;
        var r = confirm("Are you sure you want to remove Product Packages ?");
        if (r == true) {
            if ($scope.arrSelectedProducts.length > 0) {
                $scope.arrSelectedProducts.splice($scope.arrSelectedProducts.indexOf(objProduct), 1);   
                $scope.totalAmount = parseFloat($scope.totalAmount) - ((parseFloat(objProduct.price) - parseFloat(objProduct.discount)) + parseFloat(objProduct.additionalCharges));
                $scope.totalProduct -= 1;
            }
        }
    }
    $scope.back = function () {

//Injecting scope model for exchanging data between different controller
        DataSharingService.PushOrder(mainGridData);
        if (CustomerOrLeadId > 0) {
//Injecting scope model for exchanging data between different controller
            DataSharingService.PushCustomer($rootScope.mainGridData);
        }

        window.history.back();
    }
    $scope.EditOrder = function (orderId) {
        location.href = "#/AddEditOrder/" + orderId + "/0";
    }
    $scope.SaveBasicInfo = function () { // not in use -- but still check

        var objOrder = $scope.Order;
        objOrder.additionalCharges = '';
        objOrder.CurrentStatuses = '';
        objOrder.discounts = '';
        objOrder.orderExpiries = '';
        objOrder.prices = '';
        objOrder.productIds = '';
        objOrder.totalAmount = '';
        if (CustomerOrLeadId > 0)
            objOrder.customerId = CustomerOrLeadId;
        else if ($scope.Order.selectedCustomer)
            objOrder.customerId = $scope.Order.selectedCustomer.customerId;
        if (OrderId > 0)
            objOrder.customerId = $scope.Order.CustomerId;
        if ($scope.Order.selectedUser)
            objOrder.assignedTo = $scope.Order.selectedUser.userId;
        if (!objOrder.assignedTo || !objOrder.CallOrderId || !objOrder.customerId || !objOrder.Description || !objOrder.SaleOn) {
            $scope.notifyError("Please fill required(*) fields in basic info.");
            return false;
        }
        objOrder.callOrderId = objOrder.CallOrderId;
        objOrder.currencyId = objOrder.CurrencyId;
        objOrder.CurrentStatuses = '1';
        objOrder.orderDescription = objOrder.Description;
        objOrder.saleOn = objOrder.SaleOn;
        objOrder.OrderId = OrderId;
        CustomersService.SaveOrder(objOrder).then(function (result) {
            if (!result.data.error) {
                $scope.notifySuccess(result.data.status);
                return true;
            } else
                $scope.error("Something went wrong !");
        });
    }

    $scope.ConvertToTwoDecimal = function (amount) {
        if (amount != 'None' && amount != '')
            return parseFloat(amount).toFixed(2);
        else
            return '';
    }
    $scope.OpenRefundPopUp = function (OrderDetailId, Price) {

        var obj = {
            "order_detail_id": OrderDetailId,
            "Price": Price,
            "customerId": CustomerOrLeadId
        };
        $scope.openPopUp('Views/Orders/OrderRefund.html', 'OrderRefund', 'lg', obj);
    }
    $scope.GetCustomerDetail = function (obj) {
        if (obj.email == undefined) {
            $scope.emailPermitted = false;
            $scope.Customer.PrimaryEmail = 'notpresent';
        } else
            $scope.Customer.PrimaryEmail = obj.email;
    }

    $scope.Request = function (customerId, requestFor) {

        CustomersService.GetCustomerRequestData(customerId, requestFor).then(function (result) {

            if (requestFor == 'email') {
                if (result.data.email) {
                    $scope.Customer.PrimaryEmail = result.data.email;
                    setTimeout(function () {
                        $scope.$apply(function () {
                            $scope.Customer.PrimaryEmail = 'notpresent';
                        });
                    }, 20000);
                } else
                    $scope.notifyNotice('No Data!');
            }
        })
    };
    $scope.hideErrorMessage = function (id) {
        jquery_Lower_1_7_2(id).validationEngine('hide');
    };
    $scope.isOrderIdUnique = function (callOrderId) {
        if (callOrderId === '' || callOrderId == undefined)
            return;
        OrdersService.isOrderIdUnique(OrderId, callOrderId).then(function (result) {
            if (result.data.result === '0') { // no call order id in database
                isOrderIdUnique = true;
                jquery_Lower_1_7_2('#callOrderId').validationEngine('hide');
            } else { //  order id is not unique
                isOrderIdUnique = false;
                jquery_Lower_1_7_2('#callOrderId').validationEngine('showPrompt', 'Order Id is not available', 'error', 'topRight', true);
            }
        });
    };
    $scope.RefreshProducts = function () {
        $scope.Product = new Product();
        SearchProducts();
    }
    $scope.ClickNext = function () {
        debugger;
        $scope.productsToAdd = {
            open: true
        };
        $scope.OpenBasicInfo = {
            open: false
        };
    }
});
angular.module('TechHealApp').controller('Products', function ($scope, $modalInstance) {
    $scope.close = function () {
        $modalInstance.dismiss('cancel');
    };
    $scope.$on('closeOrderSummaryModal', function () {
        $scope.close();
    });
})
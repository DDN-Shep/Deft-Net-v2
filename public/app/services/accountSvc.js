'use strict';

angular.module('ddnSvc')
    .factory('accountSvc', ['identitySvc', 'toastrSvc', function (identitySvc, toastrSvc) {

        return {
            signin: function (username, password) {
                $http.post('/api/account/signin', {
                    username: username,
                    password: password
                }).then(function (response) {
                    if (response.data) {
                        identitySvc.currentUser = response.data;

                        toastrSvc.info('Logged in!');
                    }
                    else toastrSvc.error('Log in failed...');
                });
            },
            signout: function (username) {
                $http.post('/api/account/signout', {
                    username: username
                }).then(function() {
                    identitySvc.currentUser = undefined;

                    toastrSvc.info('Signed out!');
                })
            }
        };
    }]);
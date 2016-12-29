/**
 * @license
 * The MIT License (MIT)
 * Copyright 2015 Government of Canada
 *
 * @author
 * Ian Boyes
 *
 * @exports Start
 */

'use strict';

import React from 'react';
import Cookie from 'js-cookie';

import { without, assign } from "lodash";
import { postJSON } from "virtool/js/utils";

import { Flex, FlexItem, Icon, ProgressLogo } from 'virtool/js/components/Base';

var Dispatcher = require('virtool/js/dispatcher/main.js');
var Setup = require('./Setup/Setup');
var Main = require('virtool/js/components/Main');
var LoginDialog = require('./Login/Dialog');


var Start = React.createClass({

    getInitialState: function () {
        return {
            checkedSetup: false,
            needsSetup: false,

            checkedToken: false,
            needsLogin: false,

            synced: false,
            syncProgress: 0,

            forcedLogout: false
        };
    },

    componentDidMount: function () {
        this.checkSetup();
    },

    checkSetup: function () {
        postJSON('/', {operation: 'check_ready'}, function (data) {
            this.setState({
                checkedSetup: true,
                needsSetup: !data.serverReady
            }, this.establishConnection);
        }.bind(this));
    },

    establishConnection: function () {
        if (!this.state.needsSetup) {

            window.dispatcher = new Dispatcher(this.onDispatcherReady);

            var collectionsToSync = without(dispatcher.db.collectionNames, "reads", "files");

            dispatcher.on('synced', function () {
                this.setState({
                    synced: true,
                    syncProgress: 1
                });
            }.bind(this));

            dispatcher.on('syncing', function (data) {
                this.setState({syncProgress: data});
            }.bind(this));

        } else {
            history.replaceState({}, document.title, "/");
        }
    },

    clearForcedLogout: function () {
        this.setState({
            forcedLogout: false
        });
    },

    handleLogin: function (user) {
        dispatcher.user.authorize(user);

        this.setState({
            needsLogin: false
        });

        dispatcher.user.on('logout', this.onLogout);
    },

    onDispatcherReady: function () {
        var token = Cookie.get('token');

        if (token) {
            dispatcher.send({
                interface: 'users',
                method: 'authorize_by_token',
                data: {
                    token: token,
                    browser: dispatcher.browser
                }
            }).success(this.onCheckTokenSuccess).failure(this.onCheckTokenFailure);
        } else {
            this.onCheckTokenFailure();
        }
    },

    onCheckTokenSuccess: function (user) {
        dispatcher.user.authorize(user);

        this.setState({
            checkedToken: true,
            needsLogin: false
        });

        dispatcher.user.on('logout', this.onLogout);
    },

    onCheckTokenFailure: function () {
        this.setState({
            checkedToken: true,
            needsLogin: true
        });
    },

    onLogout: function (data) {
        var newState = assign(this.getInitialState(), {
            checkedSetup: true,
            checkedToken: true,
            needsLogin: true,
            forcedLogout: !data.logout
        });

        dispatcher.runningOperationCount = 0;
        dispatcher.syncOperationCount = 0;

        this.setState(newState);
    },

    render: function () {

        if (!this.state.checkedSetup || (this.state.checkedSetup && !this.state.needsSetup && !this.state.checkedToken)) {
            return (
                <Flex alignContent="center" justifyContent="center" className="page-loading">
                    <FlexItem grow={0} shrink={0} alignSelf="center">
                        <ProgressLogo value={0} />
                    </FlexItem>
                </Flex>
            );
        }

        if (this.state.checkedSetup && this.state.needsSetup) {
            return <Setup />;
        }

        if (this.state.checkedToken && this.state.needsLogin) {
            return (
                <LoginDialog
                    onLogin={this.handleLogin}
                    forcedLogout={this.state.forcedLogout}
                    clearForcedLogout={this.clearForcedLogout}
                />
            );
        }

        if (!this.state.synced) {
            return (
                <Flex alignContent="center" justifyContent="center" className="page-loading">
                    <FlexItem grow={0} shrink={0} alignSelf="center">
                        <ProgressLogo value={this.state.syncProgress} />
                    </FlexItem>
                </Flex>
            );
        }

        return <Main />;
    }

});

module.exports = Start;
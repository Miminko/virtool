/**
 *
 *
 * @copyright 2017 Government of Canada
 * @license MIT
 * @author igboyes
 *
 */

import {
    LIST_USERS,
    FILTER_USERS,
    CREATE_USER,
    SET_PASSWORD,
    SET_PRIMARY_GROUP,
    SET_FORCE_RESET,
    ADD_USER_TO_GROUP,
    REMOVE_USER_FROM_GROUP
} from "../actionTypes";

export const listUsers = () => ({
    type: LIST_USERS.REQUESTED
});

export const filterUsers = (term) => ({
    type: FILTER_USERS,
    term
});

export const createUser = (userId, password, forceReset) => ({
    type: CREATE_USER.REQUESTED,
    userId,
    password,
    forceReset
});

export const setForceReset = (userId, enabled) => ({
    type: SET_FORCE_RESET.REQUESTED,
    userId,
    enabled
});

export const setPassword = (userId, password) => ({
    type: SET_PASSWORD.REQUESTED,
    userId,
    password
});

export const setPrimaryGroup = (userId, primaryGroup) => ({
    type: SET_PRIMARY_GROUP.REQUESTED,
    userId,
    primaryGroup
});

export const addUserToGroup = (userId, groupId) => ({
    type: ADD_USER_TO_GROUP.REQUESTED,
    userId,
    groupId
});

export const removeUserFromGroup = (userId, groupId) => ({
    type: REMOVE_USER_FROM_GROUP.REQUESTED,
    userId,
    groupId
});

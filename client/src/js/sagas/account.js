/**
 *
 *
 * @copyright 2017 Government of Canada
 * @license MIT
 * @author igboyes
 *
 */

import { put, takeEvery, takeLatest } from "redux-saga/effects";

import { accountAPI } from "../api/account";

import {
    GET_ACCOUNT_REQUESTED,
    GET_ACCOUNT_SUCCEEDED,
    GET_ACCOUNT_FAILED,

    LOGOUT_REQUESTED,
    LOGOUT_SUCCEEDED
} from "../actions/actionTypes"

export function* watchAccount () {
    yield takeLatest(GET_ACCOUNT_REQUESTED, getAccount);
}

export function* getAccount () {
    try {
        const response = yield accountAPI.get();
        yield put({type: GET_ACCOUNT_SUCCEEDED, data: response.body});
    } catch (error) {
        yield put({type: GET_ACCOUNT_FAILED}, error);
    }
}

export function* watchLogout () {
    yield takeEvery(LOGOUT_REQUESTED, logout)
}

export function* logout () {
    yield accountAPI.logout();
    yield put({type: LOGOUT_SUCCEEDED});
}

import {simpleActionCreator} from "../utils";
import {
    WS_INSERT_SAMPLE,
    WS_UPDATE_SAMPLE,
    WS_REMOVE_SAMPLE,
    FILTER_SAMPLES,
    FIND_READ_FILES,
    FIND_READY_HOSTS,
    GET_SAMPLE,
    CREATE_SAMPLE,
    UPDATE_SAMPLE,
    UPDATE_SAMPLE_RIGHTS,
    REMOVE_SAMPLE,
    LIST_SAMPLES,
    SHOW_REMOVE_SAMPLE,
    HIDE_SAMPLE_MODAL
} from "../actionTypes";

export const wsInsertSample = (data) => ({
    type: WS_INSERT_SAMPLE,
    data
});

/**
 * Returns an action that should be dispatched when a sample document is updated via websocket.
 *
 * @func
 * @param update {object} update data passed in the websocket message
 * @returns {object}
 */
export const wsUpdateSample = (data) => ({
    type: WS_UPDATE_SAMPLE,
    data
});

/**
 * Returns an action that should be dispatched when a sample document is removed via websocket.
 *
 * @func
 * @param removed {string} the id for the specific sample
 * @returns {object}
 */
export const wsRemoveSample = (data) => ({
    type: WS_REMOVE_SAMPLE,
    data
});

export const filterSamples = (term) => ({
    type: FILTER_SAMPLES.REQUESTED,
    term
});

export const findReadFiles = simpleActionCreator(FIND_READ_FILES.REQUESTED);

/**
 * Returns action that can trigger an API call for getting all available subtraction hosts.
 *
 * @func
 * @returns {object}
 */
export const findReadyHosts = simpleActionCreator(FIND_READY_HOSTS.REQUESTED);

/**
 * Returns action that can trigger an API call for getting a specific sample.
 *
 * @func
 * @param sampleId {string} the id for the specific sample
 * @returns {object}
 */
export const getSample = (sampleId) => ({
    type: GET_SAMPLE.REQUESTED,
    sampleId
});

/**
 * Returns action that can trigger an API call for creating a new sample.
 *
 * @func
 * @param name {string} unique name for the sample
 * @param isolate {string} the originating isolate
 * @param host {string} the exact host
 * @param locale {string} location in which the sample was collected
 * @param srna {boolean} does the sample contain sRNA reads
 * @param subtraction {string} name of the associated subtraction host genome
 * @param files {object} file ids of one or two files
 * @returns {object}
 */
export const createSample = (name, isolate, host, locale, srna, subtraction, files) => ({
    type: CREATE_SAMPLE.REQUESTED,
    name,
    isolate,
    host,
    locale,
    srna,
    subtraction,
    files
});

/**
 * Returns action that can trigger an API call for modifying a sample.
 *
 * @func
 * @param sampleId {string} unique sample id
 * @param update {object} update data
 * @returns {object}
 */
export const editSample = (sampleId, update) => ({
    type: UPDATE_SAMPLE.REQUESTED,
    sampleId,
    update
});

/**
 * Returns action that can trigger an API call for modifying sample rights.
 *
 * @func
 * @param sampleId {string} unique sample id
 * @param update {object} update data
 * @returns {object}
 */
export const updateSampleRights = (sampleId, update) => ({
    type: UPDATE_SAMPLE_RIGHTS.REQUESTED,
    sampleId,
    update
});

/**
 * Returns action that can trigger an API call for removing a sample.
 *
 * @func
 * @param sampleId {string} unique sample id
 * @returns {object}
 */
export const removeSample = (sampleId) => ({
    type: REMOVE_SAMPLE.REQUESTED,
    sampleId
});

export const listSamples = (page) => ({
    type: LIST_SAMPLES.REQUESTED,
    page
});

/**
 * Returns action for displaying the remove sample modal.
 *
 * @func
 * @returns {object}
 */
export const showRemoveSample = simpleActionCreator(SHOW_REMOVE_SAMPLE);

/**
 * Returns action for hiding the sample modal.
 *
 * @func
 * @returns {object}
 */
export const hideSampleModal = simpleActionCreator(HIDE_SAMPLE_MODAL);

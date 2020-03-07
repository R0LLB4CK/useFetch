import { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';

import Enum from './utils/enum.js';


export const HTTPMethods = new Enum('GET', 'POST');
export const ResponseTypes = new Enum('JSON', 'TEXT')

const RESPONSE_TYPE_TO_CONVERTER = {
    [ResponseTypes.JSON]: response => response.json(),
    [ResponseTypes.TEXT]: response => response.text(),
}


export function useFetch(url, parser, responseType = ResponseTypes.JSON,
    {
        method = HTTPMethods.GET,
        data
    } = {}) {

    const [rawResponse, setRawResponse] = useState(null);
    const [error, setError] = useState(null);
    const { abortionSignal, abort } = useAbortRequest();
    const requestBody = JSON.stringify(data);

    const execute = useCallback(async function () {
        try {
            const response = await fetch(url, {
                method: method.description,
                body: requestBody,
                signal: abortionSignal,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const typedResponse = await getTypedResponse(response, responseType);
            setRawResponse(typedResponse);
            setError(response.ok ? null : new Error(`server error: ${response.status} - ${response.statusText}`));
        } catch (exception) {
            if (isAbortError(exception)) {
                return;
            }
            setError(exception);
        }
    }, [url, method, requestBody, responseType])

    useEffect(() => {
        execute();
    }, [execute]);

    return {
        result: getParsedResponse(rawResponse, parser),
        error,
        abort,
        execute: execute,
    };
}


function useAbortRequest() {
    const [controller, setController] = useState(new AbortController());
    const { signal: abortionSignal } = controller;
    abortionSignal.addEventListener('abort', () => setController(new AbortController()));

    useEffect(() => controller.abort.bind(controller), [controller]);

    return {
        abortionSignal,
        abort: controller.abort.bind(controller),
    }
}

function isAbortError(error) {
    return error instanceof DOMException && error.name === 'AbortError';
}

async function getTypedResponse(response, responseType) {
    const converter = RESPONSE_TYPE_TO_CONVERTER[responseType] || RESPONSE_TYPE_TO_CONVERTER[ResponseTypes.TEXT];
    return converter(response);
}

function getParsedResponse(rawResponse, parser) {
    if (_.isEmpty(rawResponse)) {
        return rawResponse;
    }
    if (_.isArray(rawResponse)) {
        return _.map(rawResponse, rawResponseItem => getParsedResponse(rawResponseItem, parser));
    }
    if (!_.isFunction(parser)) {
        return rawResponse;
    }
    if (_.isFunction(parser.fromJSON)) {
        return parser.fromJSON(rawResponse);
    }
    try {
        return new parser(rawResponse);
    } catch (exception) {
        return parser(rawResponse);
    }
}
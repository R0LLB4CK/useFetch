import { useState, useEffect, useCallback, useMemo } from 'react';
import _ from 'lodash';

import Enum from './utils/enum.js';
import { useResource } from './useResource.tsx';


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

    const { abortionSignal, abort } = useAbortRequest();
    const requestBody = JSON.stringify(data);

    const responsePromise = useMemo(() => fetch(url, {
        method: method.description,
        body: requestBody,
        signal: abortionSignal,
        headers: {
            'Content-Type': 'application/json',
        },
    }), [url, method, requestBody])

    const getResource = useCallback(async () => {
        try {
            const response = await responsePromise;
            if (!response.ok) {
                throw new Error(`server error: ${response.status} - ${response.statusText}`)
            }
            const typedResponse = await getTypedResponse(response, responseType);
            return getParsedResponse(typedResponse, parser);
        } catch (error) {
            if (isAbortError(error)) {
                return;
            }
            throw error;
        }
    }, [responsePromise, responseType, parser]);

    return useResource(getResource, abort);
}





export function useFetchOld(url, parser, responseType = ResponseTypes.JSON,
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
    }, [url, method, requestBody, responseType, abortionSignal])

    useEffect(() => {
        execute();
    }, [url, method, requestBody, responseType]);

    return {
        result: getParsedResponse(rawResponse),
        error,
        abort,
        execute: execute,
    };
}


function useAbortRequest() {
    const [controller, setController] = useState(new AbortController());
    const { signal: abortionSignal } = controller;
    abortionSignal.addEventListener('abort', () => setController(new AbortController()));

    useEffect(() => () => controller.abort(), [controller]);

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
    if (_.isEmpty(rawResponse) || !_.isFunction(parser)) {
        return rawResponse;
    }
    if (_.isArray(parser)) {
        return _.map(rawResponse, rawResponseItem => getParsedResponse(rawResponseItem, parser[0]));
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
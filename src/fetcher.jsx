import { useState, useEffect } from 'react';
import _ from 'lodash';

import Enum from './utils/enum.js';


export const HTTPMethods = new Enum('GET', 'POST');
export const ResponseTypes = new Enum('JSON', 'TEXT')

const RESPONSE_TYPE_TO_CONVERTER = {
    [ResponseTypes.JSON]: response => response.json(),
    [ResponseTypes.TEXT]: response => response.text(),
}

export function useFetch(url, parser, responseType = ResponseTypes.JSON, { method = HTTPMethods.GET, data } = {}) {
    const [rawResponse, setRawResponse] = useState(null);
    const [error, setError] = useState(null);
    const [abortRequest, setAbortRequest] = useState(_.noop);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        setAbortRequest(() => controller.abort.bind(controller));

        (async () => {
            try {
                const response = await fetch(url, {
                    method: method.description,
                    body: JSON.stringify(data),
                    signal,
                });
                const typedResponse = await getTypedResponse(response, responseType);
                setRawResponse(typedResponse);
                setError(response.ok ? null : new Error(`server error: ${response.status} - ${response.statusText}`));
            } catch (exception) {
                setError(exception); // TODO: dont do this in case of abortError caused by unmount (if it's caused by user - setError should still be called)
            }
        })();

        return () => {
            console.log('unmounting');
            controller.abort();
        };
    }, [url, parser, method, data, responseType]);

    return {
        result: getParsedResponse(rawResponse, parser),
        error,
        abort: abortRequest,
    };
}

async function getTypedResponse(response, responseType) {
    const converter = RESPONSE_TYPE_TO_CONVERTER[responseType] || RESPONSE_TYPE_TO_CONVERTER[ResponseTypes.TEXT];
    return converter(response);
}

function getParsedResponse(rawResponse, parser) {
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


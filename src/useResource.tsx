import { useState, useEffect, useCallback, useRef } from 'react';
import _ from 'lodash';


interface Resource<T> {
    result: T | null;
    execute: () => void;
    status: ResourceStatus;
    error: Error | null;
    abort?: () => void;
};

enum ResourceStatus {
    Pending,
    Sent,
    Success,
    Error,
    Aborted,
};

export function useResource<T>(getResource: () => Promise<T>, abort?: () => void): Resource<T> {
    const [result, setResult] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [status, setStatus] = useState<ResourceStatus>(ResourceStatus.Pending);
    const isAborted = useRef(false);

    const updateResult = useCallback(async () => {
        setStatus(ResourceStatus.Sent);
        try {
            const resource = await getResource();
            if (status == ResourceStatus.Aborted) {
                return;
            }
            setResult(resource);
            setStatus(ResourceStatus.Success);
        } catch (error) {
            setError(error);
            setStatus(ResourceStatus.Error);
        }
    }, [getResource])

    const _abort = useCallback(() => {
        setStatus(ResourceStatus.Aborted);
        isAborted.current = true;
        if (_.isFunction(abort)) {
            abort();
        }
    }, [abort]);

    useEffect(() => {
        updateResult();
        return _abort;
    }, [updateResult]);

    return { result, status, error, abort: _abort, execute: updateResult };
}
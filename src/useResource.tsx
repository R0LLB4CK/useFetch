import { useState, useEffect, useCallback, useRef } from 'react';


interface Resource<T> {
    result: T;
    execute: () => void;
    status: ResourceStatus;
    error: Error;
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
    const [result, setResult] = useState<T>(null);
    const [error, setError] = useState<Error>(null);
    const [status, setStatus] = useState<ResourceStatus>(ResourceStatus.Pending);
    const isAborted = useRef(false);

    const updateResult = useCallback(async () => {
        setStatus(ResourceStatus.Sent);
        console.log('after sent', ResourceStatus[status])
        try {
            const resource = await getResource();
            if (isAborted.current) {
                return;
            }
            setResult(resource);
            setStatus(ResourceStatus.Success);
            console.log('after success', ResourceStatus[status])
        } catch (error) {
            setError(error);
            setStatus(ResourceStatus.Error);
            console.log('after error', ResourceStatus[status])
        }
    }, [getResource])

    const _abort = useCallback(() => {
        setStatus(ResourceStatus.Aborted);
        // isAborted.current = true;
        console.log('after abort', ResourceStatus[status])
        abort();
    }, [abort]);

    useEffect(() => {
        updateResult();
        return _abort;
    }, [updateResult]);

    return { result, status, error, abort: _abort, execute: updateResult };
}
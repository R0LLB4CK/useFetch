import { useState, useEffect, useCallback } from 'react';


interface Resource<T> {
    result: T;
    execute: () => Promise<T>;
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

    const updateResult = useCallback(async () => {
        setStatus(ResourceStatus.Sent);
        try {
            const resource = await getResource();
            if (status === ResourceStatus.Aborted) {
                return;
            }
            setResult(resource);
            setStatus(ResourceStatus.Success);
        } catch (error) {
            setError(error);
            setStatus(ResourceStatus.Error);
        }
    }, [getResource])

    useEffect(() => {
        updateResult();
        return abort;
    }, [updateResult]);

    const _abort = useCallback(() => {
        setStatus(ResourceStatus.Aborted);
        abort();
    }, [abort]);

    return { result, status, error, abort: _abort, execute: getResource };
}
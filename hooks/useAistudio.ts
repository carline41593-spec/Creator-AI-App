import { useState, useEffect, useCallback } from 'react';

// This is a mock of the aistudio object that will be available in the runtime environment
// FIX: Using a named interface `AIStudio` to ensure type consistency for `window.aistudio` across global declarations.
// The previous use of an inline anonymous type caused a type mismatch with another declaration.

// FIX: To resolve type conflicts, the AIStudio interface is now defined within the global scope.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }

    interface Window {
        // FIX: Made aistudio optional to resolve a declaration conflict. The property's existence is checked at runtime, so it can be undefined.
        aistudio?: AIStudio;
    }
}

export const useAistudio = () => {
    const [hasKey, setHasKey] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkKey = useCallback(async () => {
        if (window.aistudio) {
            setIsLoading(true);
            const keyStatus = await window.aistudio.hasSelectedApiKey();
            setHasKey(keyStatus);
            setIsLoading(false);
        } else {
            // If aistudio is not available, assume we are in a dev environment
            // and a key is set via process.env
            console.warn("window.aistudio not found. Assuming dev environment.");
            setHasKey(!!process.env.API_KEY);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkKey();
    }, [checkKey]);

    const selectKey = useCallback(async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume success to avoid race condition and immediately update UI
            setHasKey(true); 
        } else {
            alert("API key selection is not available in this environment.");
        }
    }, []);

    const handleApiError = useCallback((error: any) => {
        if (error?.message?.includes('Requested entity was not found.')) {
            console.error("API Key error. Prompting user to re-select.");
            setHasKey(false);
        }
    }, []);

    return { hasKey, isLoading, selectKey, checkKey, handleApiError };
};
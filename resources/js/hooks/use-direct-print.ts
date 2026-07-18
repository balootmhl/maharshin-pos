import { useCallback, useRef } from 'react';

/**
 * Hook to print content from a URL directly using a hidden iframe.
 * Avoids opening new tabs/windows.
 */
export function useDirectPrint() {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const printUrl = useCallback((url: string) => {
        // Remove existing iframe if any
        if (iframeRef.current) {
            document.body.removeChild(iframeRef.current);
            iframeRef.current = null;
        }

        // Create new iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        // Some browsers won't print if display: none, so we use this trick
        iframe.src = url;

        // Append to body
        document.body.appendChild(iframe);
        iframeRef.current = iframe;

        // Print when loaded
        iframe.onload = () => {
            if (iframe.contentWindow) {
                iframe.contentWindow.print();

                // Optional: clean up after print dialog closes (though browser handling varies)
                // For now, we leave it or replace on next print to ensure print dialog isn't cut off
            }
        };
    }, []);

    return { printUrl };
}

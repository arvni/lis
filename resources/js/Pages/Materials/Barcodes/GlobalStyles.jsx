import { useEffect } from 'react';

// Define custom print styles globally
const GlobalStyles = () => {
    useEffect(() => {
        // Create a style element
        const style = document.createElement('style');
        style.innerHTML = `
      @page {
        margin: 0;
      }
      @media print {
        body {
          padding: 0;
          margin: 0;
        }
        .MuiGrid-container {
          display: block !important;
        }
        .MuiGrid-item {
          display: block !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          break-before: page;   /* or 'auto', 'avoid', etc. */
          break-after: page;
          break-inside: avoid;
        }
      }
    `;
        document.head.appendChild(style);

        // Clean up
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return null;
};

export default GlobalStyles;

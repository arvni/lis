import { useEffect } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

// Set the worker source
import workerSrc from 'pdfjs-dist/build/pdf.worker.js';

GlobalWorkerOptions.workerSrc = workerSrc;

const PdfViewer = ({url}) => {
    useEffect(() => {
        const loadPdf = async () => {
            try {
                const loadingTask = getDocument(url);
                const pdf = await loadingTask.promise;
                console.log('PDF loaded', pdf);
            } catch (error) {
                console.error('Error loading PDF:', error);
            }
        };

        loadPdf();
    }, [url]);

    return <div id="pdf-viewer">Your PDF Viewer Here</div>;
};

export default PdfViewer;

import { lazy, Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import LoadingComponent from './LoadingComponent';

// Lazy load all viewer components
const GenericFileViewer = lazy(() => import('@/Components/GenericFileViewer.jsx'));
const TextViewer = lazy(() => import('@/Components/TextViewer.jsx'));
const ExcelViewer = lazy(() => import('@/Components/ExcelViewer.jsx'));
const DOCXViewer = lazy(() => import('@/Components/DOCXViewer.jsx'));
const PDFViewer = lazy(() => import('@/Components/PDFViewer.jsx'));
const ImageViewer = lazy(() => import('@/Components/ImageViewer.jsx'));

const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
const TEXT_TYPES = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js'];

const LazyViewer = ({ children }) => (
    <ErrorBoundary>
        <Suspense fallback={<LoadingComponent />}>{children}</Suspense>
    </ErrorBoundary>
);

// Determine which viewer to use based on file extension
const ViewerContent = ({ ext, fileUrl, isFullScreen, fileName, fileSize, onDownload }) => {
    if (IMAGE_TYPES.includes(ext)) {
        return (
            <LazyViewer>
                <ImageViewer fileUrl={fileUrl} fullScreen={isFullScreen} />
            </LazyViewer>
        );
    }

    if (ext === 'pdf') {
        return (
            <LazyViewer>
                <PDFViewer fileUrl={fileUrl} fullScreen={isFullScreen} />
            </LazyViewer>
        );
    }

    if (['doc', 'docx'].includes(ext)) {
        return (
            <LazyViewer>
                <DOCXViewer fileUrl={fileUrl} fullScreen={isFullScreen} />
            </LazyViewer>
        );
    }

    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return (
            <LazyViewer>
                <ExcelViewer fileUrl={fileUrl} fullScreen={isFullScreen} />
            </LazyViewer>
        );
    }

    if (TEXT_TYPES.includes(ext)) {
        return (
            <LazyViewer>
                <TextViewer fileUrl={fileUrl} fullScreen={isFullScreen} />
            </LazyViewer>
        );
    }

    // Generic fallback for unsupported types
    return (
        <LazyViewer>
            <GenericFileViewer
                fileUrl={fileUrl}
                fileType={ext}
                fileName={fileName}
                fileSize={fileSize}
                onDownload={onDownload}
            />
        </LazyViewer>
    );
};

export default ViewerContent;

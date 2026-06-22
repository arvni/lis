// Resolve the public view URL for a document
export const getDocumentViewUrl = (document) =>
    route('documents.show', document.hash ?? document.id);

// Truncate a document's display name to a manageable length
export const formatDocumentName = (document) => {
    const name = document.originalName || document.file_name;
    const maxLength = 50;
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
};

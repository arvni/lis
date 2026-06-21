import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import FileUploadStep from './Components/FileUploadStep';
import ColumnMappingStep from './Components/ColumnMappingStep';
import TestSelectionStep from './Components/TestSelectionStep';
import AddTestModal from './Components/AddTestModal';

const Create = ({ success, error, patientFields }) => {
    const { data, setData, post, processing, errors } = useForm({
        file: null,
        has_header: true,
        column_mapping: {},
        default_values: {
            research: false,
            nationality: null,
            gender: '',
            tribe: '',
            wilayat: '',
            village: '',
            referrer: null,
        },
        tests: [],
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [step, setStep] = useState(1); // 1: upload, 2: mapping, 3: test selection
    const [selectedTests, setSelectedTests] = useState([]);
    const [testType, setTestType] = useState('');
    const [loadingTestDetails, setLoadingTestDetails] = useState(false);
    const [testModalOpen, setTestModalOpen] = useState(false);
    const [currentTest, setCurrentTest] = useState(null);
    const [currentMethod, setCurrentMethod] = useState(null);
    const [currentSampleType, setCurrentSampleType] = useState('');
    const [panelSampleTypes, setPanelSampleTypes] = useState({}); // For panel: {testMethodId: sampleTypeId}
    const [currentPrice, setCurrentPrice] = useState(0);
    const [modalStep, setModalStep] = useState(0); // 0: select test, 1: configure

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setData('file', file);
            setPreviewData(null);
            setStep(1);
        }
    };

    const readExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });

                    // Get first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert to array of arrays
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        defval: null,
                    });

                    resolve(jsonData);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (err) => reject(err);
            reader.readAsBinaryString(file);
        });
    };

    const handlePreview = async () => {
        if (!selectedFile) return;

        setLoadingPreview(true);

        try {
            const excelData = await readExcelFile(selectedFile);

            if (!excelData || excelData.length === 0) {
                alert('The Excel file is empty');
                setLoadingPreview(false);
                return;
            }

            let columns = [];
            let preview = [];
            let totalRows = 0;

            if (data.has_header) {
                // First row is headers
                columns = excelData[0] || [];
                // Get preview of first 5 rows (excluding header)
                preview = excelData.slice(1, 6);
                totalRows = excelData.length - 1;
            } else {
                // Generate column names (Column 1, Column 2, etc.)
                const columnCount = excelData[0]?.length || 0;
                for (let i = 0; i < columnCount; i++) {
                    columns.push(`Column ${i + 1}`);
                }
                // Get preview of first 5 rows
                preview = excelData.slice(0, 5);
                totalRows = excelData.length;
            }

            setPreviewData({
                columns,
                preview,
                totalRows,
            });

            // Initialize column mapping
            const initialMapping = {};
            columns.forEach((col, index) => {
                initialMapping[index] = '';
            });
            setData('column_mapping', initialMapping);
            setStep(2);
        } catch (err) {
            console.error('Error reading Excel file:', err);
            alert('Error reading Excel file: ' + err.message);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('import.store'), {
            forceFormData: true,
        });
    };

    const handleReset = () => {
        setSelectedFile(null);
        setData({
            file: null,
            has_header: true,
            column_mapping: {},
            default_values: {
                research: false,
                nationality: null,
                gender: '',
                tribe: '',
                wilayat: '',
                village: '',
                referrer: null,
            },
        });
        setPreviewData(null);
        setStep(1);
    };

    const handleCheckboxChange = (e) => {
        setData('has_header', e.target.checked);
        setPreviewData(null);
        setStep(1);
    };

    const handleMappingChange = (columnIndex, patientField) => {
        setData('column_mapping', {
            ...data.column_mapping,
            [columnIndex]: patientField,
        });
    };

    const handleDefaultValueChange = (field, value) => {
        setData('default_values', {
            ...data.default_values,
            [field]: value,
        });
    };

    const handleTestTypeChange = (e) => {
        setTestType(e.target.value);
        setCurrentTest(null);
        setCurrentMethod(null);
    };

    const handleOpenTestModal = () => {
        setTestModalOpen(true);
        setTestType('');
        setCurrentTest(null);
        setCurrentMethod(null);
        setCurrentSampleType('');
        setPanelSampleTypes({});
        setCurrentPrice(0);
        setModalStep(0);
    };

    const handleCloseTestModal = () => {
        setTestModalOpen(false);
        setTestType('');
        setCurrentTest(null);
        setCurrentMethod(null);
        setCurrentSampleType('');
        setPanelSampleTypes({});
        setCurrentPrice(0);
        setModalStep(0);
    };

    const fetchTestDetails = async (testId) => {
        setLoadingTestDetails(true);
        try {
            const params = data.default_values?.referrer?.id
                ? { referrer: { id: data.default_values.referrer.id } }
                : {};

            const response = await window.axios.get(route('api.tests.show', testId), { params });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching test details:', error);
            return null;
        } finally {
            setLoadingTestDetails(false);
        }
    };

    const handleTestSelect = async (e) => {
        const selected = e.target.value;
        if (!selected || !selected.id) return;

        const testDetails = await fetchTestDetails(selected.id);
        if (!testDetails) return;

        setCurrentTest(testDetails);

        // For panels, set default values
        if (testType === 'PANEL') {
            setCurrentMethod(null);
            setCurrentPrice(testDetails.price || 0);
        } else {
            // For TEST and SERVICE, set first method as default
            const methodTests = testDetails.method_tests || [];
            if (methodTests.length > 0) {
                setCurrentMethod(methodTests[0]);
                setCurrentPrice(methodTests[0].price || 0);
            } else {
                setCurrentMethod(null);
                setCurrentPrice(testDetails.price || 0);
            }
        }
    };

    const handleSelectModalMethod = (method) => {
        setCurrentMethod(method);
        setCurrentPrice(method.price || 0);
    };

    const handlePanelSampleTypeChange = (methodTestId, value) => {
        setPanelSampleTypes((prev) => ({
            ...prev,
            [methodTestId]: value,
        }));
    };

    const handleAddTestToList = () => {
        if (!currentTest) return;

        const newTest = {
            test: currentTest,
            method: currentMethod,
            type: testType,
            price: currentPrice,
            sampleType: currentSampleType || null,
            panelSampleTypes: testType === 'PANEL' ? panelSampleTypes : null,
        };

        setSelectedTests([...selectedTests, newTest]);
        setData('tests', [...data.tests, newTest]);

        // Close modal and reset
        handleCloseTestModal();
    };

    const handleMethodSelect = (testIndex, methodData) => {
        const updatedTests = [...selectedTests];
        updatedTests[testIndex] = {
            ...updatedTests[testIndex],
            method: methodData.method,
            price: methodData.price,
        };
        setSelectedTests(updatedTests);
        setData('tests', updatedTests);
    };

    const handleTestPriceChange = (index, price) => {
        const updatedTests = [...selectedTests];
        updatedTests[index] = {
            ...updatedTests[index],
            price,
        };
        setSelectedTests(updatedTests);
        setData('tests', updatedTests);
    };

    const handleRemoveTest = (index) => {
        const updated = selectedTests.filter((_, i) => i !== index);
        setSelectedTests(updated);
        setData('tests', updated);
    };

    return (
        <Box sx={{ position: 'relative' }}>
            <Head title="Import Excel File" />
            <PageHeader
                title="Import Excel File"
                subtitle="Upload and import patient data from Excel files"
                icon={<UploadFileIcon fontSize="large" sx={{ mr: 2 }} />}
            />

            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    p: 4,
                    maxWidth: step === 1 ? 800 : step === 3 ? 1000 : 1200,
                    mx: 'auto',
                    mt: 4,
                }}
            >
                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
                        {success}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <FileUploadStep
                            selectedFile={selectedFile}
                            loadingPreview={loadingPreview}
                            hasHeader={data.has_header}
                            errors={errors}
                            onFileChange={handleFileChange}
                            onReset={handleReset}
                            onPreview={handlePreview}
                            onCheckboxChange={handleCheckboxChange}
                        />
                    )}

                    {step === 2 && previewData && (
                        <ColumnMappingStep
                            previewData={previewData}
                            columnMapping={data.column_mapping}
                            defaultValues={data.default_values}
                            patientFields={patientFields}
                            errors={errors}
                            onMappingChange={handleMappingChange}
                            onDefaultValueChange={handleDefaultValueChange}
                            onBack={() => setStep(1)}
                            onNext={() => setStep(3)}
                        />
                    )}

                    {step === 3 && (
                        <TestSelectionStep
                            selectedTests={selectedTests}
                            processing={processing}
                            onOpenTestModal={handleOpenTestModal}
                            onRemoveTest={handleRemoveTest}
                            onPriceChange={handleTestPriceChange}
                            onMethodSelect={handleMethodSelect}
                            onBack={() => setStep(2)}
                        />
                    )}
                </form>

                {step === 1 && (
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" gutterBottom color="textSecondary">
                            Instructions:
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="div">
                            <ul style={{ paddingLeft: 20, margin: 0 }}>
                                <li>Select an Excel file (.xlsx, .xls) or CSV file</li>
                                <li>File size should not exceed 10MB</li>
                                <li>
                                    Check &quot;First row contains headers&quot; if your Excel has
                                    column headers
                                </li>
                                <li>
                                    Click &quot;Next&quot; to map Excel columns to patient fields
                                </li>
                            </ul>
                        </Typography>
                    </Box>
                )}
            </Paper>

            <AddTestModal
                open={testModalOpen}
                modalStep={modalStep}
                testType={testType}
                currentTest={currentTest}
                currentMethod={currentMethod}
                currentSampleType={currentSampleType}
                panelSampleTypes={panelSampleTypes}
                currentPrice={currentPrice}
                loadingTestDetails={loadingTestDetails}
                defaultReferrer={data.default_values?.referrer}
                onClose={handleCloseTestModal}
                onTestTypeChange={handleTestTypeChange}
                onTestSelect={handleTestSelect}
                onModalStepChange={setModalStep}
                onSelectMethod={handleSelectModalMethod}
                onSampleTypeChange={setCurrentSampleType}
                onPanelSampleTypeChange={handlePanelSampleTypeChange}
                onPriceChange={setCurrentPrice}
                onAddTest={handleAddTestToList}
            />
        </Box>
    );
};

const breadCrumbs = [
    {
        title: 'Dashboard',
        link: route('dashboard'),
        icon: null,
    },
    {
        title: 'Import',
        link: null,
        icon: <UploadFileIcon fontSize="small" />,
    },
];

Create.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Create;

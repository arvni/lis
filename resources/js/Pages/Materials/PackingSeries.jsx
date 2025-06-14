import {useCallback, useEffect, useMemo, useState} from "react";
import {GridActionsCellItem} from "@mui/x-data-grid";
import TableLayout from "@/Layouts/TableLayout";
import PageHeader from "@/Components/PageHeader.jsx";
import PrintIcon from "@mui/icons-material/Print";

const MaterialsPackingSeries = () => {
    // const {materials, status, errors, success, requestInputs} = usePage().props;
    const [materials, setMaterials] = useState({data: [], page: 1});
    const [requestInputs, setRequestInputs] = useState();

    useEffect(() => {
        handlePageReload()
    }, []);

    const handlePageReload = useCallback((page = 1, filters = [], sort = "id", pageSize = 10) => {
        let searchUrl = new URLSearchParams({
            page,
            filters,
            sort,
            pageSize
        });
        axios.get(route('materials.packing-series') + "?" + searchUrl.toString(), {}).then(({data}) => {
            setRequestInputs(data.requestInputs);
            setMaterials(data.materials)
        });
    }, []);

    // Memoize columns definition to prevent recreating on every render
    const columns = useMemo(() => [
        {
            field: 'sample_type_name',
            headerName: 'Kit Type',
            type: "string",
            width: 200,
            display: "flex",
            flex: 0.6,
        },
        {
            field: 'material_count',
            headerName: 'No. Materials',
            type: "number",
            display: "flex",
            flex: .4,
        },
        {
            field: 'packing_series',
            headerName: 'Packing Series',
            type: "string",
            width: 200,
            display: "flex",
            flex: 1,
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            type: "string",
            width: 200,
            flex: 0.4,
            display: "flex",
            renderCell: ({value}) => Intl.DateTimeFormat("en-US", {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
                .format(new Date(value)),
        },
        {
            field: 'id',
            headerName: 'Actions',
            type: 'actions',
            sortable: false,
            width: 50,
            getActions: (params) => {
                return [
                    <GridActionsCellItem
                        key={`print-${params.row.id}`}
                        icon={<PrintIcon/>}
                        label="Print"
                        href={route("materials.packing-series.print", params?.row?.packing_series)}
                        target="_blank"
                    />
                ];
            }
        }
    ], []);
    return (
        <>
            <PageHeader title="Materials Packing Series"/>
            <TableLayout
                defaultValues={requestInputs}
                reload={handlePageReload}
                columns={columns}
                data={materials}
                autoHeight
                density="comfortable"
                disableSelectionOnClick
                getRowHeight={() => 'auto'}
                sx={{
                    '& .MuiDataGrid-cell': {
                        py: 1.5
                    }
                }}
            />

        </>
    );
};

export default MaterialsPackingSeries;

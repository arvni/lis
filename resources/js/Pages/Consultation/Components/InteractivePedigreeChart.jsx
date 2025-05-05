import React, {useState, useEffect, useRef} from "react";
import PedigreeChart from "pedigree-chart";
import {Box} from "@mui/material";
import AddModal from "./AddModal"; // Adjust paths as needed
import ModifyModal from "./ModifyModal"; // Adjust paths as needed
import PedigreeMenu from "./PedigreeMenu"; // Adjust paths as needed

const InteractivePedigreeChart = ({onChange, defaultValue}) => {
    const [chart, setChart] = useState(undefined);
    const [lastPickedPedigree, setLastPickedPedigree] = useState(undefined);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({x: 0, y: 0});
    const [modalVisible, setModalVisible] = useState(false);
    const [modifyModalVisible, setModifyModalVisible] = useState(false);
    const chartRef = useRef(null); // Use useRef to access the canvas element

    useEffect(() => {
        if (!chartRef.current) return; // Ensure ref is attached

        const newChart = new PedigreeChart();
        newChart.setDiagram("interactive-chart"); // Pass the canvas element
        newChart.setConfig({
            width: 1000, // Or get from container
            height: 500, // Or get from container
            dragEnabled: true,
            panEnabled: true,
        });
        setChart(newChart);

        const unknown = newChart.create("unknown", 520, 160);
        unknown.setLabel([{value: "click to edit", order: 0}]);

        newChart.remove("pedigree-drag");
        newChart.remove("pedigree-click");
        newChart.remove("diagram-click");

        newChart.on("pedigree-drag", (pedigree) => {
            setMenuVisible(true);
            setMenuPosition({x: pedigree.getX(), y: pedigree.getY()});
        });
        newChart.on("pedigree-click", (pedigree) => {
            setMenuVisible(true);
            setLastPickedPedigree(pedigree);
            setMenuPosition({x: pedigree.getX(), y: pedigree.getY()});
        });
        newChart.on("diagram-click", () => {
            setMenuVisible(false);
        });
        // Cleanup
        return () => {
            // newChart.destroy(); // Important: clean up the chart instance
        };
    }, []); //  Run only once on mount

    // Function to handle changes within the pedigree chart
    const handleChartChange = () => {
        if (onChange) {
            //  Serialize the chart data into a format your `onChange` function expects
            const pedigreeData = serializeChartData(chart);
            onChange({target: {name: "pedigreeData", value: pedigreeData}});
        }
    };

    //  Helper function to serialize chart data (example - adapt to your needs)
    const serializeChartData = (chartInstance) => {
        const nodes = chartInstance.getNodes();
        const connections = chartInstance.getConnections();
        return {
            nodes: nodes.map(node => ({
                id: node.id,
                sex: node.getSex(),
                x: node.getX(),
                y: node.getY(),
                type: node.getType(), //  If you store type
                //  ... other relevant properties
            })),
            connections: connections.map(conn => ({
                from: conn.from.id,
                to: conn.to.id,
                type: conn.type,
            }))
        };
    };

    //  Attach event listeners to the chart instance to trigger handleChartChange when the chart changes
    if (chart) {

        chart.on('pedigree-added', handleChartChange);
        chart.on('pedigree-moved', handleChartChange);
        chart.on('pedigree-deleted', handleChartChange);
        chart.on('pedigree-connected', handleChartChange);
    }


    return (
        <Box sx={{position: "relative", height: "100%", width: "100%"}}>
            <canvas ref={chartRef} id="interactive-chart" style={{width: "100%", height: "500px"}}></canvas>
            {menuVisible && (
                <PedigreeMenu
                    x={menuPosition.x}
                    y={menuPosition.y}
                    chart={chart}
                    pedigree={lastPickedPedigree}
                    setMenuVisible={setMenuVisible}
                />
            )}
            {modalVisible && (
                <AddModal
                    pedigree={lastPickedPedigree}
                    setModalVisible={setModalVisible}
                    setMenuVisible={setMenuVisible}
                    chart={chart}
                />
            )}
            {modifyModalVisible && (
                <ModifyModal
                    pedigree={lastPickedPedigree}
                    setModifyModalVisible={setModifyModalVisible}
                    setMenuVisible={setMenuVisible}
                    chart={chart}
                />
            )}
        </Box>
    );
};

export default InteractivePedigreeChart;

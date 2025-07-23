import {useMemo} from "react";

const useTotalCalculations = (tests, panels) => {


    const testDiscount = useMemo(() =>
            tests.reduce((sum, item) => sum + (Number(item.discount) || 0), 0),
        [tests]
    );

    const panelDiscount = useMemo(() =>
            panels.reduce((sum, item) => sum + (Number(item.discount) || 0), 0),
        [panels]
    );

    const testPrice = useMemo(() =>
            tests.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
        [tests]
    );

    const panelPrice = useMemo(() =>
            panels.reduce((sum, item) => sum + (Number(item.panel.price) || 0), 0),
        [panels]
    );

    const totalDiscount = testDiscount + panelDiscount;
    const totalPrice = testPrice + panelPrice;
    console.log(totalDiscount, totalPrice,testPrice,testDiscount,panelPrice,panelDiscount,);
    const hasItems = panels.length > 0 || tests.length > 0;
    return {totalDiscount, totalPrice, hasItems}

}
export default useTotalCalculations;

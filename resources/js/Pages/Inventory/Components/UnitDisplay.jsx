/**
 * Renders stock quantity broken into largest units.
 * breakdown: [{unit: {name}, qty: number}, ...]
 */
const UnitDisplay = ({breakdown, totalBase, baseUnit}) => {
    if (!breakdown || breakdown.length === 0) {
        return <span>{Number(totalBase || 0).toFixed(2)} {baseUnit}</span>;
    }

    return (
        <span>
            {breakdown.map((part, i) => (
                <span key={i}>
                    {i > 0 && ', '}
                    {part.qty} {part.unit.name}
                </span>
            ))}
        </span>
    );
};

export default UnitDisplay;

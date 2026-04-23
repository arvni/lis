<?php

namespace App\Domains\Inventory\Imports;

use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\ItemUnitConversion;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Services\ItemCodeService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Validators\Failure;

class ItemsImport implements ToCollection, WithHeadingRow, SkipsOnFailure
{
    use SkipsFailures;

    public array $errors   = [];
    public int   $imported = 0;
    public int   $skipped  = 0;

    public function __construct(private ItemCodeService $itemCodeService) {}

    /**
     * Expected columns (heading row):
     * name, scientific_name, department, material_type, storage_condition,
     * default_unit, minimum_stock_level, maximum_stock_level, lead_time_days,
     * is_hazardous, requires_lot_tracking, notes,
     * extra_unit_1, conversion_1, extra_unit_2, conversion_2
     */
    public function collection(Collection $rows): void
    {
        foreach ($rows as $i => $row) {
            $name = trim($row['name'] ?? '');
            if (!$name) continue;

            try {
                $defaultUnitName = trim($row['default_unit'] ?? '');
                $unit = Unit::where('name', $defaultUnitName)
                    ->orWhere('abbreviation', $defaultUnitName)
                    ->first();

                if (!$unit) {
                    $this->errors[] = "Row " . ($i + 2) . ": unit '{$defaultUnitName}' not found — skipped '{$name}'.";
                    $this->skipped++;
                    continue;
                }

                $department   = strtoupper(trim($row['department']   ?? 'LAB'));
                $materialType = strtoupper(trim($row['material_type'] ?? 'OTH'));

                $item = Item::create([
                    'item_code'             => $this->itemCodeService->generate($department, $materialType),
                    'name'                  => $name,
                    'scientific_name'       => $row['scientific_name'] ?? null,
                    'department'            => $department,
                    'material_type'         => $materialType,
                    'storage_condition'     => strtoupper(trim($row['storage_condition'] ?? 'ROOM_TEMP')),
                    'default_unit_id'       => $unit->id,
                    'minimum_stock_level'   => (float) ($row['minimum_stock_level'] ?? 0),
                    'maximum_stock_level'   => $row['maximum_stock_level'] ? (float) $row['maximum_stock_level'] : null,
                    'lead_time_days'        => $row['lead_time_days']  ? (int) $row['lead_time_days']  : null,
                    'is_hazardous'          => $this->bool($row['is_hazardous'] ?? false),
                    'requires_lot_tracking' => $this->bool($row['requires_lot_tracking'] ?? true),
                    'notes'                 => $row['notes'] ?? null,
                    'is_active'             => true,
                ]);

                // Add unit conversions if provided
                foreach ([['extra_unit_1', 'conversion_1'], ['extra_unit_2', 'conversion_2']] as [$unitCol, $convCol]) {
                    $extraUnitName = trim($row[$unitCol] ?? '');
                    $conversion    = (float) ($row[$convCol] ?? 0);
                    if ($extraUnitName && $conversion > 0) {
                        $extraUnit = Unit::where('name', $extraUnitName)
                            ->orWhere('abbreviation', $extraUnitName)
                            ->first();
                        if ($extraUnit) {
                            ItemUnitConversion::firstOrCreate(
                                ['item_id' => $item->id, 'unit_id' => $extraUnit->id],
                                ['conversion_to_base' => $conversion]
                            );
                        }
                    }
                }

                $this->imported++;
            } catch (\Throwable $e) {
                $this->errors[] = "Row " . ($i + 2) . ": " . $e->getMessage();
                $this->skipped++;
            }
        }
    }

    private function bool(mixed $value): bool
    {
        if (is_bool($value)) return $value;
        return in_array(strtolower((string) $value), ['1', 'yes', 'true', 'y']);
    }
}

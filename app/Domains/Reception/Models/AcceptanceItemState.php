<?php

namespace App\Domains\Reception\Models;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Staudenmeir\EloquentHasManyDeep\HasManyDeep;
use Staudenmeir\EloquentHasManyDeep\HasRelationships;

class AcceptanceItemState extends Model
{
    use Searchable, HasRelationships;

    protected $fillable = [
        'acceptance_item_id',
        "section_id",
        "user_id",
        "finished_by_id",
        "started_by_id",
        "parameters",
        'status',
        "is_first_section",
        "details",
        "started_at",
        "finished_at",
        "order",
        "sample_id"
    ];

    protected $searchable = [
        "patients.fullName",
        "sample.barcode",
    ];

    protected $casts = [
        "parameters" => "json",
        "finished_at" => "datetime",
        "started_at" => "datetime",
        "status" => AcceptanceItemStateStatus::class
    ];


    public function acceptanceItem()
    {
        return $this->belongsTo(AcceptanceItem::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function sample(): BelongsTo
    {
        return $this->belongsTo(Sample::class);
    }

    public function finishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, "finished_by_id");
    }

    public function startedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, "started_by_id");
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function samples(): HasManyDeep
    {
        return $this->hasManyDeep(
            Sample::class,
            [
                AcceptanceItem::class,
                'acceptance_item_samples',
            ],
            [
                'id',                  // acceptance_items.id on AcceptanceItemState
                'acceptance_item_id', // on pivot
            ],
            [
                'acceptance_item_id', // on AcceptanceItemState
                'id',                 // samples.id
            ]
        );
    }

    public function patients(): HasManyDeep
    {
        return $this->hasManyDeep(
            Patient::class,
            [
                AcceptanceItem::class,
                'acceptance_item_patient',
            ],
            [
                'id',                  // acceptance_items.id on AcceptanceItemState
                'acceptance_item_id', // on pivot
            ],
            [
                'acceptance_item_id', // on AcceptanceItemState
                'id',                 // patients.id
            ]
        );
    }

}

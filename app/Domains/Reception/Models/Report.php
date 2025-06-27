<?php

namespace App\Domains\Reception\Models;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        "value",
        "reporter_id",
        "approver_id",
        "publisher_id",
        "acceptance_item_id",
        "report_template_id",
        "status",
        "comment",
        "clinical_comment",
        "published_at",
        "reported_at",
        "approved_at",
        "printed_at",
    ];

    protected $touches = [
        "acceptanceItem"
    ];

    protected $casts = [
        "status" => "boolean",
        "approved_at" => "datetime",
        "reported_at" => "datetime",
        "printed_at" => "datetime",
    ];

    protected $with = [
        "publishedDocument",
        "approvedDocument",
        "reportedDocument",
        "clinicalCommentDocument",
        "additionalFiles"
    ];

    public function acceptanceItem(): BelongsTo
    {
        return $this->belongsTo(AcceptanceItem::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, "reporter_id", "id");
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, "approver_id");
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, "publisher_id");
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'related');
    }

    public function additionalFiles(): MorphMany
    {
        return $this->morphMany(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::ADDITIONAL);
    }

    public function publishedDocument(): MorphOne
    {
        return $this->morphOne(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::PUBLISHED);
    }

    public function approvedDocument(): MorphOne
    {
        return $this->morphOne(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::APPROVED);
    }

    public function reportedDocument(): MorphOne
    {
        return $this->morphOne(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::REPORTED);
    }

    public function clinicalCommentDocument(): MorphOne
    {
        return $this->morphOne(Document::class, 'related')
            ->latest()
            ->where("tag", DocumentTag::CLINICAL_COMMENT);
    }

    public function signers(): HasMany
    {
        return $this->hasMany(Signer::class)
            ->with(["user:id,name,signature,title,stamp"]);
    }

    public function scopePublished($query)
    {
        return $query->whereNotNull("published_at");
    }

    public function parameters(): HasMany
    {
        return $this->hasMany(ReportParameter::class);
    }

    public function reportTemplate(): BelongsTo
    {
        return $this->belongsTo(ReportTemplate::class);
    }

    public function scopeNotApproved($query)
    {
        return $query->whereNull("approved_at")->whereNull("approver_id");
    }

    public function scopeIsActive($query)
    {
        return $query->where("status", true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->whereHas("acceptanceItem", function ($query) use ($search) {
            $query
                ->whereHas("samples", function ($query) use ($search) {
                    $query->search($search);
                })
                ->orWhereHas("patient", function ($query) use ($search) {
                    $query->search($search);
                })
                ->orWhereHas("test", function ($query) use ($search) {
                    $query->search($search);
                });
        });
    }
}

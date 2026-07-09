<?php

namespace App\Domains\Document\Models;

use App\Domains\Document\Adapters\UserAdapter;
use App\Domains\Document\Enums\DocumentTag;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property string $hash
 * @property string $ext
 * @property string|null $related_type
 * @property int|null $related_id
 * @property string|null $owner_type
 * @property int|null $owner_id
 * @property \App\Domains\Document\Enums\DocumentTag $tag
 * @property string|null $originalName
 * @property string|null $path
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
class Document extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'hash';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'hash',
        'ext',
        'related_type',
        'related_id',
        'owner_type',
        'owner_id',
        'tag',
        'originalName',
        'path',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
        "tag" => DocumentTag::class
    ];

    protected $appends = [
        'file_name',
        'address'
    ];

    /**
     * @param  Builder<Document>  $q
     * @return Builder<Document>
     */
    public function scopeAllowedTag(Builder $q): Builder
    {
        $user = auth()->user();
        $tags=[];
        if ($user)
            $tags = app(UserAdapter::class)->getAllowedDocumentTags($user);
        else
            $tags = DocumentTag::values();
        return $q->whereIn('tag', $tags);
    }


    public function getFileNameAttribute(): string
    {
        return $this->attributes['hash'] . '.' . $this->attributes['ext'];
    }

    public function getAddressAttribute(): string
    {
        $related = "";
        $relatedId = $this->attributes['owner_id'] . '/';
        if ($this->related_id) {
            $type = lcfirst(last(explode('\\', $this->attributes['related_type'])));
            if ($this->attributes['related_type'] == $this->attributes["owner_type"]) {
                $type = "";
                if ($this->attributes['related_id'] == $this->attributes["owner_id"])
                    $relatedId = "";
            }
            $related = $type . '/' . $relatedId;
        }
        return last(explode('\\', $this->attributes['owner_type'])) . 's/' .
            $this->attributes['owner_id'] . '/' . $related . $this->attributes['tag'];
    }


    /**
     * Get the related model (polymorphic).
     */
    public function related(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the owner model (polymorphic).
     */
    public function owner(): MorphTo
    {
        return $this->morphTo();
    }
}

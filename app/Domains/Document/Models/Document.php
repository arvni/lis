<?php

namespace App\Domains\Document\Models;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\User\Services\UserService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
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

    public function scopeAllowedTag($q)
    {
        $user = auth()->user();
        $tags=[];
        if ($user)
            $tags = UserService::getAllowedDocumentTags($user);
        else
            $tags = DocumentTag::values();
        return $q->whereIn('tag', $tags);
    }


    public function getFileNameAttribute()
    {
        return $this->attributes['hash'] . '.' . $this->attributes['ext'];
    }

    public function getAddressAttribute()
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

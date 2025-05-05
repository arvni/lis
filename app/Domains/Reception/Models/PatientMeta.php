<?php

namespace App\Domains\Reception\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientMeta extends Model
{
    use HasFactory;

    protected $fillable = [
        "maritalStatus",
        'company',
        "profession",
        "avatar",
        "address",
        "email",
        "details"
    ];

    public $timestamps=false;

    public function Patient()
    {
        return $this->belongsTo(Patient::class);
    }
}

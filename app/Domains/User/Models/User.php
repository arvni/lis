<?php

namespace App\Domains\User\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Models\Consultation;
use App\Traits\Searchable;
use Database\Factories\Domains\User\Models\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasPermissions;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasPermissions, HasRoles, Searchable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'mobile',
        'email_verified_at',
        'mobile_verified_at',
        'avatar',
        'signature',
        'title',
        'stamp',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'mobile_verified_at' => 'datetime',
        "is_active" => "boolean",
    ];

    public function consultations()
    {
        return $this->hasManyThrough(Consultation::class, Consultant::class);
    }

    public function consultant()
    {
        return $this->hasOne(Consultant::class);
    }
}

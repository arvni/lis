<?php

namespace App\Domains\Reception\Models;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Document\Models\Document;
use App\Domains\User\Models\User;
use App\Traits\Searchable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Staudenmeir\EloquentHasManyDeep\HasRelationships;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property-read int $consultations_count
 * @property-read int $invoices_count
 * @property-read int $payments_count
 * @property int $id
 * @property int $registrar_id
 * @property string $fullName
 * @property string|null $firstName
 * @property string|null $secondName
 * @property string|null $thirdName
 * @property string|null $lastName
 * @property string|null $tribe
 * @property string|null $idNo
 * @property string $nationality
 * @property string|null $wilayat
 * @property string|null $governorate
 * @property string|null $village
 * @property \Illuminate\Support\Carbon $dateOfBirth
 * @property string|null $gender
 * @property string|null $phone
 * @property string|null $avatar
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Patient extends Model
{
    use HasFactory, Notifiable, Searchable,HasRelationships;


    protected $fillable = [
        "fullName",
        "firstName",
        "secondName",
        "thirdName",
        "lastName",
        "idNo",
        "nationality",
        "dateOfBirth",
        "gender",
        "avatar",
        "phone",
        "tribe",
        "wilayat",
        "governorate",
        "village",
        "registrar_id"
    ];
    protected $casts = [
        "dateOfBirth" => "date:Y-m-d",
        "research" => "boolean",
    ];
    protected $appends = [
        "age",
        "name"
    ];

    /** @var list<string> */
    protected $searchable = [
        "fullName",
        "firstName",
        "secondName",
        "thirdName",
        "lastName",
        "idNo",
        "phone",
        "samples.barcode"
    ];

    protected static function booted(): void
    {
        // Keep fullName in sync with its structured parts on every save,
        // regardless of which entry point created/updated the patient.
        static::saving(function (Patient $patient) {
            self::deriveMissingNameParts($patient);

            $parts = array_filter([
                $patient->firstName,
                $patient->secondName,
                $patient->thirdName,
                $patient->lastName,
            ], fn($part) => filled($part));

            if ($parts) {
                $patient->fullName = implode(' ', $parts);
            }
        });
    }

    /**
     * When the second and third names are both empty but the last name carries
     * several words (e.g. firstName "Arvin", lastName "Eizadi Raeini"), treat the
     * last name as the family chain and split it: first leftover word becomes the
     * second name, any remaining middle words the third name, and the final word
     * the family/last name. With a single leftover word the third name mirrors the
     * second so all slots are populated ("Arvin Eizadi Eizadi Raeini").
     *
     * Only runs for Omani nationals, when both slots are empty and the last name
     * is actually being set, so non-Omani patients keep their last name intact and
     * re-saving a patient for unrelated edits never re-splits an existing name.
     */
    protected static function deriveMissingNameParts(Patient $patient): void
    {
        // Only Omani nationals carry a multi-part family chain that should be
        // split into second/third names; everyone else keeps lastName intact.
        if ($patient->nationality !== "OM") {
            return;
        }

        if (filled($patient->secondName) || filled($patient->thirdName)) {
            return;
        }

        if ($patient->exists && !$patient->isDirty('lastName')) {
            return;
        }

        $words = preg_split('/\s+/', trim((string) $patient->lastName), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (count($words) < 2) {
            return;
        }

        $lastName = array_pop($words);
        $secondName = array_shift($words);
        $thirdName = $words ? implode(' ', $words) : $secondName;

        $patient->secondName = $secondName;
        $patient->thirdName = $thirdName;
        $patient->lastName = $lastName;
    }

    public function getNameAttribute(): string
    {
        return (string) $this->attributes["fullName"];
    }

    public function getAgeAttribute(): string
    {
        $diff = Carbon::parse($this->dateOfBirth)->diff(Carbon::now());

        if ($diff->y >= 1) {
            return $diff->y . ' Y';
        } elseif ($diff->m >= 1) {
            return $diff->m . ' M';
        } else {
            return $diff->d . ' D';
        }
    }

    /** @return BelongsToMany<AcceptanceItem, $this> */
    public function acceptanceItems(): BelongsToMany
    {
        return $this->belongsToMany(AcceptanceItem::class, "acceptance_item_patient")
            ->withPivot("order");
    }

    /**
     * Route mail notifications to an address the notification supplies
     * (e.g. WelcomeNotification's per-acceptance email), else the default.
     */
    public function routeNotificationForMail(Notification $notification): string|array|null
    {
        if (method_exists($notification, "routeAddressForMail") && ($address = $notification->routeAddressForMail())) {
            return $address;
        }

        return $this->email ?? null;
    }

    public function acceptances()
    {
        // Use a pivot-free base so hasManyDeepFromRelations doesn't SELECT acceptance_item_patient.order,
        // which would make DISTINCT operate on the full row and let the same acceptance.id appear twice.
        $acceptanceItemsNoPivot = $this->belongsToMany(AcceptanceItem::class, "acceptance_item_patient");
        return $this->hasManyDeepFromRelations(
            $acceptanceItemsNoPivot,
            (new AcceptanceItem)->acceptance()
        )->distinct();
    }

    /** @return HasMany<Consultation, $this> */
    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    /** @return HasOne<Consultation, $this> */
    public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class)->latest();
    }

    /** @return HasOne<PatientMeta, $this> */
    public function patientMeta(): HasOne
    {
        return $this->hasOne(PatientMeta::class);
    }

    /** @return BelongsTo<User, $this> */
    public function registrar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrar_id', 'id');
    }

    /** @return BelongsToMany<Patient, $this> */
    public function patients(): BelongsToMany
    {
        return $this->belongsToMany(Patient::class, 'relatives', 'patient_id',"relative_id")
            ->withPivot("relationship", "id");
    }

    /** @return BelongsToMany<Patient, $this> */
    public function relatives(): BelongsToMany
    {
        return $this->belongsToMany(Patient::class, 'relatives', 'relative_id',"patient_id")
            ->withPivot("relationship", "id");
    }

    /** @return MorphMany<Invoice, $this> */
    public function invoices(): MorphMany
    {
        return $this->morphMany(Invoice::class, 'owner');
    }

    /** @return MorphMany<Payment, $this> */
    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payer');
    }

    /** @return MorphMany<Document, $this> */
    public function ownedDocuments(): MorphMany
    {
        return $this->morphMany(Document::class, "owner");
    }

    /** @return MorphMany<Document, $this> */
    public function relatedDocuments(): MorphMany
    {
        return $this->morphMany(Document::class, "related");
    }

    /** @return HasMany<Sample, $this> */
    public function samples(): HasMany
    {
        return $this->hasMany(Sample::class);
    }

    /**
     * @param  Builder<Patient>  $query
     * @return Builder<Patient>
     */
    public function scopeIsResearch(Builder $query, bool $isResearch): Builder
    {
        return $query->where("research", $isResearch);
    }
}

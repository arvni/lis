<?php

namespace App\Domains\Reception\Services;

use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\PatientMeta;
use App\Domains\Reception\Repositories\PatientRepository;
use App\Domains\Shared\Traits\LogsUserActivity;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Merges two patient records into one.
 *
 * The "keep" patient survives and absorbs every relation that pointed at the
 * "remove" patient; the "remove" patient is deleted afterwards. The caller may
 * also hand-pick which profile field values the surviving record should carry
 * (field-level merge), choosing per field whichever of the two patients holds
 * the better value.
 */
readonly class PatientMergeService
{
    use LogsUserActivity;

    /**
     * Tables that hold a plain `patient_id` foreign key. Each row pointing at the
     * removed patient is simply re-pointed at the kept patient.
     */
    private const DIRECT_FK_TABLES = [
        'acceptances',
        'consultations',
        'samples',
        'referrer_orders',
        'customers',
    ];

    /**
     * Polymorphic relations keyed by table => [typeColumn, idColumn]. The type
     * column stores the "patient" morph alias (see Relation::morphMap), but we
     * also re-point rows that stored the fully-qualified class name to be safe
     * against records created before the morph map existed.
     */
    private const MORPH_RELATIONS = [
        'invoices' => ['owner_type', 'owner_id'],
        'payments' => ['payer_type', 'payer_id'],
        'documents' => ['owner_type', 'owner_id'],
        'notifications' => ['notifiable_type', 'notifiable_id'],
        'whatsapp_messages' => ['messageable_type', 'messageable_id'],
    ];

    public function __construct(
        private PatientRepository $patientRepository,
    ) {
    }

    /**
     * @param  array<string, mixed>  $attributes      Final profile field values for the surviving record.
     * @param  array<string, mixed>  $metaAttributes  Final patient_meta field values for the surviving record.
     */
    public function merge(Patient $keep, Patient $remove, array $attributes = [], array $metaAttributes = []): Patient
    {
        if ($keep->id === $remove->id) {
            throw new InvalidArgumentException('Cannot merge a patient into itself.');
        }

        return DB::transaction(function () use ($keep, $remove, $attributes, $metaAttributes) {
            $this->applyChosenAttributes($keep, $attributes);

            $this->transferDirectForeignKeys($keep, $remove);
            $this->transferAcceptanceItems($keep, $remove);
            $this->transferPatientMeta($keep, $remove, $metaAttributes);
            $this->transferRelatives($keep, $remove);
            $this->transferMorphRelations($keep, $remove);

            $this->logUpdated($keep);
            $this->patientRepository->deletePatient($remove);

            return $keep->refresh();
        });
    }

    /**
     * Overwrite the surviving record with the hand-picked field values. Only
     * fillable profile fields are honoured; anything else is ignored.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function applyChosenAttributes(Patient $keep, array $attributes): void
    {
        $allowed = array_intersect_key($attributes, array_flip($keep->getFillable()));

        if ($allowed) {
            $this->patientRepository->updatePatient($keep, $allowed);
        }
    }

    private function transferDirectForeignKeys(Patient $keep, Patient $remove): void
    {
        foreach (self::DIRECT_FK_TABLES as $table) {
            DB::table($table)
                ->where('patient_id', $remove->id)
                ->update(['patient_id' => $keep->id]);
        }
    }

    /**
     * The acceptance_item_patient pivot has no surrogate key and a row is unique
     * per (acceptance_item_id, patient_id). Re-point the removed patient's rows,
     * but first drop any that would collide with a row the kept patient already
     * owns so the same item is never linked twice.
     */
    private function transferAcceptanceItems(Patient $keep, Patient $remove): void
    {
        $keepItemIds = DB::table('acceptance_item_patient')
            ->where('patient_id', $keep->id)
            ->pluck('acceptance_item_id');

        DB::table('acceptance_item_patient')
            ->where('patient_id', $remove->id)
            ->whereIn('acceptance_item_id', $keepItemIds)
            ->delete();

        DB::table('acceptance_item_patient')
            ->where('patient_id', $remove->id)
            ->update(['patient_id' => $keep->id]);
    }

    /**
     * patient_metas is a one-to-one (unique patient_id). The kept patient's row
     * is the baseline: if it has none but the removed patient does, adopt that
     * row wholesale so non-selectable fields (e.g. avatar) are preserved. The
     * hand-picked meta field values are then applied on top, and any meta still
     * tied to the removed patient is dropped.
     *
     * @param  array<string, mixed>  $metaAttributes
     */
    private function transferPatientMeta(Patient $keep, Patient $remove, array $metaAttributes): void
    {
        $keepMeta = PatientMeta::where('patient_id', $keep->id)->first();
        $removeMeta = PatientMeta::where('patient_id', $remove->id)->first();

        if (!$keepMeta && $removeMeta) {
            $removeMeta->patient_id = $keep->id;
            $removeMeta->save();
            $keepMeta = $removeMeta;
            $removeMeta = null;
        }

        $allowed = array_intersect_key($metaAttributes, array_flip((new PatientMeta)->getFillable()));
        if ($allowed) {
            if (!$keepMeta) {
                $keepMeta = new PatientMeta();
                $keepMeta->patient_id = $keep->id;
            }
            $keepMeta->fill($allowed)->save();
        }

        if ($removeMeta) {
            $removeMeta->delete();
        }
    }

    /**
     * The self-referential relatives pivot stores the patient on both sides
     * (patient_id and relative_id). Re-point both columns, then strip rows that
     * became self-references (patient == relative) or duplicates of a link the
     * kept patient already had.
     */
    private function transferRelatives(Patient $keep, Patient $remove): void
    {
        DB::table('relatives')->where('patient_id', $remove->id)->update(['patient_id' => $keep->id]);
        DB::table('relatives')->where('relative_id', $remove->id)->update(['relative_id' => $keep->id]);

        DB::table('relatives')->whereColumn('patient_id', 'relative_id')->delete();

        $seen = [];
        DB::table('relatives')
            ->where('patient_id', $keep->id)
            ->orWhere('relative_id', $keep->id)
            ->orderBy('id')
            ->get()
            ->each(function ($row) use (&$seen) {
                $key = $row->patient_id . ':' . $row->relative_id;
                if (isset($seen[$key])) {
                    DB::table('relatives')->where('id', $row->id)->delete();

                    return;
                }
                $seen[$key] = true;
            });
    }

    private function transferMorphRelations(Patient $keep, Patient $remove): void
    {
        $alias = $remove->getMorphClass();
        $types = array_unique([$alias, Patient::class]);

        foreach (self::MORPH_RELATIONS as $table => [$typeColumn, $idColumn]) {
            DB::table($table)
                ->where($idColumn, $remove->id)
                ->whereIn($typeColumn, $types)
                ->update([$idColumn => $keep->id]);
        }

        // documents carries a second "related" morph alongside its "owner" morph.
        DB::table('documents')
            ->where('related_id', $remove->id)
            ->whereIn('related_type', $types)
            ->update(['related_id' => $keep->id]);
    }
}

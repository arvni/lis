<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discount_cards', function (Blueprint $table) {
            // Kept as a record of what was minted, not as a guard: it is not
            // printed, not encoded in the QR and never asked for at reception, so
            // nothing can check a number against it.
            $table->char('check_character', 1)->nullable()->after('number');
        });

        // Cards already minted from a template carry the check character as a
        // trailing "-X" inside their number. Split it back out so every templated
        // card is stored the same way.
        //
        // Deliberately narrow: only batches that used a template, and only a
        // single-character tail. Legacy numbers end in a five-digit serial
        // (…-00001) and must not be touched.
        $templated = DB::table('discount_cards AS c')
            ->join('discount_card_batches AS b', 'b.id', '=', 'c.discount_card_batch_id')
            ->whereNotNull('b.number_template')
            ->where('c.number', 'LIKE', '%-_')
            ->select('c.id', 'c.number')
            ->get();

        foreach ($templated as $card) {
            DB::table('discount_cards')->where('id', $card->id)->update([
                'number' => substr($card->number, 0, -2),
                'check_character' => substr($card->number, -1),
            ]);
        }
    }

    public function down(): void
    {
        // Put the character back on the end of the number it came from.
        $split = DB::table('discount_cards')->whereNotNull('check_character')->get(['id', 'number', 'check_character']);

        foreach ($split as $card) {
            DB::table('discount_cards')->where('id', $card->id)->update([
                'number' => $card->number.'-'.$card->check_character,
            ]);
        }

        Schema::table('discount_cards', function (Blueprint $table) {
            $table->dropColumn('check_character');
        });
    }
};

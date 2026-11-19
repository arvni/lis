<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Reception\Traits\ValidatesReportDelivery;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * "How to Notify" offers Print, SMS and WhatsApp with no receiver fields. SMS alone used to be
 * rejected (only print/email/whatsapp keys counted, and by presence not by being ticked), and
 * Print/WhatsApp demanded a receiver/number the form never shows.
 */
class ReportDeliveryValidationTest extends TestCase
{
    /** @return array<string, array{0: array<string, mixed>}> */
    public static function accepted(): array
    {
        return [
            'SMS alone' => [['sms' => true]],
            'print without a receiver name' => [['print' => true]],
            'WhatsApp without a separate number' => [['whatsapp' => true]],
            'WhatsApp with a number' => [['whatsapp' => true, 'whatsappNumber' => '+968 9123 4567']],
        ];
    }

    /** @param array<string, mixed> $howReport */
    #[DataProvider('accepted')]
    public function test_a_ticked_method_is_enough(array $howReport): void
    {
        $this->assertTrue($this->validate(['referred' => false, 'howReport' => $howReport])->passes());
    }

    public function test_nothing_ticked_is_rejected(): void
    {
        $validator = $this->validate(['referred' => false, 'howReport' => ['print' => false, 'sms' => false]]);

        $this->assertTrue($validator->fails());
        $this->assertSame('Please select at least one report delivery method.', $validator->errors()->first('howReport'));
    }

    public function test_a_referred_acceptance_needs_no_method(): void
    {
        $this->assertTrue($this->validate(['referred' => true, 'howReport' => []])->passes());
    }

    public function test_a_bad_whatsapp_number_is_still_rejected(): void
    {
        $validator = $this->validate(['referred' => false, 'howReport' => ['whatsapp' => true, 'whatsappNumber' => 'call me']]);

        $this->assertTrue($validator->errors()->has('howReport.whatsappNumber'));
    }

    /** @param array<string, mixed> $data */
    private function validate(array $data): \Illuminate\Validation\Validator
    {
        $request = new class extends FormRequest
        {
            use ValidatesReportDelivery;

            /** @return array<string, mixed> */
            public function rules(): array
            {
                return $this->reportDeliveryRules(['required_if:referred,false']);
            }
        };
        $request->merge($data);

        return Validator::make($data, $request->rules());
    }
}

<?php

declare(strict_types=1);

namespace App\Domains\Reception\Traits;

/**
 * Validation for an acceptance's "How to Notify" choices (howReport), shared by the store and
 * update requests.
 *
 * Reception offers Print, SMS and WhatsApp with no receiver fields: SMS and WhatsApp go to the
 * patient's phone unless a whatsappNumber is given, and the print receiver is optional.
 */
trait ValidatesReportDelivery
{
    /** Ticked delivery methods that count as "at least one". */
    private const REPORT_DELIVERY_METHODS = ['print', 'sms', 'whatsapp', 'email'];

    /**
     * @param  array<int, mixed>  $presence  rules deciding whether howReport is needed at all
     * @return array<string, mixed>
     */
    protected function reportDeliveryRules(array $presence): array
    {
        return [
            'howReport' => [
                ...$presence,
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($this->input('referred') === false && ! self::hasReportDeliveryMethod($value)) {
                        $fail('Please select at least one report delivery method.');
                    }
                },
            ],
            'howReport.print' => 'boolean',
            'howReport.printReceiver' => ['nullable', 'string', 'max:255'],
            'howReport.sms' => 'boolean',
            'howReport.email' => 'boolean',
            'howReport.emailAddress' => [
                'required_if:howReport.email,true',
                'email:rfc,dns',
                'max:255',
            ],
            'howReport.whatsapp' => 'boolean',
            'howReport.whatsappNumber' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[+\d\s\-()]{7,20}$/',
            ],
            'howReport.sendToReferrer' => [
                'boolean',
                'nullable',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === true && $this->input('referred') === false) {
                        $fail('Cannot send to referrer when not referred.');
                    }
                },
            ],
        ];
    }

    /** A method counts only when ticked: {print: false} is not a choice. */
    public static function hasReportDeliveryMethod(mixed $howReport): bool
    {
        if (! is_array($howReport)) {
            return false;
        }
        foreach (self::REPORT_DELIVERY_METHODS as $method) {
            if (filter_var($howReport[$method] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                return true;
            }
        }

        return false;
    }
}

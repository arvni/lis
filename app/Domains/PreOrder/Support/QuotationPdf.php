<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\PreOrder\Enums\FinanceReason;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;

/**
 * Renders a quotation as a PDF for the center. Built only from our own escaped values: no
 * remote resources and no stream wrappers are allowed, so a name or note can never make mPDF
 * fetch or read anything.
 */
class QuotationPdf
{
    public const CURRENCY = 'OMR';

    /** @return InspectedUpload a temp file the caller stores and then discards */
    public function render(PreOrder $preOrder, PreOrderQuotation $quotation): InspectedUpload
    {
        $tempDir = storage_path('framework/cache/mpdf');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0775, true);
        }

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'tempDir' => $tempDir,
            'default_font' => 'dejavusans',
            // Patient and center names may be Arabic: pick the script and direction per run of text.
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            'whitelistStreamWrappers' => [],
            'curlFollowLocation' => false,
        ]);
        $mpdf->SetTitle("Quotation {$quotation->number}");
        $mpdf->SetAuthor((string) config('app.name'));
        $mpdf->showImageErrors = false;
        $mpdf->WriteHTML($this->html($preOrder, $quotation));

        $path = (string) tempnam(sys_get_temp_dir(), 'quote');
        $mpdf->Output($path, Destination::FILE);

        return new InspectedUpload($path, 'pdf', 'application/pdf');
    }

    /** The page mPDF renders; every value in it is escaped. */
    public function html(PreOrder $preOrder, PreOrderQuotation $quotation): string
    {
        $e = fn (mixed $v): string => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $patients = collect($preOrder->patients)->keyBy('ref');
        $name = fn (?string $ref): string => $e($patients->get((string) $ref)['fullName'] ?? '—');
        $money = fn (mixed $v): string => $e(number_format((float) $v, 3)).' '.self::CURRENCY;
        $reasons = implode(', ', array_map(fn (string $r) => FinanceReason::tryFrom($r)?->label() ?? $r, $quotation->reasons));

        $rows = $quotation->items->map(fn (PreOrderItem $i) => '<tr>'
            .'<td>'.$e($i->test->name).' <span class="muted">'.$e($i->test->code).'</span></td>'
            .'<td>'.$name($i->patient_ref).'</td>'
            .'<td class="num">'.$e($i->qty).'</td>'
            .'<td class="num">'.$money($i->unit_price).'</td>'
            .'<td class="num">'.$money($i->lineTotal()).'</td>'
            .'</tr>')->implode('');

        $discount = bccomp((string) $quotation->discount, '0', 3) > 0
            ? '<tr><td colspan="4" class="num">Discount</td><td class="num">−'.$money($quotation->discount).'</td></tr>'
            : '';
        $note = $quotation->reason ? '<p class="note">'.nl2br($e($quotation->reason)).'</p>' : '';

        return <<<HTML
        <style>
            body { font-size: 10pt; color: #222; }
            h1 { font-size: 16pt; margin: 0 0 4pt; }
            .muted { color: #777; font-size: 8.5pt; }
            table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
            th, td { border-bottom: 0.5pt solid #ccc; padding: 4pt; text-align: left; }
            th { background: #f2f2f2; }
            .num { text-align: right; }
            .total td { font-weight: bold; border-bottom: none; }
            .meta td { border: none; padding: 1pt 4pt 1pt 0; }
            .note { margin-top: 10pt; }
        </style>
        <h1>Quotation {$e($quotation->number)}</h1>
        <table class="meta">
            <tr><td>Center</td><td>{$e($preOrder->referrer?->fullName)}</td><td>Pre-order</td><td>{$e($preOrder->code)}</td></tr>
            <tr><td>Patient</td><td>{$name($preOrder->main_patient_ref)}</td><td>Date</td><td>{$e($quotation->created_at?->format('Y-m-d'))}</td></tr>
            <tr><td>Reason</td><td>{$e($reasons)}</td><td>Valid until</td><td>{$e($quotation->expires_at?->format('Y-m-d'))}</td></tr>
        </table>
        {$note}
        <table>
            <thead><tr><th>Test</th><th>Patient</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Total</th></tr></thead>
            <tbody>
                {$rows}
                <tr><td colspan="4" class="num">Subtotal</td><td class="num">{$money($quotation->subtotal)}</td></tr>
                {$discount}
                <tr class="total"><td colspan="4" class="num">Total</td><td class="num">{$money($quotation->total)}</td></tr>
            </tbody>
        </table>
        <p class="muted">Prices are from the BION catalogue for this center. Approve, partly approve or reject this quotation in the provider portal.</p>
        HTML;
    }
}

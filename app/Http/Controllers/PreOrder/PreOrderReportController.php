<?php

declare(strict_types=1);

namespace App\Http\Controllers\PreOrder;

use App\Domains\PreOrder\Exports\PreOrderReportExport;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Services\PreOrderReportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PreOrderReportController extends Controller
{
    public function __construct(private readonly PreOrderReportService $reports) {}

    public function index(Request $request): Response
    {
        $this->authorize('reports', PreOrder::class);
        [$from, $to] = $this->period($request);

        return Inertia::render('PreOrder/Reports', [
            'reports' => $this->reports->all($from, $to),
            'titles' => PreOrderReportExport::TITLES,
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $this->authorize('reports', PreOrder::class);
        [$from, $to] = $this->period($request);

        return Excel::download(new PreOrderReportExport($this->reports->all($from, $to)), "pre-orders-{$from->toDateString()}-{$to->toDateString()}.xlsx");
    }

    /** The last 90 days unless asked otherwise. @return array{0: Carbon, 1: Carbon} */
    private function period(Request $request): array
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);
        $to = isset($data['to']) ? Carbon::parse($data['to'])->endOfDay() : now()->endOfDay();
        $from = isset($data['from']) ? Carbon::parse($data['from'])->startOfDay() : $to->copy()->subDays(90)->startOfDay();

        return [$from, $to];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\Models\AttendanceTransaction;
use App\Domains\Attendance\Requests\ImportAttendanceTransactionsRequest;
use App\Domains\Attendance\Resources\AttendanceTransactionResource;
use App\Domains\Attendance\Services\AttendanceTransactionImportService;
use App\Domains\Attendance\Services\AttendanceTransactionService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AttendanceTransactionController extends Controller
{
    public function __construct(
        private readonly AttendanceTransactionService $transactionService,
        private readonly AttendanceTransactionImportService $importService,
    ) {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', AttendanceTransaction::class);
        $requestInputs = $request->all();

        $transactions = $this->transactionService->listTransactions($requestInputs);
        $users = $this->transactionService->usersFor($transactions->items());
        // Keep the paginator's top-level `total`/`current_page`, which TableLayout reads.
        $rows = $transactions->through(fn (AttendanceTransaction $transaction) => (new AttendanceTransactionResource(
            $transaction,
            $users[$transaction->attendance_id] ?? null,
        ))->resolve($request));

        return Inertia::render('Attendance/Transactions/Index', [
            'transactions' => $rows,
            'requestInputs' => $requestInputs,
        ]);
    }

    public function import(ImportAttendanceTransactionsRequest $request): RedirectResponse
    {
        /** @var UploadedFile $file */
        $file = $request->file('file');

        try {
            $result = $this->importService->import($file, (int) $request->user()?->id);
        } catch (RuntimeException $e) {
            return back()->withErrors(['file' => $e->getMessage()]);
        }

        return back()->with([
            'success' => $result->errors === [],
            'status' => $result->summary(),
            'import_errors' => $result->errors,
        ]);
    }
}

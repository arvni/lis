<?php

declare(strict_types=1);

namespace App\Http\Controllers\Attendance;

use App\Domains\Attendance\Models\AttendanceTransaction;
use App\Domains\Attendance\Resources\AttendanceTransactionResource;
use App\Domains\Attendance\Services\AttendanceTransactionService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceTransactionController extends Controller
{
    public function __construct(private readonly AttendanceTransactionService $transactionService)
    {
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
}

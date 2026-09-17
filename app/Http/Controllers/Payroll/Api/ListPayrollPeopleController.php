<?php

declare(strict_types=1);

namespace App\Http\Controllers\Payroll\Api;

use App\Domains\Payroll\Adapters\UserAdapter;
use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * The person picker behind the contract form and the salary slip page.
 */
class ListPayrollPeopleController extends Controller
{
    public function __construct(private readonly UserAdapter $userAdapter) {}

    public function __invoke(Request $request): JsonResponse
    {
        // Salaries are confidential, so the picker is only offered to people who can already see
        // contracts or work on slips.
        if (! Gate::allows('viewAny', EmploymentContract::class) && ! Gate::allows('create', SalarySlip::class)) {
            abort(403);
        }

        $search = $request->query('search');

        return response()->json([
            'data' => $this->userAdapter->searchActiveUsers(is_string($search) ? $search : null)
                ->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])
                ->values(),
        ]);
    }
}

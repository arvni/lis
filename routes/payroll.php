<?php

use App\Http\Controllers\Payroll\Api\ListPayrollPeopleController;
use App\Http\Controllers\Payroll\EmploymentContractController;
use App\Http\Controllers\Payroll\PayrollItemController;
use App\Http\Controllers\Payroll\PayrollItemTypeController;
use App\Http\Controllers\Payroll\SalarySlipController;
use Illuminate\Support\Facades\Route;

Route::prefix('payroll')->name('payroll.')->group(function () {
    // Contracts carry nested entitlement and allowance rows, so they get full pages rather than
    // the dialog the smaller settings screens use.
    Route::resource('contracts', EmploymentContractController::class)->except('show');
    Route::resource('item-types', PayrollItemTypeController::class)->except('create', 'edit', 'show');
    // A person's own allowances and deductions — not a contract's.
    Route::resource('staff-allowances', PayrollItemController::class)->except('create', 'edit', 'show');
    // Slips are drafted under permission, edited, then issued to the person they belong to.
    Route::get('salary-slips', [SalarySlipController::class, 'index'])->name('salary-slips.index');
    Route::post('salary-slips', [SalarySlipController::class, 'store'])->name('salary-slips.store');
    Route::get('salary-slips/{salarySlip}', [SalarySlipController::class, 'show'])->name('salary-slips.show');
    Route::put('salary-slips/{salarySlip}', [SalarySlipController::class, 'update'])->name('salary-slips.update');
    Route::put('salary-slips/{salarySlip}/issue', [SalarySlipController::class, 'issue'])->name('salary-slips.issue');
    Route::delete('salary-slips/{salarySlip}', [SalarySlipController::class, 'destroy'])->name('salary-slips.destroy');
});

Route::prefix('api/payroll')->name('api.payroll.')->group(function () {
    Route::get('people', ListPayrollPeopleController::class)->name('people.list');
});

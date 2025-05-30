<?php

use App\Domains\Laboratory\Enums\TestType;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});


Route::get("/seeder", [\App\Http\Controllers\Laboratory\TestController::class,"test"]);
//    function () {

//    /*Section and Workflow*/
//
//    DB::connection('old_mysql') // source DB
//    ->table('section_groups')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('section_groups')->where("name", "=", $row->name)->exists()) {
//                    continue;
//                }
//                DB::connection('mysql')
//                    ->table('section_groups')
//                    ->insert([
//                        "id" => $row->id,
//                        "section_group_id" => $row->section_group_id,
//                        "name" => $row->name,
//                        "icon" => null,
//                        "active" => $row->active,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('sections')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//
//                if (DB::connection('mysql')
//                    ->table('sections')->where("name", "=", $row->name)
//                    ->where("section_group_id", "=", $row->section_group_id)->exists()) {
//                    continue;
//                }
//
//                DB::connection('mysql') // destination DB
//                ->table('sections')
//                    ->insert([
//                        "id" => $row->id,
//                        "section_group_id" => $row->section_group_id,
//                        "name" => $row->name,
//                        "icon" => null,
//                        "active" => true,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('workflows')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('workflows')->where("name", "=", $row->name)->exists()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('workflows')
//                    ->insert([
//                        "id" => $row->id,
//                        "name" => $row->name,
//                        "description" => $row->description,
//                        "status" => $row->status,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('section_workflow')
//        ->orderBy('workflow_id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//
//                if (DB::connection('mysql')
//                    ->table('section_workflows')
//                    ->where("section_id", "=", $row->section_id)
//                    ->where("workflow_id", "=", $row->workflow_id)
//                    ->where("order", "=", $row->order)
//                    ->exists()) {
//                    continue;
//                }
//
//                DB::connection('mysql') // destination DB
//                ->table('section_workflows')
//                    ->insert([
//                        "id" => $row->id,
//                        "section_id" => $row->section_id,
//                        "workflow_id" => $row->workflow_id,
//                        "parameters" => $row->parameters,
//                        "order" => $row->order,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//
//    /* Sample Type*/
//
//    DB::connection('old_mysql') // source DB
//    ->table('sample_types')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('sample_types')
//                    ->where("name", "=", $row->name)->exists()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('sample_types')
//                    ->insert([
//                        "id" => $row->id,
//                        "name" => $row->name,
//                        "description" => $row->description,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('report_templates')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//
//                if (DB::connection('mysql')
//                    ->table('report_templates')
//                    ->where("name", "=", $row->name)->exists()) {
//                    continue;
//                }
//
//                DB::connection('mysql') // destination DB
//                ->table('report_templates')
//                    ->insert([
//                        "id" => $row->id,
//                        "name" => $row->name,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('test_groups')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('test_groups')
//                    ->where("name", "=", $row->name)->exists()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('test_groups')
//                    ->insert([
//                        "id" => $row->id,
//                        "name" => $row->name,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('barcode_groups')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('barcode_groups')
//                    ->where("name", "=", $row->name)->exists()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('barcode_groups')
//                    ->insert([
//                        "id" => $row->id,
//                        "name" => $row->name,
//                        "abbr" => $row->abbr,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('tests')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('tests')
//                    ->where("code", "=", $row->code)
////                    ->where("type", "=", TestType::from($row->type)->name)
//                    ->count()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('tests')
//                    ->insert([
//                        "id" => $row->id,
//                        "name" => $row->name,
//                        "code" => $row->code,
//                        "fullName" => $row->fullName,
//                        "description" => $row->description,
//                        "test_group_id" => $row->test_group_id,
//                        "report_template_id" => $row->report_template_id,
//                        "type" => TestType::from($row->type)->name,
//                        "status" => $row->status,
//                        "price" => null,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('methods')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('methods')
//                    ->where("name", $row->name)
//                    ->exists()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('methods')
//                    ->insert([
//                        "id" => $row->id,
//                        "workflow_id" => $row->workflow_id,
//                        "barcode_group_id" => $row->barcode_group_id,
//                        "name" => $row->name,
//                        "turnaround_time" => $row->turnaround_time,
//                        "price_type" => $row->price_type,
//                        "requirements" => $row->requirements,
//                        "status" => true,
//                        "extra" => $row->extra,
//                        "no_patient" => 1,
//                        "price" => $row->price,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//                if (DB::connection('mysql')
//                    ->table('method_tests')
//                    ->where("method_id", $row->id)
//                    ->where("test_id", $row->test_id)
//                    ->exists()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('method_tests')
//                    ->insert([
//                        "method_id" => $row->id,
//                        "test_id" => $row->test_id,
//                        "is_default" => true,
//                        "status" => $row->status,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//
//    DB::connection('old_mysql') // source DB
//    ->table('sample_type_test')
//        ->orderBy('test_id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('sample_type_tests')
//                    ->where("sample_type_id", "=", $row->sample_type_id)
//                    ->where("test_id", "=", $row->test_id)
//                    ->count()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('sample_type_tests')
//                    ->insert([
//                        "test_id" => $row->test_id,
//                        "sample_type_id" => $row->sample_type_id,
//                        "description" => $row->description,
//                        "defaultType" => $row->defaultType,
//                    ]);
//            }
//        });
//
//    DB::connection('old_mysql') // source DB
//    ->table('users')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('users')
//                    ->where("email", "=", $row->email)
//                    ->count()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('users')
//                    ->insert([
//                        "id" => $row->id,
//                        "name" => $row->name,
//                        "username" => explode("@", $row->email)[0],
//                        "mobile" => $row->mobile,
//                        "title" => $row->title,
//                        "email" => $row->email,
//                        "email_verified_at" => $row->email_verified_at,
//                        "mobile_verified_at" => $row->mobile_verified_at,
//                        "password" => $row->password,
//                        "avatar" => $row->avatar,
//                        "signature" => $row->signature,
//                        "stamp" => $row->stamp,
//                        "is_active" => property_exists($row, 'is_active') ? $row->is_active : true,
//                        "remember_token" => $row->remember_token,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('referrers')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('referrers')
//                    ->where("email", "=", $row->email)
//                    ->count()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('referrers')
//                    ->insert([
//                        "id" => $row->id,
//                        "fullName" => $row->fullName,
//                        "email" => $row->email,
//                        "phoneNo" => $row->phoneNo,
//                        "billingInfo" => $row->billingInfo,
//                        "isActive" => $row->isActive,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('patients')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('patients')
//                    ->where("idNo", "=", $row->idNo)
//                    ->count()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('patients')
//                    ->insert([
//                        "id" => $row->id,
//                        "registrar_id" => $row->registrar_id,
//                        "fullName" => $row->fullName,
//                        "idNo" => $row->idNo,
//                        "nationality" => $row->nationality,
//                        "dateOfBirth" => $row->dateOfBirth,
//                        "gender" => $row->gender || 'male',
//                        "phone" => $row->phone,
//                        "avatar" => $row->avatar,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('patient_metas')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('patient_metas')
//                    ->where("patient_id", "=", $row->patient_id)
//                    ->count()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('patient_metas')
//                    ->insert([
//                        "id" => $row->id,
//                        "patient_id" => $row->patient_id,
//                        "maritalStatus" => $row->maritalStatus,
//                        "company" => $row->company,
//                        "profession" => $row->profession,
//                        "avatar" => $row->avatar,
//                        "address" => $row->address,
//                        "email" => $row->email,
//                        "details" => $row->details,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('invoices')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('invoices')
//                    ->where("id", "=", $row->id)
//                    ->count()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('invoices')
//                    ->insert([
//                        "id" => $row->id,
//                        "owner_type" => last(explode("\\", $row->owner_type)),
//                        "owner_id" => $row->owner_id,
//                        "user_id" => $row->user_id,
//                        "discount" => $row->discount,
//                        "status" => $row->status,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('acceptances')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('acceptances')
//                    ->where("id", "=", $row->id)
//                    ->count()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('acceptances')
//                    ->insert([
//                        "id" => $row->id,
//                        "patient_id" => $row->patient_id,
//                        "invoice_id" => $row->invoice_id,
//                        "acceptor_id" => $row->acceptor_id,
//                        "referrer_id" => $row->referrer_id,
//                        "referenceCode" => $row->referenceCode,
//                        "samplerGender" => $row->samplerGender,
//                        "howReport" => $row->howReport,
//                        "doctor" => $row->doctor,
//                        "status" => $row->status,
//                        "out_patient" => $row->out_patient,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });
//    DB::connection('old_mysql') // source DB
//    ->table('referrer_orders')
//        ->orderBy('id') // chunk requires an orderBy
//        ->chunk(100, function ($rows) {
//            foreach ($rows as $row) {
//                if (DB::connection('mysql')
//                    ->table('referrer_orders')
//                    ->where("id", "=", $row->id)
//                    ->count()) {
//                    continue;
//                }
//                DB::connection('mysql') // destination DB
//                ->table('referrer_orders')
//                    ->insert([
//                        "id" => $row->id,
//                        "acceptance_id" => $row->acceptance_id,
//                        "patient_id" => $row->patient_id,
//                        "referrer_id" => $row->referrer_id,
//                        "user_id" => $row->user_id,
//                        "order_id" => $row->order_id,
//                        "status" => $row->status,
//                        "orderInformation" => $row->orderInformation,
//                        "logisticInformation" => $row->logisticInformation,
//                        "reference_no" => $row->reference_no,
//                        "received_at" => $row->received_at,
//                        "created_at" => $row->created_at,
//                        "updated_at" => $row->updated_at,
//                    ]);
//            }
//        });



//});

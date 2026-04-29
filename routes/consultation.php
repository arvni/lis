<?php

use App\Http\Controllers\Consultation\BookAnAppointmentController;
use App\Http\Controllers\Consultation\ConsultantController;
use App\Http\Controllers\Consultation\ConsultationController;
use App\Http\Controllers\Consultation\ListConsultantsController;
use App\Http\Controllers\Consultation\ListCustomersController;
use App\Http\Controllers\Consultation\ListReservationTimesController;
use App\Http\Controllers\Consultation\ListWaitingConsultationsController;
use App\Http\Controllers\Consultation\StartConsultationController;
use App\Http\Controllers\Consultation\TimeController;
use App\Http\Controllers\Consultation\UpdateCustomerToPatientWithConsultationController;
use Illuminate\Support\Facades\Route;

Route::group(["prefix" => "consultation"], function () {
    Route::get("waiting-list", ListWaitingConsultationsController::class)->name("consultations.waiting-list");
    Route::resource("consultations", ConsultationController::class);
    Route::resource("consultants", ConsultantController::class);
    Route::put("consultations/{consultation}/start", StartConsultationController::class)->name("consultations.start");
    Route::get("consultants-list", ListConsultantsController::class)->name("list-consultants");
    Route::get("reservation-times", ListReservationTimesController::class)->name("list-reservation-times");
    Route::resource("times", TimeController::class)->except("create", "edit", "show");
    Route::post("book-an-appointment", BookAnAppointmentController::class)->name("book-an-appointment");
    Route::put('convert-customer-to-patient/{time}', UpdateCustomerToPatientWithConsultationController::class)->name("update-customer-to-patient");
});

Route::group(["prefix" => "api/consultation", "as" => "api."], function () {
    Route::get("customers", ListCustomersController::class)->name("customers.list");
});

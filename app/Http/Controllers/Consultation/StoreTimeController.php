<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\DTOs\CustomerDTO;
use App\Domains\Consultation\Repositories\TimeRepository;
use App\Domains\Consultation\Services\CustomerService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTimeRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;

class StoreTimeController extends Controller
{
    public function __construct(private readonly CustomerService $customerService, private TimeRepository $timeRepository)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(StoreTimeRequest $request)
    {
        $validated = $request->validated();
        $customerID = $request->input("customer.id");
        if (!$customerID) {
            $customerID = $this->customerService->createOrGetCustomer($validated["customer"])->id;
        }
        $dueDate = Carbon::createFromFormat("Y-m-d H:i", $validated["dueDate"] . " " . $validated["time"], "Asia/Muscat");
        $this->timeRepository->createTime([
            "consultant_id" => $validated["consultant"]["id"],
            "reservable_type" => "customer",
            "reservable_id" => $customerID,
            "title" => $dueDate->format("H:i"),
            "started_at" => $dueDate,
            "ended_at" => $dueDate->copy()->addMinutes(30),
            "active" => false,
        ]);
        return back()->with(["success" => true, "status" => "Time added successfully"]);

    }
}

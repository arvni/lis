<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\DoctorDTO;
use App\Domains\Laboratory\Models\Doctor;
use App\Domains\Laboratory\Requests\StoreDoctorRequest;
use App\Domains\Laboratory\Requests\UpdateDoctorRequest;
use App\Domains\Laboratory\Services\DoctorService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorController extends Controller
{
    public function __construct(private DoctorService $doctorService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Doctor::class);
        $requestInputs = $request->all();
        $doctors = $this->doctorService->listDoctors($requestInputs);
        return Inertia::render('Doctor/Index', compact("doctors", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDoctorRequest $doctorRequest)
    {
        $validatedData = $doctorRequest->validated();
        $doctorDto = new DoctorDTO(
            $validatedData["name"],
            $validatedData["expertise"],
            $validatedData["phone"],
            $validatedData["license_no"],
        );
        $this->doctorService->storeDoctor($doctorDto);
        return back()->with(["success" => true, "status" => "$doctorDto->name Created Successfully"]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Doctor $doctor, UpdateDoctorRequest $request)
    {
        $validatedData = $request->validated();
        $doctorDto = new DoctorDTO(
            $validatedData["name"],
            $validatedData["expertise"],
            $validatedData["phone"],
            $validatedData["license_no"],
        );
        $this->doctorService->updateDoctor($doctor, $doctorDto);
        return back()->with(["success" => true, "status" => "$doctorDto->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(Doctor $doctor): RedirectResponse
    {
        $this->authorize("delete", $doctor);
        $title = $doctor["name"];
        $this->doctorService->deleteDoctor($doctor);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}

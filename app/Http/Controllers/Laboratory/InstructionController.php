<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\InstructionDTO;
use App\Domains\Laboratory\Events\InstructionUpdated;
use App\Domains\Laboratory\Models\Instruction;
use App\Domains\Laboratory\Requests\StoreInstructionRequest;
use App\Domains\Laboratory\Requests\UpdateInstructionRequest;
use App\Domains\Laboratory\Services\InstructionService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructionController extends Controller
{
    public function __construct(private readonly InstructionService $instructionService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Instruction::class);
        $requestInputs = $request->all();
        $instructions = $this->instructionService->listInstructions($requestInputs);
        return Inertia::render('Instruction/Index', compact("instructions", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreInstructionRequest $instructionRequest)
    {
        $validatedData = $instructionRequest->validated();
        $instructionDto = new InstructionDTO(
            $validatedData["name"],
            $validatedData["document"] ?? null,
        );
        $instruction = $this->instructionService->storeInstruction($instructionDto);
        InstructionUpdated::dispatch($instruction, "create");
        return back()->with(["success" => true, "status" => "$instructionDto->name Created Successfully"]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Instruction $instruction, UpdateInstructionRequest $request)
    {
        $validatedData = $request->validated();
        $instructionDto = new InstructionDTO(
            $validatedData["name"],
            $validatedData["document"] ?? null,
        );
        $this->instructionService->updateInstruction($instruction, $instructionDto);
        InstructionUpdated::dispatch($instruction, "update");
        return back()->with(["success" => true, "status" => "$instructionDto->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(Instruction $instruction): RedirectResponse
    {
        $this->authorize("delete", $instruction);
        $title = $instruction["name"];
        $this->instructionService->deleteInstruction($instruction);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}

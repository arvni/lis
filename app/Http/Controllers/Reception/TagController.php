<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Tag;
use App\Domains\Reception\Services\TagService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function __construct(private readonly TagService $tagService)
    {
    }

    public function index(Request $request): Response
    {
        return Inertia::render('Tag/Index', [
            'tags' => ListResource::collection($this->tagService->listTags(['pageSize' => 1000]))
        ]);
    }

    public function update(Request $request, Tag $tag): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:20',
        ]);

        $tag->update($validated);

        return back()->with(['success' => true, 'status' => 'Tag updated successfully.']);
    }

    public function destroy(Tag $tag): \Illuminate\Http\RedirectResponse
    {
        $tag->delete();

        return back()->with(['success' => true, 'status' => 'Tag deleted successfully.']);
    }
}

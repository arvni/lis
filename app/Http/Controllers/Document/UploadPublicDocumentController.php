<?php

namespace App\Http\Controllers\Document;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class UploadPublicDocumentController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        // Validate the file input
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,svg,webp|max:2048',
        ]);

        // Get the uploaded file
        $file = $request->file('file');

        // Generate a unique name
        $filename = uniqid() . '.' . $file->getClientOriginalExtension();

        // Define destination path
        $destination = public_path('images/icons');

        // Ensure the directory exists
        if (!File::exists($destination)) {
            File::makeDirectory($destination, 0755, true);
        }

        // Move the file to public/images/icons
        $file->move($destination, $filename);

        // Optionally return the path or filename
        return response()->json(['url' => asset("images/icons/$filename"),]);
    }
}

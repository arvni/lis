<?php

namespace App\Http\Controllers\Document;

use App\Domains\Document\Requests\UploadPublicDocumentRequest;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class UploadPublicDocumentController extends Controller
{
    public function __invoke(UploadPublicDocumentRequest $request)
    {
        $file = $request->file('file');

        // Generate a unique name
        $filename = Str::uuid() . '.' . $file->guessExtension();

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

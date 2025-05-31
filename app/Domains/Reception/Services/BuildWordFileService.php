<?php

namespace App\Domains\Reception\Services;

use App\Domains\Document\Models\Document;
use App\Domains\Document\Services\DocumentService;
use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use PhpOffice\PhpWord\Exception\Exception as PhpWordException;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\Log;

class BuildWordFileService
{

    public function __construct(private DocumentService $documentService)
    {
    }

    /**
     * Build a Word document from a template with data and optional signatures.
     *
     * @param string $docPath The path to the template document
     * @param array $data The data to populate in the template
     * @return string The response with the generated document for download
     *
     * @throws ConnectionException
     * @throws PhpWordException
     */
    public static function build(string $docPath, array $data)
    {
        try {
            // Configure PhpWord
            Settings::loadConfig();
            Settings::setOutputEscapingEnabled(true);
            // Create template processor
            $templateProcessor = new TemplateProcessor(storage_path("app/private/" . $docPath));


            $templateProcessor->setValues(Arr::except($data, "images"));

            // Create temp directory for downloaded images if needed
            $tempDir = storage_path('app/temp-images');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            // Track temporary files for cleanup
            $tempFiles = [];

            // Set image values if any
            if (isset($data["images"]) && is_array($data["images"])) {
                foreach ($data["images"] as $key => $image) {
                    if (filter_var($image, FILTER_VALIDATE_URL)) {
                        if (self::isLocalhostUrl($image)) {
                            // Convert localhost URL to local file path
                            $localPath = self::localhostUrlToFilePath($image);
                            if (file_exists($localPath)) {
                                $templateProcessor->setImageValue($key, $localPath);
                            } else {
                                Log::warning("Local file not found from localhost URL: {$image} -> {$localPath}");
                            }
                        } else {
                            $tempFilePath = $tempDir . '/' . Str::random(16) . '.' . self::getImageExtensionFromUrl($image);
                            // Use Http facade for better handling of timeouts and errors
                            $response = Http::timeout(30)->get($image);
                            if ($response->successful()) {
                                file_put_contents($tempFilePath, $response->body());
                                $templateProcessor->setImageValue($key, $tempFilePath);
                                $tempFiles[] = $tempFilePath;
                            } else {
                                Log::warning("Failed to download image from URL: {$image}. Status: " . $response->status());
                            }
                        }
                    } elseif (file_exists($image)) {
                        // Handle local file path
                        $templateProcessor->setImageValue($key, $image);
                    } else {
                        Log::warning("Image file not found: {$image}");
                    }
                }
            }

            // Generate filename
            $fileName = "";
            if (isset($data["fileName"]) && $data["fileName"]) {
                $fileName = $data["fileName"];
            } else
                $fileName = last(explode("/", $docPath));

            $wordDir = storage_path('app/word-files/');
            if (!file_exists($wordDir)) {
                mkdir($wordDir, 0755, true);
            }

            $fileName = storage_path("app/word-files/" . $fileName);

            // Save the document
            $templateProcessor->saveAs($fileName);

            // Cleanup temporary files if any were created
            if (!empty($tempFiles)) {
                foreach ($tempFiles as $tempFile) {
                    if (file_exists($tempFile)) {
                        unlink($tempFile);
                    }
                }
            }

            // Return response for download
            return $fileName;
        } catch (PhpWordException $e) {
            Log::error('Error generating Word document: ' . $e->getMessage());
            throw $e;
        } catch (Exception $e) {
            Log::error('Unexpected error in BuildWordFileService: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get image extension from URL
     *
     * @param string $url The image URL
     * @return string The image extension (jpg, png, etc.)
     */
    /**
     * Get image extension from URL
     *
     * @param string $url The image URL
     * @return string The image extension (jpg, png, etc.)
     */
    private static function getImageExtensionFromUrl(string $url): string
    {
        // Try to get extension from URL path
        $pathInfo = pathinfo(parse_url($url, PHP_URL_PATH));
        if (isset($pathInfo['extension'])) {
            $extension = strtolower($pathInfo['extension']);
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'])) {
                return $extension;
            }
        }

        // If no valid extension in URL, try to get content type
        try {
            $headers = get_headers($url, 1);
            if (isset($headers['Content-Type'])) {
                $contentType = is_array($headers['Content-Type'])
                    ? $headers['Content-Type'][0]
                    : $headers['Content-Type'];

                $mimeToExt = [
                    'image/jpeg' => 'jpg',
                    'image/jpg' => 'jpg',
                    'image/png' => 'png',
                    'image/gif' => 'gif',
                    'image/bmp' => 'bmp',
                    'image/webp' => 'webp'
                ];

                if (isset($mimeToExt[$contentType])) {
                    return $mimeToExt[$contentType];
                }
            }
        } catch (Exception $e) {
            // Ignore header reading errors
        }

        // Default to jpg if we can't determine the type
        return 'jpg';
    }

    /**
     * Check if URL is from localhost
     *
     * @param string $url The URL to check
     * @return bool True if URL is from localhost
     */
    private static function isLocalhostUrl(string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST);
        $appHost = parse_url(url("/"), PHP_URL_HOST);
        return $host === 'localhost' ||
            $host === '127.0.0.1' ||
            $host === $appHost ||
            strpos($host, '.local') !== false ||
            strpos($host, '.test') !== false;
    }

    /**
     * Convert localhost URL to file path
     *
     * @param string $url The localhost URL
     * @return string The corresponding file path
     */
    private static function localhostUrlToFilePath(string $url): string
    {
        $parsedUrl = parse_url($url);
        $path = $parsedUrl['path'] ?? '';

        // Remove any URL parameters
        if (strpos($path, '?') !== false) {
            $path = substr($path, 0, strpos($path, '?'));
        }

        // Determine the document root based on the application
        $documentRoot = public_path();

        // If path starts with /storage, point to the storage/app/public folder
        if (strpos($path, '/storage') === 0) {
            return storage_path('app/public' . substr($path, 9));
        } elseif (Str::endsWith($path, '/download') && Str::startsWith($path, "/documents")) {
            $id = Str::remove(["/download", "/documents/", "/"], $path);
            $doc = Document::find($id);
            if ($doc)
                return storage_path("app/private/" . $doc->path);
        }

        // Otherwise, point to the public directory
        return $documentRoot . $path;
    }

}

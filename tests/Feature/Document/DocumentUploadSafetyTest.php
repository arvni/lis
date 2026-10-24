<?php

declare(strict_types=1);

namespace Tests\Feature\Document;

use App\Domains\Document\Models\Document;
use App\Domains\Document\Repositories\DocumentRepository;
use App\Domains\Document\Requests\StoreDocumentRequest;
use App\Domains\Document\Requests\UploadPublicDocumentRequest;
use App\Domains\Document\Services\DocumentService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Tests\TestCase;

class DocumentUploadSafetyTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<string> */
    private array $written = [];

    protected function tearDown(): void
    {
        foreach ($this->written as $path) {
            File::delete($path);
        }
        parent::tearDown();
    }

    /**
     * A real upload, not UploadedFile::fake(): the fake reports a MIME type from the file
     * name, which would hide exactly the content sniffing these tests are about.
     */
    private function upload(string $name, string $content): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'upl');
        File::put($path, $content);
        $this->written[] = $path;

        return new UploadedFile($path, $name, null, null, true);
    }

    private function passesStore(UploadedFile $file): bool
    {
        return Validator::make(['file' => $file], (new StoreDocumentRequest)->rules())->passes();
    }

    private function passesPublic(UploadedFile $file): bool
    {
        return Validator::make(['file' => $file], (new UploadPublicDocumentRequest)->rules())->passes();
    }

    private function png(): string
    {
        $image = imagecreatetruecolor(2, 2);
        ob_start();
        imagepng($image);

        return (string) ob_get_clean();
    }

    public function test_lab_file_types_are_still_accepted(): void
    {
        $this->assertTrue($this->passesStore($this->upload('report.pdf', "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF")));
        $this->assertTrue($this->passesStore($this->upload('scan.png', $this->png())));
        $this->assertTrue($this->passesStore($this->upload('results.csv', "sample,value\nA1,0.42\n")));
        $this->assertTrue($this->passesStore($this->upload('export.xml', '<?xml version="1.0"?><run><well id="A1"/></run>')));
        $this->assertTrue($this->passesStore($this->upload('notes.txt', 'plain text')));
        $this->assertTrue($this->passesStore(UploadedFile::fake()->create('template.docx', 10, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')));
    }

    public function test_svg_html_and_scripts_are_rejected(): void
    {
        $this->assertFalse($this->passesStore($this->upload('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>')));
        $this->assertFalse($this->passesStore($this->upload('page.html', '<html><script>alert(1)</script></html>')));
        $this->assertFalse($this->passesStore($this->upload('shell.php', '<?php echo 1;')));
        $this->assertFalse($this->passesStore($this->upload('run.exe', 'MZ')));
    }

    public function test_renamed_html_is_caught_by_its_content(): void
    {
        $this->assertFalse($this->passesStore($this->upload('innocent.txt', '<!DOCTYPE html><html><body><script>alert(1)</script></body></html>')));
        $this->assertFalse($this->passesStore($this->upload('picture.dat', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')));
    }

    public function test_public_icons_accept_raster_images_only(): void
    {
        $this->assertTrue($this->passesPublic($this->upload('icon.png', $this->png())));
        $this->assertFalse($this->passesPublic($this->upload('icon.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>')));
        $this->assertFalse($this->passesPublic($this->upload('icon.png', '<svg xmlns="http://www.w3.org/2000/svg"></svg>')));
    }

    private function storedDocument(string $ext, string $content): Document
    {
        $this->actingAs(User::factory()->create());
        $document = Document::create([
            'owner_type' => 'user',
            'owner_id' => 1,
            'hash' => (string) Str::uuid(),
            'ext' => $ext,
            'tag' => 'DOCUMENT',
            'originalName' => "file.$ext",
        ]);
        $document->path = $document->address.'/'.$document->file_name;
        $document->save();

        $full = storage_path('app/private/'.$document->path);
        File::ensureDirectoryExists(dirname($full));
        File::put($full, $content);
        $this->written[] = $full;

        return $document;
    }

    private function serve(Document $document): BinaryFileResponse
    {
        return (new DocumentService(new DocumentRepository))->showDocument($document);
    }

    public function test_pdf_and_images_still_open_in_the_browser(): void
    {
        $pdf = $this->serve($this->storedDocument('pdf', "%PDF-1.4\n%%EOF"));
        $this->assertStringStartsWith('inline', (string) $pdf->headers->get('Content-Disposition'));
        $this->assertSame('application/pdf', $pdf->headers->get('Content-Type'));
        $this->assertSame('nosniff', $pdf->headers->get('X-Content-Type-Options'));
        $this->assertNull($pdf->headers->get('Content-Security-Policy'));

        $png = $this->serve($this->storedDocument('png', $this->png()));
        $this->assertStringStartsWith('inline', (string) $png->headers->get('Content-Disposition'));
        $this->assertStringContainsString('sandbox', (string) $png->headers->get('Content-Security-Policy'));
    }

    public function test_previously_stored_svg_or_html_is_only_downloaded(): void
    {
        $svg = $this->serve($this->storedDocument('svg', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'));
        $this->assertStringStartsWith('attachment', (string) $svg->headers->get('Content-Disposition'));
        $this->assertStringContainsString('sandbox', (string) $svg->headers->get('Content-Security-Policy'));

        $html = $this->serve($this->storedDocument('txt', '<html><script>alert(1)</script></html>'));
        $this->assertStringStartsWith('attachment', (string) $html->headers->get('Content-Disposition'));
        $this->assertSame('nosniff', $html->headers->get('X-Content-Type-Options'));
    }
}

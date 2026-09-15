<?php

declare(strict_types=1);

namespace Tests\Feature\Attendance;

use App\Domains\Attendance\Events\AttendanceRebuildRequested;
use App\Domains\User\Models\User;
use DateTimeImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * "Now" is Thursday 17 Sep 2026 18:00.
 */
class AttendanceTransactionImportTest extends TestCase
{
    use RefreshDatabase;

    private const IMPORT = 'Attendance.Transactions.Import Transactions';

    private const LIST = 'Attendance.Transactions.List Transactions';

    /** @var list<string> */
    private array $files = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Carbon::setTestNow('2026-09-17 18:00:00');
        Event::fake([AttendanceRebuildRequested::class]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        foreach ($this->files as $file) {
            @unlink($file);
        }
        parent::tearDown();
    }

    public function test_importing_requires_permission(): void
    {
        $this->actingAs($this->userWith(self::LIST))
            ->post(route('attendance.transactions.import'), [
                'file' => $this->xlsx([['Employee ID', 'Date and Time'], ['00123', '2026-09-14 08:00:00']]),
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('attendance_transactions', 0);
    }

    public function test_an_export_with_one_date_and_time_column_is_imported_and_attendance_recalculated(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);
        $importer = $this->userWith(self::IMPORT);

        $this->actingAs($importer)
            ->from(route('attendance.transactions.index'))
            ->post(route('attendance.transactions.import'), ['file' => $this->xlsx([
                ['Access Records'],
                [],
                ['Employee ID', 'Name', 'Access Date and Time', 'Device'],
                ['00123', 'Sara', $this->excel('2026-09-14 08:11:04'), 'Main door'],
                ['00123', 'Sara', $this->excel('2026-09-15 15:47:52'), 'Main door'],
            ])])
            ->assertRedirect(route('attendance.transactions.index'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', true)
            ->assertSessionHas('status', 'Imported 2 punches from Employee ID, Access Date and Time.')
            ->assertSessionHas('import_errors', []);

        $this->assertDatabaseHas('attendance_transactions', [
            'attendance_id' => '00123',
            'access_date_and_time' => '2026-09-14 08:11:04',
            'access_date' => '2026-09-14',
            'access_time' => '08:11:04',
            'imported_by' => $importer->id,
        ]);
        $this->assertDatabaseHas('attendance_transactions', ['access_date_and_time' => '2026-09-15 15:47:52']);

        Event::assertDispatched(AttendanceRebuildRequested::class, fn (AttendanceRebuildRequested $event) => $event->from === '2026-09-14'
            && $event->to === '2026-09-15'
            && $event->userIds === [$sara->id]);
    }

    public function test_separate_date_and_time_columns_are_imported(): void
    {
        User::factory()->create(['attendance_number' => '00123']);

        $this->actingAs($this->userWith(self::IMPORT))
            ->post(route('attendance.transactions.import'), ['file' => $this->xlsx([
                ['Employee ID', 'Access Date', 'Access Time'],
                ['00123', $this->excel('2026-09-14'), 8 / 24 + 11 / 1440],
                ['00123', '14/09/2026', '3:47 PM'],
            ])])
            ->assertSessionHas('status', 'Imported 2 punches from Employee ID, Access Date, Access Time.');

        $this->assertSame(
            ['2026-09-14 08:11:00', '2026-09-14 15:47:00'],
            DB::table('attendance_transactions')->orderBy('access_date_and_time')->pluck('access_date_and_time')->all(),
        );
    }

    public function test_a_csv_with_all_three_columns_is_imported_and_unknown_employee_ids_are_named(): void
    {
        $sara = User::factory()->create(['attendance_number' => '00123']);

        $this->actingAs($this->userWith(self::IMPORT))
            ->post(route('attendance.transactions.import'), ['file' => $this->csv(
                "Employee ID,Access Date and Time,Access Date,Access Time\n"
                ."00123,2026-09-14T08:11:04,2026-09-14,08:11:04\n"
                ."99999,2026-09-14T09:00:00,2026-09-14,09:00:00\n"
            )])
            ->assertSessionHas('success', true)
            ->assertSessionHas('status', 'Imported 2 punches from Employee ID, Access Date and Time, Access Date, Access Time. '
                .'No user has Employee ID 99999 yet; set it on their user page.');

        $this->assertDatabaseHas('attendance_transactions', ['attendance_id' => '99999', 'access_date_and_time' => '2026-09-14 09:00:00']);
        Event::assertDispatched(AttendanceRebuildRequested::class, fn (AttendanceRebuildRequested $event) => $event->userIds === [$sara->id]);
    }

    public function test_punches_already_stored_are_skipped_so_a_file_can_be_imported_twice(): void
    {
        DB::table('attendance_transactions')->insert([
            'attendance_id' => '00123',
            'access_date_and_time' => '2026-09-14 08:11:04',
            'access_date' => '2026-09-14',
            'access_time' => '08:11:04',
        ]);
        $importer = $this->userWith(self::IMPORT);
        $rows = [
            ['Employee ID', 'Date and Time'],
            ['00123', '2026-09-14 08:11:04'],
            ['00123', '2026-09-14 15:47:52'],
            ['00123', '2026-09-14 15:47:52'],
        ];

        $this->actingAs($importer)
            ->post(route('attendance.transactions.import'), ['file' => $this->xlsx($rows)])
            ->assertSessionHas('status', 'Imported 1 punch from Employee ID, Date and Time. Skipped 2 duplicates. '
                .'No user has Employee ID 00123 yet; set it on their user page.');

        $this->actingAs($importer)
            ->post(route('attendance.transactions.import'), ['file' => $this->xlsx($rows)])
            ->assertSessionHas('status', 'Imported 0 punches from Employee ID, Date and Time. Skipped 3 duplicates.');

        $this->assertDatabaseCount('attendance_transactions', 2);
        // Nobody has Employee ID 00123, so there is no attendance to recalculate.
        Event::assertNotDispatched(AttendanceRebuildRequested::class);
    }

    public function test_rows_that_cannot_be_read_are_listed_and_the_rest_imported(): void
    {
        User::factory()->create(['attendance_number' => '00123']);

        $this->actingAs($this->userWith(self::IMPORT))
            ->post(route('attendance.transactions.import'), ['file' => $this->xlsx([
                ['Employee ID', 'Date and Time'],
                ['00123', '2026-09-14 08:11:04'],
                ['', '2026-09-14 09:00:00'],
                ['00123', 'yesterday'],
                ['00123', '2026-09-30 08:00:00'],
            ])])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', false)
            ->assertSessionHas('status', 'Imported 1 punch from Employee ID, Date and Time. 3 rows could not be read.')
            ->assertSessionHas('import_errors', [
                'Row 3: no Employee ID.',
                'Row 4: can\'t read a date from "yesterday".',
                'Row 5: 2026-09-30 08:00:00 is in the future.',
            ]);

        $this->assertDatabaseCount('attendance_transactions', 1);
    }

    public function test_a_file_without_recognisable_headings_is_refused(): void
    {
        $this->actingAs($this->userWith(self::IMPORT))
            ->post(route('attendance.transactions.import'), ['file' => $this->xlsx([
                ['Name', 'When'],
                ['Sara', '2026-09-14 08:00:00'],
            ])])
            ->assertSessionHasErrors(['file' => 'No heading row found. The file needs an "Employee ID" column and either a '
                .'"Date and Time" column or "Date" and "Time" columns.']);

        $this->assertDatabaseCount('attendance_transactions', 0);
    }

    public function test_only_excel_and_csv_files_are_accepted(): void
    {
        $this->actingAs($this->userWith(self::IMPORT))
            ->post(route('attendance.transactions.import'), ['file' => UploadedFile::fake()->create('punches.pdf', 10)])
            ->assertSessionHasErrors(['file' => 'Choose an Excel (.xlsx, .xls) or CSV file.']);
    }

    public function test_a_corrupt_spreadsheet_is_refused(): void
    {
        $this->actingAs($this->userWith(self::IMPORT))
            ->post(route('attendance.transactions.import'), [
                'file' => UploadedFile::fake()->createWithContent('punches.xlsx', 'not really a spreadsheet'),
            ])
            ->assertSessionHasErrors(['file' => "The file couldn't be read. Save it as .xlsx or .csv and try again."]);
    }

    public function test_the_punches_list_shows_who_imported_a_punch(): void
    {
        $importer = $this->userWith(self::IMPORT, self::LIST);
        $importer->update(['name' => 'Omar Said']);
        DB::table('attendance_transactions')->insert([
            'attendance_id' => '00123',
            'access_date_and_time' => '2026-09-14 08:00:00',
        ]);

        $this->actingAs($importer)
            ->post(route('attendance.transactions.import'), ['file' => $this->xlsx([
                ['Employee ID', 'Date and Time'],
                ['00123', '2026-09-14 09:00:00'],
            ])]);

        $this->actingAs($importer)
            ->get(route('attendance.transactions.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('transactions.data.0.access_date_and_time', '2026-09-14 09:00:00')
                ->where('transactions.data.0.imported_by', 'Omar Said')
                ->where('transactions.data.0.imported_at', '2026-09-17 18:00')
                ->where('transactions.data.1.imported_by', null)
                ->where('transactions.data.1.imported_at', null));
    }

    /**
     * @param  list<list<mixed>>  $rows
     */
    private function xlsx(array $rows): UploadedFile
    {
        $spreadsheet = new Spreadsheet;
        $spreadsheet->getActiveSheet()->fromArray($rows, null, 'A1', true);

        return $this->upload('punches.xlsx', fn (string $path) => (new Xlsx($spreadsheet))->save($path));
    }

    private function csv(string $contents): UploadedFile
    {
        return $this->upload('punches.csv', fn (string $path) => file_put_contents($path, $contents));
    }

    private function upload(string $name, callable $write): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'punches').'-'.$name;
        $this->files[] = $path;
        $write($path);

        return new UploadedFile($path, $name, null, null, true);
    }

    /**
     * The number Excel stores for a date or date and time.
     */
    private function excel(string $value): float
    {
        return (float) ExcelDate::PHPToExcel(new DateTimeImmutable($value));
    }

    private function userWith(string ...$permissions): User
    {
        $user = User::factory()->create();
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }
        $user->givePermissionTo($permissions);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}

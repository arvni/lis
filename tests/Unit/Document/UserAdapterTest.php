<?php

namespace Tests\Unit\Document;

use App\Domains\Document\Adapters\UserAdapter;
use App\Domains\User\Models\User;
use Illuminate\Support\Collection;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Tests\TestCase;

/**
 * Pins the document-tag permission projection the Document domain reads through
 * its UserAdapter (the cross-domain boundary into User): only "Documents.*"
 * permissions count, names are snake→UPPER-cased, and TEMP/AVATAR are excluded.
 * The user's permission set is stubbed, so no DB is touched.
 */
class UserAdapterTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    /** @param array<int, string> $permissionNames */
    private function userWithPermissions(array $permissionNames): User
    {
        $permissions = new Collection(
            array_map(fn (string $name) => (object) ['name' => $name], $permissionNames)
        );

        $user = Mockery::mock(User::class);
        $user->shouldReceive('getAllPermissions')->andReturn($permissions);

        return $user;
    }

    public function test_keeps_only_document_permissions_snake_upper_cased(): void
    {
        $user = $this->userWithPermissions([
            'Documents.document',
            'Documents.medicalHistory',
            'Users.viewAny',       // non-document permission → ignored
            'Reception.acceptance', // non-document permission → ignored
        ]);

        $tags = (new UserAdapter)->getAllowedDocumentTags($user);

        $this->assertSame(['DOCUMENT', 'MEDICAL_HISTORY'], $tags);
    }

    public function test_excludes_temp_and_avatar_tags(): void
    {
        $user = $this->userWithPermissions([
            'Documents.temp',
            'Documents.avatar',
            'Documents.idCard',
        ]);

        $tags = (new UserAdapter)->getAllowedDocumentTags($user);

        $this->assertSame(['ID_CARD'], $tags);
    }
}

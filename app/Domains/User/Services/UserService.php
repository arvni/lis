<?php

namespace App\Domains\User\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\User\DTOs\UserDTO;
use App\Domains\User\Events\UserDocumentUpdateEvent;
use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class UserService
{
    public function __construct(protected UserRepository $userRepository)
    {
    }

    public function listUsers(array $filters): LengthAwarePaginator
    {
        return $this->userRepository->all($filters);
    }

    public function createUser(UserDTO $userDTO): User
    {
        $user = $this->userRepository->create(
            Arr::except($userDTO->toArray(), ['signature', 'stamp'])
        );
        $this->handleDocumentUpdate($user, $userDTO);
        $user->roles()->sync(Arr::pluck($userDTO->roles, 'id'));
        return $user;
    }

    public function updateUser(User $user, UserDTO $userDTO): User
    {

        $this->handleDocumentUpdate($user, $userDTO);
        $user->roles()->sync(Arr::pluck($userDTO->roles, 'id'));

        return $this->userRepository->update(
            $user,
            Arr::except($userDTO->toArray(), ['signature', 'stamp', "roles"])
        );
    }

    public function deleteUser(User $user): void
    {
        $this->userRepository->delete($user);
    }

    private function handleDocumentUpdate(User $user, UserDTO $userDTO): void
    {
        if (isset($userDTO->signature['id'])) {
            UserDocumentUpdateEvent::dispatch($userDTO->signature['id'], $user->id, DocumentTag::SIGNATURE->value);
            $user->fill(['signature' => relative_route("documents.download", [$userDTO->signature['id']])]);
        }

        if (isset($userDTO->stamp['id'])) {
            UserDocumentUpdateEvent::dispatch($userDTO->stamp['id'], $user->id, DocumentTag::STAMP->value);
            $user->fill(['stamp' => relative_route("documents.download", [$userDTO->stamp['id']])]);
        }
        if ($user->isDirty())
            $user->save();
    }

    public static function getAllowedDocumentTags(?User $user = null)
    {
        if (!$user)
            $user = auth()->user();
        return $user->getAllPermissions()
            ->filter(fn($item) => Str::startsWith($item->name, "Documents."))
            ->pluck("name")
            ->map(fn($item) => strtoupper(Str::snake(substr($item, strlen("Documents.")))))
            ->reject(fn($item) => in_array($item, [
                DocumentTag::TEMP->value,
                DocumentTag::AVATAR->value
            ]))
            ->values()
            ->toArray();
    }
}

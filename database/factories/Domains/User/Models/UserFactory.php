<?php

namespace Database\Factories\Domains\User\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;


    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = User::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'mobile' => $this->faker->phoneNumber(),
            'email_verified_at' => now(),
            'mobile_verified_at' => now(),
            'password' => bcrypt('password'), // Default password for testing
            'remember_token' => Str::random(10),
            'signature' => $this->faker->word(),
            'title' => $this->faker->jobTitle(),
            'avatar' => $this->faker->imageUrl(),
            'stamp' => $this->faker->word(),
        ];
    }

    /**
     * Indicate that the user's email is unverified.
     *
     * @return Factory
     */
    public function unverified(): Factory
    {
        return $this->state(function (array $attributes) {
            return [
                'email_verified_at' => null,
                'mobile_verified_at' => null,
            ];
        });
    }
}

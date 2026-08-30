<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Domains\Billing\Exceptions\InvalidCardNumberTemplateException;
use App\Domains\Billing\Support\CardNumberTemplate;
use PHPUnit\Framework\TestCase;

class CardNumberTemplateTest extends TestCase
{
    public function test_it_mints_a_number_shaped_like_its_template(): void
    {
        $number = CardNumberTemplate::compile('DDDD-DDDD-DDDD-DDDD')->generate();

        $this->assertMatchesRegularExpression('/^\d{4}-\d{4}-\d{4}-\d{4}$/', $number);
    }

    public function test_l_mints_capital_letters(): void
    {
        $number = CardNumberTemplate::compile('LLLL')->generate();

        $this->assertMatchesRegularExpression('/^[A-Z]{4}$/', $number);
    }

    public function test_a_digit_range_is_honoured(): void
    {
        $template = CardNumberTemplate::compile('D{1-3}D{1-3}D{1-3}D{1-3}');

        for ($i = 0; $i < 50; $i++) {
            $this->assertMatchesRegularExpression('/^[123]{4}$/', $template->generate());
        }
    }

    public function test_a_letter_range_is_honoured(): void
    {
        $template = CardNumberTemplate::compile('L{A-C}L{A-C}L{A-C}');

        for ($i = 0; $i < 50; $i++) {
            $this->assertMatchesRegularExpression('/^[ABC]{3}$/', $template->generate());
        }
    }

    public function test_a_quoted_literal_is_not_read_as_placeholders(): void
    {
        $number = CardNumberTemplate::compile("'LAB'-DDDD")->generate();

        $this->assertMatchesRegularExpression('/^LAB-\d{4}$/', $number);
    }

    public function test_unquoted_literals_survive_as_typed(): void
    {
        $number = CardNumberTemplate::compile('1000-DDDD')->generate();

        $this->assertMatchesRegularExpression('/^1000-\d{4}$/', $number);
    }

    public function test_the_number_carries_no_check_character(): void
    {
        // It is stored beside the number, never inside it — the printed card and
        // the QR show exactly the template and nothing more.
        for ($i = 0; $i < 20; $i++) {
            $this->assertMatchesRegularExpression(
                '/^\d{4}-\d{4}-\d{4}-\d{4}$/',
                CardNumberTemplate::compile('DDDD-DDDD-DDDD-DDDD')->generate()
            );
        }
    }

    public function test_the_check_character_is_derived_from_the_number(): void
    {
        $number = CardNumberTemplate::compile('DDDD-DDDD-DDDD-DDDD')->generate();

        $this->assertMatchesRegularExpression('/^[0-9A-Z]$/', CardNumberTemplate::checkCharacterFor($number));
        // Stable: the same number always yields the same character.
        $this->assertSame(
            CardNumberTemplate::checkCharacterFor($number),
            CardNumberTemplate::checkCharacterFor($number)
        );
    }

    public function test_a_changed_number_yields_a_different_check_character(): void
    {
        $number = CardNumberTemplate::compile('DDDD-DDDD')->generate();
        $altered = $number;
        $altered[0] = (string) ((((int) $number[0]) + 1) % 10);

        $this->assertNotSame(
            CardNumberTemplate::checkCharacterFor($number),
            CardNumberTemplate::checkCharacterFor($altered)
        );
    }

    public function test_capacity_counts_what_the_placeholders_allow(): void
    {
        $this->assertSame(10000.0, CardNumberTemplate::compile('DDDD')->capacity());
        $this->assertSame(676.0, CardNumberTemplate::compile('LL')->capacity());
        // Literals contribute nothing; only placeholders vary.
        $this->assertSame(100.0, CardNumberTemplate::compile("'LAB'-DD")->capacity());
        $this->assertSame(9.0, CardNumberTemplate::compile('D{1-9}')->capacity());
    }

    public function test_a_template_with_no_placeholder_is_refused(): void
    {
        $this->expectException(InvalidCardNumberTemplateException::class);

        CardNumberTemplate::compile("'FIXED'-1234");
    }

    public function test_an_empty_template_is_refused(): void
    {
        $this->expectException(InvalidCardNumberTemplateException::class);

        CardNumberTemplate::compile('   ');
    }

    public function test_a_backwards_range_is_refused(): void
    {
        $this->expectException(InvalidCardNumberTemplateException::class);

        CardNumberTemplate::compile('D{9-1}');
    }

    public function test_a_letter_range_over_digits_is_refused(): void
    {
        $this->expectException(InvalidCardNumberTemplateException::class);

        CardNumberTemplate::compile('L{1-5}');
    }

    public function test_an_unclosed_range_is_refused(): void
    {
        $this->expectException(InvalidCardNumberTemplateException::class);

        CardNumberTemplate::compile('D{1-9');
    }

    public function test_an_unclosed_quote_is_refused(): void
    {
        $this->expectException(InvalidCardNumberTemplateException::class);

        CardNumberTemplate::compile("'LAB-DDDD");
    }

    public function test_numbers_do_not_run_in_sequence(): void
    {
        $template = CardNumberTemplate::compile('DDDDDDDD');
        $numbers = [];

        for ($i = 0; $i < 200; $i++) {
            $numbers[] = $template->generate();
        }

        // The whole point of random fill: a holder cannot derive a sibling card.
        $sorted = $numbers;
        sort($sorted);
        $this->assertNotSame($sorted, $numbers, 'Generated numbers should not come out ordered.');
        $this->assertGreaterThan(190, count(array_unique($numbers)), 'Collisions should be rare at this width.');
    }
}

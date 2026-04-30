<?php

namespace Tests\Unit\Notification;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Notifications\PatientReportPublished;
use App\Notifications\Channels\TwilioWhatsAppTemplateChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Mockery;
use Tests\TestCase;

class PatientReportPublishedTest extends TestCase
{
    private function makeAcceptance(array $howReport = []): Acceptance
    {
        $acceptance = Mockery::mock(Acceptance::class)->makePartial();
        $acceptance->shouldReceive('load')->andReturnSelf();
        $acceptance->shouldReceive('getAttribute')->with('howReport')->andReturn($howReport);
        $acceptance->shouldReceive('getAttribute')->with('acceptanceItems')->andReturn(collect([]));
        $acceptance->shouldReceive('getAttribute')->with('id')->andReturn(1);
        $acceptance->howReport = $howReport;
        $acceptance->acceptanceItems = collect([]);
        $acceptance->id = 1;
        return $acceptance;
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    // -------------------------------------------------------------------------
    // N-12: via() includes 'mail' when howReport.email = true
    // -------------------------------------------------------------------------

    public function test_patient_report_published_via_returns_mail_when_email_flag_set(): void
    {
        $acceptance = $this->makeAcceptance(['email' => true, 'whatsapp' => false]);
        $notification = new PatientReportPublished($acceptance);

        $via = $notification->via(new \stdClass());

        $this->assertContains('mail', $via);
        $this->assertNotContains(TwilioWhatsAppTemplateChannel::class, $via);
    }

    // -------------------------------------------------------------------------
    // N-13: via() includes TwilioWhatsAppTemplateChannel when howReport.whatsapp = true
    // -------------------------------------------------------------------------

    public function test_patient_report_published_via_returns_whatsapp_channel_when_flag_set(): void
    {
        $acceptance = $this->makeAcceptance(['email' => false, 'whatsapp' => true]);
        $notification = new PatientReportPublished($acceptance);

        $via = $notification->via(new \stdClass());

        $this->assertContains(TwilioWhatsAppTemplateChannel::class, $via);
        $this->assertNotContains('mail', $via);
    }

    // -------------------------------------------------------------------------
    // N-14: via() returns empty array when neither flag is set
    // -------------------------------------------------------------------------

    public function test_patient_report_published_via_returns_empty_when_no_flags(): void
    {
        $acceptance = $this->makeAcceptance([]);
        $notification = new PatientReportPublished($acceptance);

        $via = $notification->via(new \stdClass());

        $this->assertEmpty($via);
    }

    // -------------------------------------------------------------------------
    // N-15: toMail() returns a MailMessage (with no files when none available)
    // -------------------------------------------------------------------------

    public function test_patient_report_published_to_mail_returns_mail_message(): void
    {
        $acceptance = $this->makeAcceptance(['email' => true]);
        $notification = new PatientReportPublished($acceptance);

        $notifiable = new \stdClass();
        $notifiable->email = 'patient@example.com';
        $notifiable->fullName = 'Test Patient';

        $mail = $notification->toMail($notifiable);

        $this->assertInstanceOf(MailMessage::class, $mail);
        // Subject should be set
        $this->assertNotEmpty($mail->subject);
    }

    // -------------------------------------------------------------------------
    // N-16: toWhatsAppTemplate() returns correct structure
    // -------------------------------------------------------------------------

    public function test_patient_report_published_to_whatsapp_template_returns_correct_params(): void
    {
        config(['services.twilio.templates.acceptance_report_published' => 'HXabc123']);

        $acceptance = $this->makeAcceptance([
            'whatsapp'       => true,
            'whatsappNumber' => '+96891234567',
        ]);
        $notification = new PatientReportPublished($acceptance);

        $notifiable = new \stdClass();
        $notifiable->fullName = 'Ali Hassan';
        $notifiable->phone = '+96891234567';

        $result = $notification->toWhatsAppTemplate($notifiable);

        $this->assertArrayHasKey('name', $result);
        $this->assertArrayHasKey('to', $result);
        $this->assertArrayHasKey('parameters', $result);

        // Template name comes from config
        $this->assertEquals('HXabc123', $result['name']);

        // 'to' is the whatsapp number from howReport
        $this->assertEquals('+96891234567', $result['to']);

        // Patient name in parameter 1
        $this->assertEquals('Ali Hassan', $result['parameters']['1']);
    }
}

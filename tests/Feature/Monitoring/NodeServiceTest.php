<?php

namespace Tests\Feature\Monitoring;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Monitoring\Models\MonitoringNode;
use App\Domains\Monitoring\Models\MonitoringSample;
use App\Domains\Monitoring\Services\MocreoService;
use App\Domains\Monitoring\Services\NodeService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class NodeServiceTest extends TestCase
{
    use RefreshDatabase;

    private NodeService $service;

    protected function setUp(): void
    {
        parent::setUp();
        // MocreoService is unused by the local-data methods under test.
        $this->service = new NodeService(Mockery::mock(MocreoService::class));
    }

    public function test_get_nodes_maps_local_nodes(): void
    {
        $group = SectionGroup::create(['name' => 'G']);
        $section = Section::create(['name' => 'Fridge Room', 'section_group_id' => $group->id]);
        MonitoringNode::create(['node_id' => 'N1', 'name' => 'Fridge 1', 'section_id' => $section->id]);

        $nodes = $this->service->getNodes();

        $this->assertCount(1, $nodes);
        $this->assertSame('N1', $nodes[0]['nodeId']);
        $this->assertSame('Fridge 1', $nodes[0]['name']);
        $this->assertSame('Fridge Room', $nodes[0]['section_name']);
    }

    public function test_get_node_creates_when_missing(): void
    {
        $data = $this->service->getNode('NEW-NODE');

        $this->assertSame('NEW-NODE', $data['nodeId']);
        $this->assertDatabaseHas('monitoring_nodes', ['node_id' => 'NEW-NODE']);
    }

    public function test_get_samples_maps_and_filters_by_time(): void
    {
        MonitoringSample::create(['node_id' => 'N1', 'sampled_at' => Carbon::parse('2026-06-01 10:00'), 'temperature' => 4.5, 'humidity' => 40]);
        MonitoringSample::create(['node_id' => 'N1', 'sampled_at' => Carbon::parse('2026-06-10 10:00'), 'temperature' => 5.0, 'humidity' => null]);
        // A sample for a different node must be excluded.
        MonitoringSample::create(['node_id' => 'N2', 'sampled_at' => Carbon::parse('2026-06-05 10:00'), 'temperature' => 9.9, 'humidity' => 50]);

        $begin = Carbon::parse('2026-06-05 00:00')->timestamp;
        $samples = $this->service->getSamples('N1', 50, 0, $begin, null);

        $this->assertCount(1, $samples);
        $this->assertSame(5.0, $samples[0]['temperature']);
        $this->assertNull($samples[0]['humidity']);
    }

    public function test_update_local_node_creates_and_fills(): void
    {
        $node = $this->service->updateLocalNode('N9', ['name' => 'Updated', 'notes' => 'cold']);

        $this->assertInstanceOf(MonitoringNode::class, $node);
        $this->assertSame('Updated', $node->name);
        $this->assertDatabaseHas('monitoring_nodes', ['node_id' => 'N9', 'name' => 'Updated']);
    }
}

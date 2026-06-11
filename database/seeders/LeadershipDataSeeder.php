<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Modules\LeadershipAssessment\Models\LeadershipType;
class LeadershipDataSeeder extends Seeder {
    public function run() {
        $types = [
            'Leading Self' => ['Self-Awareness', 'Emotional Intelligence'],
            'Leading Others' => ['Communication', 'Delegation'],
            'Leading Leaders' => ['Strategic Alignment', 'Mentorship'],
            'Leading Function' => ['Operational Excellence', 'Resource Management'],
            'Leading Business' => ['Market Positioning', 'Financial Acumen'],
            'Leading Enterprise' => ['Visionary Leadership', 'Cultural Stewardship']
        ];
        foreach ($types as $typeName => $items) {
            $type = LeadershipType::create(['name' => $typeName]);
            foreach ($items as $itemTitle) {
                $item = $type->items()->create(['title' => $itemTitle]);
                for ($i = 1; $i <= 5; $i++) {
                    $item->rubrics()->create([
                        'level' => $i,
                        'description' => "Description for $itemTitle at level $i"
                    ]);
                }
            }
        }
    }
}

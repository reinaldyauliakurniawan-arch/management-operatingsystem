<?php

namespace App\Modules\VTO\Actions;

use App\Modules\VTO\Models\VTOPlan;

class UpdateVTO
{
    private const RICH_TEXT_FIELDS = [
        'core_focus_purpose',
        'core_focus_niche',
        'target_market',
        'three_uniques',
        'proven_process',
    ];

    private const ALLOWED_TAGS = '<b><strong><i><em><u><ul><ol><li><br><div><p><span>';

    public function execute(array $data): VTOPlan
    {
        $orgId = session('active_organization_id');

        $vto = VTOPlan::withoutGlobalScopes()->firstOrCreate(
            ['organization_id' => $orgId],
            ['organization_id' => $orgId]
        );

        foreach (self::RICH_TEXT_FIELDS as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== null) {
                $data[$field] = $this->sanitizeRichText($data[$field]);
            }
        }

        $vto->update(array_merge($data, ['updated_by' => auth()->id()]));

        return $vto;
    }

    private function sanitizeRichText(string $html): string
    {
        $clean = strip_tags($html, self::ALLOWED_TAGS);

        // Buang semua atribut (onclick, onerror, style, dsb.) dari tag yang tersisa
        return preg_replace('/<([a-z]+)\s+[^>]*>/i', '<$1>', $clean) ?? $clean;
    }
}

<?php

namespace App\Modules\VTO\Actions;

use App\Modules\VTO\Models\VTOPlan;
use Illuminate\Support\Facades\DB;

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
        abort_if(!$orgId, 403, 'Tidak ada active organization.');

        // ponytail: DB::transaction + lockForUpdate on the VTO row prevents the
        // firstOrCreate race (two concurrent requests could each create a row
        // and one would trip the unique constraint, returning 500 to the user).
        return DB::transaction(function () use ($data, $orgId) {
            $vto = VTOPlan::withoutGlobalScopes()
                ->where('organization_id', $orgId)
                ->lockForUpdate()
                ->first();

            if (!$vto) {
                $vto = VTOPlan::withoutGlobalScopes()->create([
                    'organization_id' => $orgId,
                    'created_by'      => auth()->id(),
                ]);
            }

            foreach (self::RICH_TEXT_FIELDS as $field) {
                if (array_key_exists($field, $data) && $data[$field] !== null) {
                    $data[$field] = $this->sanitizeRichText($data[$field]);
                }
            }

            $vto->update(array_merge($data, ['updated_by' => auth()->id()]));

            return $vto;
        });
    }

    /**
     * ponytail: strip tags then aggressively strip all attributes — including
     * the unquoted-handler case (`<span onclick=alert(1)>`) that the old regex
     * missed. Two passes: (1) strip dangerous protocols/handlers from any tag,
     * (2) strip disallowed tag names entirely.
     */
    private function sanitizeRichText(string $html): string
    {
        $clean = strip_tags($html, self::ALLOWED_TAGS);

        // Strip every attribute from every surviving tag.
        $clean = preg_replace_callback(
            '/<([a-z0-9]+)([^>]*)>/i',
            fn($m) => '<' . strtolower($m[1]) . '>',
            $clean,
        );

        // Remove any lingering javascript: URLs.
        $clean = preg_replace('#javascript\s*:#i', '', $clean) ?? $clean;

        return trim($clean);
    }
}

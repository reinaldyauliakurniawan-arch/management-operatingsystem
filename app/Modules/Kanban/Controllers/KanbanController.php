<?php

namespace App\Modules\Kanban\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Kanban\Models\KanbanBoard;
use App\Modules\Kanban\Models\KanbanCard;
use App\Modules\Kanban\Models\KanbanCardStep;
use App\Modules\Kanban\Models\KanbanColumn;
use App\Modules\Kanban\Resources\KanbanBoardResource;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KanbanController extends Controller
{
    public function index(Request $request)
    {
        $teamId = TenantContext::teamId();
        abort_if(!$teamId, 403, 'Tidak ada active team.');

        $boards = KanbanBoard::where('team_id', $teamId)->orderBy('id')->get();

        $activeBoardId = (int) $request->query('board', $boards->first()?->id);
        $activeBoard = $boards->firstWhere('id', $activeBoardId) ?? $boards->first();

        $activeBoard?->load(['columns.cards.steps']);

        return Inertia::render('Kanban/Index', [
            'boards' => $boards->map(fn($b) => ['id' => $b->id, 'title' => $b->title]),
            'activeBoard' => $activeBoard ? (new KanbanBoardResource($activeBoard))->resolve() : null,
        ]);
    }

    // ponytail: board CRUD
    public function storeBoard(Request $request)
    {
        $teamId = TenantContext::teamId();
        $validated = $request->validate(['title' => 'required|string|max:255']);

        $board = KanbanBoard::create([
            'team_id' => $teamId,
            'title'   => $validated['title'],
        ]);

        return back()->with('message', 'Board dibuat.')->with('newBoardId', $board->id);
    }

    public function updateBoard(Request $request, KanbanBoard $board)
    {
        abort_unless($board->team_id === TenantContext::teamId(), 403);
        $validated = $request->validate(['title' => 'required|string|max:255']);
        $board->update($validated);

        return back()->with('message', 'Board diperbarui.');
    }

    public function destroyBoard(KanbanBoard $board)
    {
        abort_unless($board->team_id === TenantContext::teamId(), 403);
        $board->delete();

        return back()->with('message', 'Board dihapus.');
    }

    // ponytail: column CRUD, ownership checked via board.team_id
    public function storeColumn(Request $request, KanbanBoard $board)
    {
        abort_unless($board->team_id === TenantContext::teamId(), 403);
        $validated = $request->validate(['title' => 'required|string|max:255']);

        $maxOrder = $board->columns()->max('sort_order') ?? -1;
        $board->columns()->create([
            'title'      => $validated['title'],
            'sort_order' => $maxOrder + 1,
        ]);

        return back()->with('message', 'Kolom ditambah.');
    }

    public function updateColumn(Request $request, KanbanColumn $column)
    {
        abort_unless($column->board->team_id === TenantContext::teamId(), 403);
        $validated = $request->validate(['title' => 'required|string|max:255']);
        $column->update($validated);

        return back()->with('message', 'Kolom diperbarui.');
    }

    public function destroyColumn(KanbanColumn $column)
    {
        abort_unless($column->board->team_id === TenantContext::teamId(), 403);
        $column->delete();

        return back()->with('message', 'Kolom dihapus.');
    }

    // ponytail: card CRUD
    public function storeCard(Request $request, KanbanColumn $column)
    {
        abort_unless($column->board->team_id === TenantContext::teamId(), 403);
        $validated = $request->validate(['title' => 'required|string|max:255']);

        $maxOrder = $column->cards()->max('sort_order') ?? -1;
        $column->cards()->create([
            'title'      => $validated['title'],
            'sort_order' => $maxOrder + 1,
        ]);

        return back()->with('message', 'Card ditambah.');
    }

    public function updateCard(Request $request, KanbanCard $card)
    {
        abort_unless($card->column->board->team_id === TenantContext::teamId(), 403);

        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'description'         => 'nullable|string',
            'responsible'         => 'nullable|string|max:255',
            'accountable'         => 'nullable|string|max:255',
            'consulted'           => 'nullable|string|max:255',
            'informed'            => 'nullable|string|max:255',
            'definition_of_done'  => 'nullable|string',
            'outcome'             => 'nullable|string',
            'due_date'            => 'nullable|date',
        ]);
        $card->update($validated);

        return back()->with('message', 'Card diperbarui.');
    }

    // ponytail: single endpoint handles both reorder-in-column and move-across-column
    public function moveCard(Request $request, KanbanCard $card)
    {
        abort_unless($card->column->board->team_id === TenantContext::teamId(), 403);

        $validated = $request->validate([
            'column_id'  => 'required|exists:kanban_columns,id',
            'sort_order' => 'required|integer|min:0',
        ]);

        $targetColumn = KanbanColumn::findOrFail($validated['column_id']);
        abort_unless($targetColumn->board->team_id === TenantContext::teamId(), 403);

        $card->update($validated);

        return back();
    }

    public function destroyCard(KanbanCard $card)
    {
        abort_unless($card->column->board->team_id === TenantContext::teamId(), 403);
        $card->delete();

        return back()->with('message', 'Card dihapus.');
    }

    // ponytail: step (checklist item) CRUD
    public function storeStep(Request $request, KanbanCard $card)
    {
        abort_unless($card->column->board->team_id === TenantContext::teamId(), 403);
        $validated = $request->validate(['title' => 'required|string|max:255']);

        $maxOrder = $card->steps()->max('sort_order') ?? -1;
        $card->steps()->create([
            'title'      => $validated['title'],
            'sort_order' => $maxOrder + 1,
        ]);

        return back()->with('message', 'Step ditambah.');
    }

    public function toggleStep(KanbanCardStep $step)
    {
        abort_unless($step->card->column->board->team_id === TenantContext::teamId(), 403);
        $step->update(['is_done' => !$step->is_done]);

        return back();
    }

    public function destroyStep(KanbanCardStep $step)
    {
        abort_unless($step->card->column->board->team_id === TenantContext::teamId(), 403);
        $step->delete();

        return back()->with('message', 'Step dihapus.');
    }
}

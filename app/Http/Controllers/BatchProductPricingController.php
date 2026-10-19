<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Group;
use App\Services\BatchPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class BatchProductPricingController extends Controller implements HasMiddleware
{
    public function __construct(
        protected BatchPricingService $batchPricingService
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('permission:products.view', only: ['index', 'preview']),
            new Middleware('permission:products.edit', only: ['apply']),
        ];
    }

    /**
     * Display the batch product price changer interface.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSuperAdmin = (bool) $user->is_super_admin;

        if ($isSuperAdmin) {
            $branches = Branch::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']);
            $selectedBranchId = $request->query('branch_id', (string) ($branches->first()?->id ?? 'all'));
        } else {
            $branches = Branch::where('id', $user->branch_id)->get(['id', 'name', 'code']);
            $selectedBranchId = (string) $user->branch_id;
        }

        $categories = Category::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        $groupsQuery = Group::withoutGlobalScopes()->where('is_active', true)->orderBy('name');
        if (!$isSuperAdmin || ($selectedBranchId !== 'all' && is_numeric($selectedBranchId))) {
            $effectiveBranchId = $isSuperAdmin ? (int) $selectedBranchId : (int) $user->branch_id;
            $groupsQuery->where('branch_id', $effectiveBranchId);
        }
        $groups = $groupsQuery->get(['id', 'name', 'branch_id']);

        return Inertia::render('Product/BatchPricing', [
            'branches' => $branches,
            'categories' => $categories,
            'groups' => $groups,
            'selectedBranchId' => $selectedBranchId,
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    /**
     * Return live preview data (total affected count + sample 10 products with diff).
     */
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'branch_id' => ['required', 'string'],
            'scope_type' => ['required', 'in:all,category,group'],
            'scope_id' => ['nullable', 'integer'],
            'target_field' => ['required', 'in:selling_price,cost_price,both'],
            'percentage' => ['required', 'numeric', 'between:-100,1000'],
            'rounding' => ['required', 'in:none,nearest_50,nearest_100,round_up_100,round_down_100'],
        ]);

        $user = $request->user();
        $rawBranchId = $request->input('branch_id');

        if (!$user->is_super_admin) {
            $effectiveBranchId = (int) $user->branch_id;
        } else {
            $effectiveBranchId = ($rawBranchId === 'all' || empty($rawBranchId))
                ? null
                : (int) $rawBranchId;
        }

        $previewData = $this->batchPricingService->getPreviewData(
            branchId: $effectiveBranchId,
            scopeType: $request->input('scope_type'),
            scopeId: $request->filled('scope_id') ? (int) $request->input('scope_id') : null,
            targetField: $request->input('target_field'),
            percentage: (float) $request->input('percentage'),
            rounding: $request->input('rounding')
        );

        return response()->json($previewData);
    }

    /**
     * Apply the batch price adjustment in chunked transactions.
     */
    public function apply(Request $request): RedirectResponse
    {
        $request->validate([
            'branch_id' => ['required', 'string'],
            'scope_type' => ['required', 'in:all,category,group'],
            'scope_id' => ['nullable', 'integer'],
            'target_field' => ['required', 'in:selling_price,cost_price,both'],
            'percentage' => ['required', 'numeric', 'between:-100,1000'],
            'rounding' => ['required', 'in:none,nearest_50,nearest_100,round_up_100,round_down_100'],
            'custom_note' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $rawBranchId = $request->input('branch_id');

        if (!$user->is_super_admin) {
            $branchIds = [(int) $user->branch_id];
        } else {
            if ($rawBranchId === 'all') {
                $branchIds = Branch::where('is_active', true)->pluck('id')->all();
            } else {
                $branchIds = [(int) $rawBranchId];
            }
        }

        $count = $this->batchPricingService->applyBatchUpdate(
            branchIds: $branchIds,
            scopeType: $request->input('scope_type'),
            scopeId: $request->filled('scope_id') ? (int) $request->input('scope_id') : null,
            targetField: $request->input('target_field'),
            percentage: (float) $request->input('percentage'),
            rounding: $request->input('rounding'),
            customNote: $request->input('custom_note'),
            userId: (int) $user->id
        );

        return redirect()->back()->with('success', "Batch pricing updated successfully for {$count} record(s).");
    }
}

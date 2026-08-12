<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(private ReportService $reportService)
    {
    }

    /**
     * Sales Report
     */
    public function salesReport(Request $request): Response
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $branchId = $request->get('branch_id');
        $groupBy = $request->get('group_by', 'daily');

        $data = $this->reportService->getSalesReportData($startDate, $endDate, $branchId, $groupBy);

        return Inertia::render('Report/SalesReport', $data);
    }

    /**
     * Low Stock Report
     */
    public function lowStockReport(Request $request): Response
    {
        $branchId = $request->get('branch_id');
        $threshold = $request->get('threshold', 10);

        $data = $this->reportService->getLowStockReportData($branchId, $threshold);

        return Inertia::render('Report/LowStockReport', $data);
    }

    /**
     * Daily Sales Summary (for Dashboard)
     */
    public function dailySummary(): array
    {
        return $this->reportService->getDailySummaryData();
    }

    /**
     * Daily Profit Report
     */
    public function dailyProfitReport(Request $request): Response
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $branchId = $request->get('branch_id');
        $user = $request->user();

        $data = $this->reportService->getDailyProfitReportData($user, $date, $branchId);

        return Inertia::render('Report/DailyProfitReport', $data);
    }
}

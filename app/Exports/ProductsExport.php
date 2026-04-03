<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    protected Collection $products;
    protected Collection $branches;

    public function __construct(Collection $products, Collection $branches)
    {
        $this->products = $products;
        $this->branches = $branches;
    }

    public function collection(): Collection
    {
        return $this->products->map(function ($product) {
            $row = [
                $product->code,
                $product->name,
                $product->category?->name ?? '-',
            ];

            // Add branch data per visible branch
            foreach ($this->branches as $branch) {
                $branchStock = $product->branchStocks->firstWhere('branch_id', $branch->id);
                
                $row[] = $branchStock ? (int) $branchStock->quantity : 0;
                $row[] = $branchStock?->group?->name ?? '-';
                $row[] = $branchStock?->cost_price !== null ? (float) $branchStock->cost_price : '-';
                $row[] = $branchStock?->selling_price !== null ? (float) $branchStock->selling_price : '-';
            }

            $row[] = $product->is_active ? 'Active' : 'Inactive';

            return $row;
        });
    }

    public function headings(): array
    {
        $headings = [
            'Code',
            'Name',
            'Category',
        ];

        foreach ($this->branches as $branch) {
            $headings[] = "Stock";
            $headings[] = "Group";
            $headings[] = "Cost Price";
            $headings[] = "Selling Price";
        }

        $headings[] = 'Status';

        return $headings;
    }

    public function title(): string
    {
        return 'Products Export';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

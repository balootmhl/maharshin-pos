<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ConvertExcelToJson extends Command
{
    protected $signature = 'import:excel-to-json
                            {file : Path to the Excel file (relative to project root)}
                            {--output=database/data/products.json : Output JSON file path}';

    protected $description = 'Convert an Excel product export to JSON format for seeding';

    public function handle(): int
    {
        $filePath = base_path($this->argument('file'));

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return self::FAILURE;
        }

        $this->info("Reading Excel file: {$filePath}");

        $spreadsheet = IOFactory::load($filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        // First row is the header
        $header = array_shift($rows);
        $this->info("Found columns: " . implode(', ', $header));

        // Map header names to our expected keys
        $columnMap = $this->mapColumns($header);

        if (empty($columnMap)) {
            $this->error('Could not map required columns. Expected: Code, Product Name, Category Name, Buy Price, Sale Price, Quantity, Group');
            return self::FAILURE;
        }

        $this->info("Mapped columns: " . json_encode($columnMap, JSON_PRETTY_PRINT));

        $products = [];
        $skipped = 0;

        foreach ($rows as $index => $row) {
            $code = trim($row[$columnMap['code']] ?? '');
            $name = trim($row[$columnMap['name']] ?? '');

            // Skip empty rows
            if (empty($code) && empty($name)) {
                $skipped++;
                continue;
            }

            $product = [
                'code' => $code,
                'name' => $name,
                'category_name' => trim($row[$columnMap['category_name']] ?? ''),
                'buy_price' => $this->parseNumber($row[$columnMap['buy_price']] ?? 0),
                'sale_price' => $this->parseNumber($row[$columnMap['sale_price']] ?? 0),
                'quantity' => (int) ($row[$columnMap['quantity']] ?? 0),
                'group' => trim($row[$columnMap['group']] ?? ''),
            ];

            $products[] = $product;
        }

        $this->info("Processed " . count($products) . " products (skipped {$skipped} empty rows)");

        // Ensure output directory exists
        $outputPath = base_path($this->option('output'));
        $outputDir = dirname($outputPath);
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        // Write JSON with pretty print and Unicode support
        $json = json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        file_put_contents($outputPath, $json);

        $this->info("JSON written to: {$outputPath}");

        // Show summary
        $categories = array_unique(array_column($products, 'category_name'));
        $groups = array_unique(array_filter(array_column($products, 'group')));
        $this->newLine();
        $this->info("Summary:");
        $this->info("  Products: " . count($products));
        $this->info("  Categories: " . count($categories) . " (" . implode(', ', $categories) . ")");
        $this->info("  Groups: " . count($groups));

        // Show first 5 products as preview
        $this->newLine();
        $this->info("Preview (first 5 products):");
        $this->table(
            ['Code', 'Name', 'Category', 'Buy', 'Sale', 'Qty', 'Group'],
            array_map(fn($p) => [
                $p['code'],
                mb_substr($p['name'], 0, 30),
                $p['category_name'],
                $p['buy_price'],
                $p['sale_price'],
                $p['quantity'],
                $p['group'],
            ], array_slice($products, 0, 5))
        );

        return self::SUCCESS;
    }

    private function mapColumns(array $header): array
    {
        $map = [];
        $patterns = [
            'code' => ['code', 'product_code', 'product code', 'sku'],
            'name' => ['product name', 'product_name', 'name', 'description'],
            'category_name' => ['category name', 'category_name', 'category'],
            'buy_price' => ['buy price', 'buy_price', 'cost', 'cost price', 'purchase price'],
            'sale_price' => ['sale price', 'sale_price', 'selling price', 'price'],
            'quantity' => ['quantity', 'qty', 'stock', 'stock quantity'],
            'group' => ['group', 'group_name', 'group name'],
        ];

        foreach ($header as $index => $col) {
            $normalized = strtolower(trim($col));
            foreach ($patterns as $key => $aliases) {
                if (in_array($normalized, $aliases) && !isset($map[$key])) {
                    $map[$key] = $index;
                }
            }
        }

        return $map;
    }

    private function parseNumber($value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }
        // Remove commas and other non-numeric chars except dots
        return (float) preg_replace('/[^0-9.]/', '', (string) $value);
    }
}

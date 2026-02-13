<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryStoreRequest;
use App\Http\Requests\CategoryUpdateRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = QueryBuilder::for(Category::class)
            ->allowedFilters([
                'code',
                'name',
                'description',
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['code', 'name', 'created_at'])
            ->defaultSort('name')
            ->paginate($request->input('per_page', 25))
            ->withQueryString();

        return Inertia::render('Category/index', [
            'categories' => $categories,
        ]);
    }

    public function create(Request $request): Response
    {
        $categories = Category::all(); // For parent category dropdown

        return Inertia::render('Category/create', [
            'categories' => $categories,
        ]);
    }

    public function store(CategoryStoreRequest $request): RedirectResponse
    {
        $category = Category::create($request->validated());

        $request->session()->flash('category.id', $category->id);

        return redirect()->route('categories.index')->with('success', 'Category created successfully.');
    }

    public function show(Request $request, Category $category): Response
    {
        return Inertia::render('Category/show', [
            'category' => $category,
        ]);
    }

    public function edit(Request $request, Category $category): Response
    {
        $categories = Category::where('id', '!=', $category->id)->get(); // Exclude self

        return Inertia::render('Category/edit', [
            'category' => $category,
            'categories' => $categories,
        ]);
    }

    public function update(CategoryUpdateRequest $request, Category $category): RedirectResponse
    {
        $category->update($request->validated());

        $request->session()->flash('category.id', $category->id);

        return redirect()->route('categories.index')->with('success', 'Category updated successfully.');
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        $category->delete();

        return redirect()->route('categories.index')->with('success', 'Category deleted successfully.');
    }
}

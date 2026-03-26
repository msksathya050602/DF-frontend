"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  Category,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/services/api/catalog";

import { useAdminAction } from "../_lib/useAdminAction";

export default function DashboardCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  const reload = useCallback(async () => {
    const data = await getCategories();
    setCategories(data.categories || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    await runAction(async () => {
      await createCategory({
        categoryName: categoryName.trim(),
      });
      setCategoryName("");
    }, "Category created successfully.");
  };

  const editCategory = async (category: Category) => {
    const nextName = window.prompt("Category name", category.categoryName) ?? category.categoryName;
    await runAction(
      async () =>
        updateCategory(category.id, {
          categoryName: nextName.trim() || category.categoryName,
        }),
      "Category updated successfully.",
    );
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    await runAction(async () => deleteCategory(id), "Category deleted successfully.");
  };

  return (
    <section className="dashboard-card">
      <h2>Categories</h2>
      {actionMessage && <p className="info-text">{actionMessage}</p>}
      {loadError && <p className="error-text">{loadError}</p>}
      <form className="branch-form" onSubmit={handleCreate}>
        <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Category name" />
        <button type="submit" disabled={isActing}>
          Create
        </button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((item) => (
            <tr key={item.id}>
              <td>{item.categoryName}</td>
              <td>{item.categoryCode}</td>
              <td>{item.isActive ? "Active" : "Inactive"}</td>
              <td className="actions-cell">
                <button type="button" onClick={() => void editCategory(item)} disabled={isActing}>
                  Edit
                </button>
                <button type="button" onClick={() => void remove(item.id)} disabled={isActing}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!categories.length && !isLoading && (
            <tr>
              <td colSpan={4}>No categories</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

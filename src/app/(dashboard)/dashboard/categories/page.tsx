"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  Category,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/services/api/catalog";

import { AdminDeleteModal, AdminEditModal } from "../_lib/adminModals";
import { useAdminAction } from "../_lib/useAdminAction";

export default function DashboardCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editFormError, setEditFormError] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

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

  const openEditModal = (category: Category) => {
    setEditFormError("");
    setEditCategory(category);
    setEditName(category.categoryName);
  };

  const closeEditModal = () => {
    setEditCategory(null);
    setEditName("");
    setEditFormError("");
  };

  const submitEditCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editCategory) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditFormError("Enter a category name.");
      return;
    }
    setEditFormError("");
    const cat = editCategory;
    closeEditModal();
    await runAction(
      async () =>
        updateCategory(cat.id, {
          categoryName: trimmed,
        }),
      "Category updated successfully.",
    );
  };

  const closeDeleteModal = () => setDeleteCategoryId(null);

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    const id = deleteCategoryId;
    closeDeleteModal();
    await runAction(async () => deleteCategory(id), "Category deleted successfully.");
  };

  return (
    <>
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
                  <button type="button" onClick={() => openEditModal(item)} disabled={isActing}>
                    Edit
                  </button>
                  <button type="button" onClick={() => setDeleteCategoryId(item.id)} disabled={isActing}>
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

      <AdminEditModal
        isOpen={!!editCategory}
        title="Edit category"
        subtitle={
          editCategory ? (
            <p className="dashboard-editModal-meta">
              Code <strong>{editCategory.categoryCode}</strong>
            </p>
          ) : null
        }
        formError={editFormError}
        isActing={isActing}
        onClose={closeEditModal}
        onSubmit={submitEditCategory}
      >
        <label className="dashboard-editModal-field">
          <span className="dashboard-editModal-label">Category name</span>
          <input
            type="text"
            autoComplete="off"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              if (editFormError) setEditFormError("");
            }}
            placeholder="Category name"
          />
        </label>
      </AdminEditModal>

      <AdminDeleteModal
        isOpen={!!deleteCategoryId}
        title="Delete this category?"
        description="Products in this category may be affected. Ensure no products depend on it before deleting."
        isActing={isActing}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCategory}
      />
    </>
  );
}

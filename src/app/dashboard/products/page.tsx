"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  Category,
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  Product,
  updateProduct,
} from "@/services/api/catalog";

import { useAdminAction } from "../_lib/useAdminAction";

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productName, setProductName] = useState("");

  const reload = useCallback(async () => {
    const [p, c] = await Promise.all([getProducts(), getCategories()]);
    setProducts(p.products || []);
    setCategories(c.categories || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const { isActing, actionMessage, loadError, runAction } = useAdminAction(reload);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productCategoryId || !productName.trim()) return;
    await runAction(async () => {
      await createProduct({
        categoryId: productCategoryId,
        productName: productName.trim(),
      });
      setProductName("");
    }, "Product created successfully.");
  };

  const editProduct = async (product: Product) => {
    const nextName = window.prompt("Product name", product.productName) ?? product.productName;
    await runAction(
      async () =>
        updateProduct(product.id, {
          productName: nextName.trim() || product.productName,
        }),
      "Product updated successfully.",
    );
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    await runAction(async () => deleteProduct(id), "Product deleted successfully.");
  };

  return (
    <section className="dashboard-card">
      <h2>Products</h2>
      {actionMessage && <p className="info-text">{actionMessage}</p>}
      {loadError && <p className="error-text">{loadError}</p>}
      <form className="branch-form" onSubmit={handleCreate}>
        <select value={productCategoryId} onChange={(e) => setProductCategoryId(e.target.value)}>
          <option value="">Category</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.categoryName}
            </option>
          ))}
        </select>
        <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product name" />
        <button type="submit" disabled={isActing}>
          Create
        </button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => (
            <tr key={item.id}>
              <td>{item.productName}</td>
              <td>{item.productCode}</td>
              <td>{item.category?.categoryName || "-"}</td>
              <td>{item.isActive ? "Active" : "Inactive"}</td>
              <td className="actions-cell">
                <button type="button" onClick={() => void editProduct(item)} disabled={isActing}>
                  Edit
                </button>
                <button type="button" onClick={() => void remove(item.id)} disabled={isActing}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!products.length && !isLoading && (
            <tr>
              <td colSpan={5}>No products</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

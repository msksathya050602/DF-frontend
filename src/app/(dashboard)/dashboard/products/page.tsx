'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import AppDropdown from '@library/AppDropdown';

import {
  Category,
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  Product,
  updateProduct,
} from '@/services/api/catalog';

import { AdminDeleteModal, AdminEditModal } from '../_lib/adminModals';
import { useAdminAction } from '../_lib/useAdminAction';

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productName, setProductName] = useState('');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

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
      setProductName('');
    }, 'Product created successfully.');
  };

  const openEditModal = (product: Product) => {
    setEditFormError('');
    setEditProduct(product);
    setEditName(product.productName);
    setEditCategoryId(product.categoryId || '');
  };

  const closeEditModal = () => {
    setEditProduct(null);
    setEditName('');
    setEditCategoryId('');
    setEditFormError('');
  };

  const submitEditProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editProduct) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditFormError('Enter a product name.');
      return;
    }
    if (!editCategoryId) {
      setEditFormError('Select a category.');
      return;
    }
    setEditFormError('');
    const product = editProduct;
    const nextCategoryId = editCategoryId;
    const categoryMeta = categories.find((c) => c.id === nextCategoryId);
    closeEditModal();
    await runAction(async () => {
      const { product: updated } = await updateProduct(product.id, {
        productName: trimmed,
        categoryId: nextCategoryId,
      });
      setProducts((prev) =>
        prev.map((row) =>
          row.id === updated.id
            ? {
                ...row,
                ...updated,
                category: categoryMeta ?? updated.category,
              }
            : row
        )
      );
    }, 'Product updated successfully.');
  };

  const closeDeleteModal = () => setDeleteProductId(null);

  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;
    const id = deleteProductId;
    closeDeleteModal();
    await runAction(async () => deleteProduct(id), 'Product deleted successfully.');
  };

  return (
    <>
      <section className="dashboard-card">
        <h2>Products</h2>
        {actionMessage && <p className="info-text">{actionMessage}</p>}
        {loadError && <p className="error-text">{loadError}</p>}
        <form className="branch-form" onSubmit={handleCreate}>
          <AppDropdown
            className="appDropdown--fill"
            value={productCategoryId}
            onChange={setProductCategoryId}
            listTitle="Category"
            placeholder="Category"
            allowEmpty
            emptyLabel="Category"
            options={categories.map((item) => ({
              value: item.id,
              label: item.categoryName,
            }))}
          />
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name"
          />
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
                <td>{item.category?.categoryName || '-'}</td>
                <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                <td className="actions-cell">
                  <button type="button" onClick={() => openEditModal(item)} disabled={isActing}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteProductId(item.id)}
                    disabled={isActing}
                  >
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

      <AdminEditModal
        isOpen={!!editProduct}
        title="Edit product"
        subtitle={
          editProduct ? (
            <p className="dashboard-editModal-meta">
              Code <strong>{editProduct.productCode}</strong>
            </p>
          ) : null
        }
        formError={editFormError}
        isActing={isActing}
        onClose={closeEditModal}
        onSubmit={submitEditProduct}
      >
        <label className="dashboard-editModal-field">
          <span className="dashboard-editModal-label">Product name</span>
          <input
            type="text"
            autoComplete="off"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              if (editFormError) setEditFormError('');
            }}
            placeholder="Product name"
          />
        </label>
        <div className="dashboard-editModal-field">
          <span className="dashboard-editModal-label">Category</span>
          <AppDropdown
            className="appDropdown--fill"
            value={editCategoryId}
            onChange={(id) => {
              setEditCategoryId(id);
              if (editFormError) setEditFormError('');
            }}
            listTitle="Category"
            placeholder="Category"
            allowEmpty
            emptyLabel="Choose category"
            options={categories.map((item) => ({
              value: item.id,
              label: item.categoryName,
            }))}
          />
        </div>
      </AdminEditModal>

      <AdminDeleteModal
        isOpen={!!deleteProductId}
        title="Delete this product?"
        description="This removes the product from the catalog. Related pricing may need to be updated separately."
        isActing={isActing}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteProduct}
      />
    </>
  );
}

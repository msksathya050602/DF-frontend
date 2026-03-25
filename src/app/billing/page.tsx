"use client";

import "./billing.scss";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getStorageKey, LocalStorage, removeStorageKey, setStorageKey } from "@/helpers/storage";
import { ROUTES } from "@/routes";
import { getCurrentUser } from "@/services/api/auth";
import { type Branch, getBranches } from "@/services/api/branches";
import { type Pricing, getPricing } from "@/services/api/catalog";
import { createCustomer, type Customer, getCustomerOrders, getCustomers } from "@/services/api/customers";
import { createOrder, getOrders, type Order } from "@/services/api/orders";

type BillingLine = {
  productId: string;
  serviceId: string;
  productName: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  availableServices: {
    serviceId: string;
    serviceName: string;
    unitPrice: number;
    currency: string;
  }[];
};

type View = "create" | "history";
type CategoryOption = {
  id: string;
  categoryName: string;
  categoryCode: string;
};
type CatalogProductCard = {
  productId: string;
  productName: string;
  categoryName: string;
  minPrice: number;
  currency: string;
};
type CreateStep = 1 | 2 | 3;

const toNumber = (value: string | number | null | undefined) => Number(value || 0);

export default function BillingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pricingRows, setPricingRows] = useState<Pricing[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedTab, setSelectedTab] = useState<View>("create");
  const [cart, setCart] = useState<BillingLine[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [screenError, setScreenError] = useState("");
  const [screenSuccess, setScreenSuccess] = useState("");
  const [customerPhoneInput, setCustomerPhoneInput] = useState("");
  const [selectedCategoryCode, setSelectedCategoryCode] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [showOnboardCustomer, setShowOnboardCustomer] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const selectedBranch = useMemo(
    () => branches.find((item) => item.id === selectedBranchId) || null,
    [branches, selectedBranchId],
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  );

  const branchOrders = useMemo(
    () => orders.filter((order) => !selectedBranchId || order.branchId === selectedBranchId),
    [orders, selectedBranchId],
  );
  const todayOrdersCount = useMemo(() => {
    const today = new Date().toDateString();
    return branchOrders.filter((order) => new Date(order.createdAt).toDateString() === today).length;
  }, [branchOrders]);
  const inProgressCount = useMemo(
    () => branchOrders.filter((order) => String(order.orderStatus || "").toLowerCase().includes("progress")).length,
    [branchOrders],
  );
  const revenueMtd = useMemo(
    () => branchOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0),
    [branchOrders],
  );

  const normalizeRoles = (roles: unknown): string[] => {
    const list = Array.isArray(roles) ? roles : [];
    return list
      .flatMap((r) => {
        const str = String(r ?? "");
        if (str.includes("[") && str.includes("]")) {
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            // ignore
          }
        }
        return [str];
      })
      .map((r) => String(r).replace(/[[\]"]/g, "").trim().toLowerCase())
      .filter(Boolean);
  };

  const selectedCustomer = useMemo(
    () => customers.find((item) => item.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const seen = new Set<string>();
    const list: CategoryOption[] = [];
    for (const row of pricingRows) {
      const category = row.product?.category;
      if (!category) continue;
      if (seen.has(category.categoryCode)) continue;
      seen.add(category.categoryCode);
      list.push({
        id: category.id,
        categoryName: category.categoryName,
        categoryCode: category.categoryCode,
      });
    }
    return list.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [pricingRows]);

  const serviceOptions = useMemo(() => {
    const seen = new Set<string>();
    return pricingRows
      .filter((row) => !selectedCategoryCode || row.product?.category?.categoryCode === selectedCategoryCode)
      .map((row) => row.service)
      .filter((service): service is NonNullable<Pricing["service"]> => !!service)
      .filter((service) => {
        if (seen.has(service.id)) return false;
        seen.add(service.id);
        return true;
      })
      .sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }, [pricingRows, selectedCategoryCode]);

  const servicesByProduct = useMemo(() => {
    const map = new Map<string, BillingLine["availableServices"]>();
    pricingRows.forEach((row) => {
      if (!row.product || !row.service) return;
      if (selectedCategoryCode && row.product.category?.categoryCode !== selectedCategoryCode) return;
      if (selectedServiceId && row.serviceId !== selectedServiceId) return;
      if (
        productSearch.trim() &&
        !row.product.productName.toLowerCase().includes(productSearch.trim().toLowerCase())
      ) {
        return;
      }
      const list = map.get(row.productId) || [];
      if (!list.some((item) => item.serviceId === row.serviceId)) {
        list.push({
          serviceId: row.serviceId,
          serviceName: row.service.serviceName,
          unitPrice: toNumber(row.price),
          currency: row.currency || "INR",
        });
      }
      map.set(
        row.productId,
        list.sort((a, b) => a.serviceName.localeCompare(b.serviceName)),
      );
    });
    return map;
  }, [pricingRows, selectedCategoryCode, selectedServiceId, productSearch]);

  const catalogProducts = useMemo<CatalogProductCard[]>(() => {
    const map = new Map<string, CatalogProductCard>();
    pricingRows.forEach((row) => {
      if (!row.product || !row.service) return;
      if (selectedCategoryCode && row.product.category?.categoryCode !== selectedCategoryCode) return;
      if (selectedServiceId && row.serviceId !== selectedServiceId) return;
      if (
        productSearch.trim() &&
        !row.product.productName.toLowerCase().includes(productSearch.trim().toLowerCase())
      ) {
        return;
      }
      const price = toNumber(row.price);
      const existing = map.get(row.productId);
      if (!existing || price < existing.minPrice) {
        map.set(row.productId, {
          productId: row.productId,
          productName: row.product.productName,
          categoryName: row.product.category?.categoryName || "-",
          minPrice: price,
          currency: row.currency || "INR",
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [pricingRows, selectedCategoryCode, selectedServiceId, productSearch]);

  const loadOrders = async (customerId: string) => {
    if (!customerId) {
      setOrders([]);
      return;
    }
    try {
      const historyResponse = await getCustomerOrders(customerId);
      setOrders(historyResponse.orders || []);
    } catch {
      const fallback = await getOrders();
      setOrders(fallback.orders || []);
    }
  };

  const loadAllOrders = async () => {
    try {
      const response = await getOrders();
      setOrders(response.orders || []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const token = getStorageKey(LocalStorage.ACCESS_TOKEN);
      if (!token) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      try {
        const me = await getCurrentUser();
        const normalizedRoles = normalizeRoles(me.roles);
        // Admin and user both can access the billing dashboard.
        setUserName(me.userName || "User");
        setUserEmail(me.email || "");

        const [branchResult, pricingResult, customerResult] = await Promise.all([
          getBranches(),
          getPricing(),
          getCustomers(),
        ]);

        const activeBranches = (branchResult.branches || []).filter((item) => item.isActive);
        const activePricing = (pricingResult.pricing || []).filter((item) => item.isActive);
        const activeCustomers = (customerResult.customers || []).filter((item) => item.isActive);

        setBranches(activeBranches);
        setPricingRows(activePricing);
        setCustomers(activeCustomers);

        const cachedBranch = getStorageKey(LocalStorage.SELECTED_BRANCH_ID);
        if (cachedBranch && activeBranches.some((item) => item.id === cachedBranch)) {
          setSelectedBranchId(cachedBranch);
        } else if (activeBranches.length) {
          setSelectedBranchId(activeBranches[0].id);
        }

        if (activePricing.length) {
          const firstCategory = activePricing.find((item) => item.product?.category)?.product?.category;
          if (firstCategory?.categoryCode) {
            setSelectedCategoryCode(firstCategory.categoryCode);
          }
        }

        setReady(true);
      } catch (error: any) {
        setScreenError(error?.response?.data?.error_message || "Failed to load billing data.");
        router.replace(ROUTES.LOGIN);
      }
    };

    initialize();
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    if (selectedTab !== "history") return;
    void loadAllOrders();
  }, [ready, selectedTab, selectedBranchId]);

  const logout = () => {
    removeStorageKey(LocalStorage.ACCESS_TOKEN);
    removeStorageKey(LocalStorage.REFRESH_TOKEN);
    removeStorageKey(LocalStorage.SELECTED_BRANCH_ID);
    router.replace(ROUTES.LOGIN);
  };

  const addToCart = (productId: string, quantity: number) => {
    const serviceOptions = servicesByProduct.get(productId) || [];
    if (!serviceOptions.length) return;
    const selectedDefaultService =
      serviceOptions.find((item) => item.serviceId === selectedServiceId) || serviceOptions[0];
    const baseRow = pricingRows.find((row) => row.productId === productId && row.product);
    const productName = baseRow?.product?.productName || "Product";
    const nextQuantity = Math.max(1, quantity || 1);
    setCart((prev) => {
      const index = prev.findIndex(
        (line) => line.productId === productId && line.serviceId === selectedDefaultService.serviceId,
      );
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          quantity: updated[index].quantity + nextQuantity,
          availableServices: serviceOptions,
        };
        return updated;
      }
      return [
        ...prev,
        {
          productId,
          serviceId: selectedDefaultService.serviceId,
          productName,
          serviceName: selectedDefaultService.serviceName,
          quantity: nextQuantity,
          unitPrice: selectedDefaultService.unitPrice,
          currency: selectedDefaultService.currency,
          availableServices: serviceOptions,
        },
      ];
    });
  };

  const updateLineQuantity = (productId: string, serviceId: string, quantity: number) => {
    const nextValue = Math.max(1, quantity || 1);
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId && line.serviceId === serviceId
          ? { ...line, quantity: nextValue }
          : line,
      ),
    );
  };

  const removeLine = (productId: string, serviceId: string) => {
    setCart((prev) => prev.filter((line) => !(line.productId === productId && line.serviceId === serviceId)));
  };

  const updateLineService = (productId: string, currentServiceId: string, nextServiceId: string) => {
    setCart((prev) => {
      const current = prev.find((line) => line.productId === productId && line.serviceId === currentServiceId);
      if (!current || currentServiceId === nextServiceId) return prev;
      const option = current.availableServices.find((item) => item.serviceId === nextServiceId);
      if (!option) return prev;

      const existingTargetLine = prev.find((line) => line.productId === productId && line.serviceId === nextServiceId);
      if (existingTargetLine) {
        return prev
          .map((line) => {
            if (line.productId === productId && line.serviceId === nextServiceId) {
              return { ...line, quantity: line.quantity + current.quantity };
            }
            return line;
          })
          .filter((line) => !(line.productId === productId && line.serviceId === currentServiceId));
      }

      return prev.map((line) =>
        line.productId === productId && line.serviceId === currentServiceId
          ? {
              ...line,
              serviceId: option.serviceId,
              serviceName: option.serviceName,
              unitPrice: option.unitPrice,
              currency: option.currency,
            }
          : line,
      );
    });
  };

  const onSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    setStorageKey(LocalStorage.SELECTED_BRANCH_ID, branchId);
    setScreenError("");
    setScreenSuccess("");
  };

  const onCustomerChange = async (event: FormEvent<HTMLSelectElement>) => {
    const nextCustomerId = event.currentTarget.value;
    setScreenError("");
    setScreenSuccess("");
    setShowOnboardCustomer(false);
    setSelectedCustomerId(nextCustomerId);
    if (nextCustomerId) {
      await loadOrders(nextCustomerId);
    } else {
      setOrders([]);
    }
  };

  const searchCustomerByPhone = async () => {
    const normalizedPhone = customerPhoneInput.trim();
    setScreenError("");
    setScreenSuccess("");
    if (!normalizedPhone) {
      setScreenError("Enter customer phone number.");
      return;
    }
    const matched = customers.find((item) => (item.customerPhone || "").trim() === normalizedPhone);
    if (!matched) {
      setSelectedCustomerId("");
      setOrders([]);
      setShowOnboardCustomer(true);
      setScreenError("Customer not found. Please onboard customer.");
      return;
    }
    setShowOnboardCustomer(false);
    setSelectedCustomerId(matched.id);
    await loadOrders(matched.id);
    setCreateStep(2);
  };

  const onboardCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customerPhoneInput.trim() || !newFirstName.trim()) {
      setScreenError("First name and phone are required for onboarding.");
      return;
    }
    try {
      setIsCreatingCustomer(true);
      setScreenError("");
      const response = await createCustomer({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim() || undefined,
        customerPhone: customerPhoneInput.trim(),
        customerEmail: newEmail.trim() || undefined,
        customerAddress: newAddress.trim() || undefined,
      });
      const createdCustomer = response.customer;
      setCustomers((prev) => [createdCustomer, ...prev]);
      setSelectedCustomerId(createdCustomer.id);
      setShowOnboardCustomer(false);
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewAddress("");
      setOrders([]);
      setCreateStep(2);
    } catch (error: any) {
      setScreenError(error?.response?.data?.error_message || "Failed to onboard customer.");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedBranchId) {
      setScreenError("Please choose a branch first.");
      return;
    }
    if (!selectedCustomerId) {
      setScreenError("Please select customer.");
      return;
    }
    if (!cart.length) {
      setScreenError("Add at least one item to cart.");
      return;
    }
    try {
      setIsPlacingOrder(true);
      setScreenError("");
      setScreenSuccess("");
      const response = await createOrder({
        customerId: selectedCustomerId,
        branchId: selectedBranchId,
        items: cart.map((line) => ({
          productId: line.productId,
          serviceId: line.serviceId,
          quantity: line.quantity,
        })),
        discountAmount: 0,
        taxAmount: 0,
      });
      setLastPlacedOrder(response.order || null);
      setCart([]);
      await loadOrders(selectedCustomerId);
      const latestOrders = await getOrders();
      setOrders(latestOrders.orders || []);
      const createdId = response.order?.id;
      const isVisibleInOrders = !!createdId && (latestOrders.orders || []).some((order) => order.id === createdId);
      if (!isVisibleInOrders) {
        setScreenError("Bill created, but latest order list not refreshed yet. Please open Order History once.");
      } else {
        setScreenSuccess(`Bill created successfully. Order #${response.order.orderNumber}`);
      }
      setCreateStep(3);
    } catch (error: any) {
      setScreenError(error?.response?.data?.error_message || "Failed to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!ready) return null;

  return (
    <main className="billing-page">
      <div className="billing-appShell">
        <aside className="billing-sidebar">
          <div>
            <div className="billing-brand">
              <div className="billing-brandIcon">DF</div>
              <div>
                <p className="billing-brandTitle">Daily Fresh</p>
              </div>
            </div>

            <nav className="billing-nav">
              <button type="button" onClick={() => router.push(ROUTES.DASHBOARD)}>
                Dashboard
              </button>
              <button
                type="button"
                className={selectedTab === "create" ? "active" : ""}
                onClick={() => {
                  setSelectedTab("create");
                  setCreateStep(1);
                }}
              >
                Create Bill
              </button>
              <button type="button" className={selectedTab === "history" ? "active" : ""} onClick={() => setSelectedTab("history")}>
                Order History
              </button>
              <button type="button" onClick={() => router.push(ROUTES.DASHBOARD)}>
                Settings
              </button>
            </nav>
          </div>

          <div className="billing-sidebarFoot">
            <button type="button" className="billing-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </aside>

        <section className="billing-main">
          <header className="billing-topbar">
            <div>
              <h1>{selectedTab === "create" ? "New Bill Creation" : "Order History"}</h1>
              <p>Branch: {selectedBranch?.branchName || "-"}</p>
            </div>
            {selectedTab === "create" && (
              <div className="billing-topTabs">
                <button type="button" className={createStep === 1 ? "active" : ""} onClick={() => setCreateStep(1)}>
                  1 Customer Setup
                </button>
                <button
                  type="button"
                  className={createStep === 2 ? "active" : ""}
                  onClick={() => {
                    if (selectedCustomerId) setCreateStep(2);
                  }}
                >
                  2 Item Selection
                </button>
                <button
                  type="button"
                  className={createStep === 3 ? "active" : ""}
                  onClick={() => {
                    if (lastPlacedOrder) setCreateStep(3);
                  }}
                >
                  3 Billing & Print
                </button>
              </div>
            )}
            <div className="billing-userChip">
              <span>{userName || "User"}</span>
              <small>{userEmail || "-"}</small>
            </div>
          </header>

          {screenError && <p className="billing-error">{screenError}</p>}
          {screenSuccess && <p className="billing-success">{screenSuccess}</p>}

          {selectedTab === "create" ? (
            <>
              {createStep === 1 && (
                <section className="billing-card">
                <h2 className="billing-step-title">Customer Context</h2>
                <p className="billing-muted">Identify existing customer by phone or onboard a new customer before billing.</p>

                <div className="billing-form-row billing-form-row--four">
                  <select value={selectedBranchId} onChange={(e) => onSelectBranch(e.target.value)}>
                    <option value="">Select branch</option>
                    {branches.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.branchName}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Enter customer phone"
                    value={customerPhoneInput}
                    onChange={(e) => {
                      setCustomerPhoneInput(e.target.value);
                      if (screenError) setScreenError("");
                    }}
                  />
                  <button type="button" className="billing-inline-button" onClick={() => void searchCustomerByPhone()}>
                    Find
                  </button>
                  <select value={selectedCustomerId} onChange={(e) => void onCustomerChange(e)}>
                    <option value="">Select matched customer</option>
                    {customers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {`${item.firstName}${item.lastName ? ` ${item.lastName}` : ""}${item.customerPhone ? ` (${item.customerPhone})` : ""}`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomer && (
                  <p className="billing-context">
                    Customer:{" "}
                    <strong>{`${selectedCustomer.firstName}${selectedCustomer.lastName ? ` ${selectedCustomer.lastName}` : ""}`}</strong>
                    {selectedCustomer.customerPhone ? ` (${selectedCustomer.customerPhone})` : ""}
                  </p>
                )}
                {!!selectedCustomerId && createStep === 1 && (
                  <div className="billing-nextAction">
                    <button type="button" onClick={() => setCreateStep(2)}>
                      Continue to Item Selection
                    </button>
                  </div>
                )}

                {showOnboardCustomer && (
                  <form className="onboard-form" onSubmit={(e) => void onboardCustomer(e)}>
                    <h3>New Registration</h3>
                    <div className="billing-form-row billing-form-row--two">
                      <input
                        type="text"
                        placeholder="First name *"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Last name"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                      />
                    </div>
                    <div className="billing-form-row billing-form-row--two">
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Address (optional)"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                      />
                    </div>
                    <button type="submit" disabled={isCreatingCustomer}>
                      {isCreatingCustomer ? "Creating..." : "Create Customer & Start Bill"}
                    </button>
                  </form>
                )}
                </section>
              )}

              {createStep === 2 && (
                <section className="billing-workspace">
                <div className="billing-workspaceLeft billing-card">
                  <div className="billing-form-row billing-form-row--three">
                    <select
                      value={selectedCategoryCode}
                      onChange={(e) => {
                        setSelectedCategoryCode(e.target.value);
                        setSelectedServiceId("");
                      }}
                    >
                      <option value="">Category: All</option>
                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.categoryCode}>
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                    <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}>
                      <option value="">Service: All</option>
                      {serviceOptions.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.serviceName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Search catalog items..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <div className="billing-catalog-grid">
                    {catalogProducts.map((row) => (
                      <CatalogCard key={row.productId} row={row} onAdd={addToCart} />
                    ))}
                  </div>
                  {!catalogProducts.length && (
                    <p className="billing-muted">No matching products. Try changing category/service/search filters.</p>
                  )}
                </div>

                <aside className="billing-workspaceRight billing-card">
                  <div className="basket-head">
                    <h3>Order Basket</h3>
                    <span>{cart.length} items</span>
                  </div>

                  <div className="basket-customer">
                    <p>{selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ""}`.trim() : "No customer selected"}</p>
                    <small>{selectedCustomer?.customerPhone || "Find customer to continue"}</small>
                  </div>

                  <div className="basket-lines">
                    {cart.map((line) => (
                      <div key={`${line.productId}-${line.serviceId}`} className="basket-line">
                        <div>
                          <p>{line.productName}</p>
                          <small>
                            Qty:
                            <input
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={(e) =>
                                updateLineQuantity(
                                  line.productId,
                                  line.serviceId,
                                  Math.max(1, Number(e.target.value) || 1),
                                )
                              }
                            />
                          </small>
                        </div>
                        <div className="basket-lineRight">
                          <select
                            value={line.serviceId}
                            onChange={(e) => updateLineService(line.productId, line.serviceId, e.target.value)}
                          >
                            {line.availableServices.map((service) => (
                              <option key={service.serviceId} value={service.serviceId}>
                                {service.serviceName}
                              </option>
                            ))}
                          </select>
                          <strong>
                            {line.currency} {(line.quantity * line.unitPrice).toFixed(2)}
                          </strong>
                          <button type="button" onClick={() => removeLine(line.productId, line.serviceId)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {!cart.length && <p className="billing-muted">Your basket is empty.</p>}
                  </div>

                  <div className="checkout-actions">
                    <p className="total">Total: INR {subtotal.toFixed(2)}</p>
                    <button
                      type="button"
                      disabled={!cart.length || !selectedCustomerId}
                      onClick={() => {
                        if (!selectedCustomerId) {
                          setScreenError("Please select customer.");
                          return;
                        }
                        if (!cart.length) {
                          setScreenError("Add at least one item to cart.");
                          return;
                        }
                        setScreenError("");
                        setCreateStep(3);
                      }}
                    >
                      Continue to Billing & Print
                    </button>
                  </div>
                </aside>
                </section>
              )}

              {createStep === 3 && (
                <section className="billing-card billing-printCard">
                  <h2 className="billing-step-title">Billing & Print</h2>
                  {!lastPlacedOrder ? (
                    <>
                      <p className="billing-muted">Review final basket and create the bill.</p>
                      <table className="history-items-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Service</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map((line) => (
                            <tr key={`${line.productId}-${line.serviceId}`}>
                              <td>{line.productName}</td>
                              <td>{line.serviceName}</td>
                              <td>{line.quantity}</td>
                              <td>
                                {line.currency} {line.unitPrice.toFixed(2)}
                              </td>
                              <td>
                                {line.currency} {(line.unitPrice * line.quantity).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {!cart.length && (
                            <tr>
                              <td colSpan={5}>Cart is empty.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="print-summary">
                        <p>
                          <span>Customer</span>
                          <strong>
                            {selectedCustomer
                              ? `${selectedCustomer.firstName}${selectedCustomer.lastName ? ` ${selectedCustomer.lastName}` : ""}`
                              : "-"}
                          </strong>
                        </p>
                        <p>
                          <span>Branch</span>
                          <strong>{selectedBranch?.branchName || "-"}</strong>
                        </p>
                        <p>
                          <span>Total Amount</span>
                          <strong>INR {subtotal.toFixed(2)}</strong>
                        </p>
                      </div>
                      <div className="print-actions">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setCreateStep(2);
                          }}
                        >
                          Back to Item Selection
                        </button>
                        <button type="button" disabled={isPlacingOrder || !cart.length} onClick={placeOrder}>
                          {isPlacingOrder ? "Creating..." : "Create Bill"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="billing-muted">Order created successfully. You can print the receipt now.</p>
                      <div className="print-summary">
                        <p>
                          <span>Order #</span>
                          <strong>{lastPlacedOrder?.orderNumber || "-"}</strong>
                        </p>
                        <p>
                          <span>Customer</span>
                          <strong>
                            {selectedCustomer
                              ? `${selectedCustomer.firstName}${selectedCustomer.lastName ? ` ${selectedCustomer.lastName}` : ""}`
                              : "-"}
                          </strong>
                        </p>
                        <p>
                          <span>Total Amount</span>
                          <strong>INR {toNumber(lastPlacedOrder?.totalAmount).toFixed(2)}</strong>
                        </p>
                      </div>
                      <div className="print-actions">
                        <button type="button" onClick={() => window.print()}>
                          Print Bill
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setCreateStep(1);
                            setSelectedCustomerId("");
                            setCustomerPhoneInput("");
                            setLastPlacedOrder(null);
                            setCart([]);
                          }}
                        >
                          New Bill
                        </button>
                      </div>
                    </>
                  )}
                </section>
              )}
            </>
          ) : (
            <section className="billing-card">
              <div className="history-metrics">
                <article>
                  <h4>Total Orders Today</h4>
                  <p>{todayOrdersCount}</p>
                </article>
                <article>
                  <h4>In Progress</h4>
                  <p>{inProgressCount}</p>
                </article>
                <article>
                  <h4>Revenue (MTD)</h4>
                  <p>INR {revenueMtd.toFixed(2)}</p>
                </article>
              </div>
              <>
                  <p style={{ marginBottom: 10 }} className="billing-muted">
                    Tracking orders for selected branch.
                  </p>
                  <div className="history-cards">
                    {branchOrders.map((order) => (
                      <article key={order.id} className="history-card">
                        <div className="history-card-head">
                          <div>
                            <h3>{order.orderNumber}</h3>
                            <p>{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="history-chip-wrap">
                            <span className="history-chip">{order.orderStatus}</span>
                            <span className="history-chip">{order.paymentStatus}</span>
                          </div>
                        </div>

                        <div className="history-meta-grid">
                          <div>
                            <label>Customer</label>
                            <p>{`${order.customer?.firstName || "-"}${order.customer?.lastName ? ` ${order.customer.lastName}` : ""}`}</p>
                          </div>
                          <div>
                            <label>Phone</label>
                            <p>{order.customer?.customerPhone || "-"}</p>
                          </div>
                          <div>
                            <label>Branch</label>
                            <p>{order.branch?.branchName || selectedBranch?.branchName || "-"}</p>
                          </div>
                          <div>
                            <label>Items</label>
                            <p>{order.items?.length || 0}</p>
                          </div>
                        </div>

                        <table className="history-items-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Service</th>
                              <th>Qty</th>
                              <th>Unit</th>
                              <th>Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.items || []).map((item) => (
                              <tr key={item.id}>
                                <td>{item.product?.productName || "-"}</td>
                                <td>{item.service?.serviceName || "-"}</td>
                                <td>{item.quantity}</td>
                                <td>INR {toNumber(item.unitPrice).toFixed(2)}</td>
                                <td>INR {toNumber(item.lineTotal).toFixed(2)}</td>
                              </tr>
                            ))}
                            {!order.items?.length && (
                              <tr>
                                <td colSpan={5}>No item rows available.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        <div className="history-total-grid">
                          <p>
                            <span>Sub total</span>
                            <strong>INR {toNumber(order.subTotal).toFixed(2)}</strong>
                          </p>
                          <p>
                            <span>Discount</span>
                            <strong>INR {toNumber(order.discountAmount).toFixed(2)}</strong>
                          </p>
                          <p>
                            <span>Tax</span>
                            <strong>INR {toNumber(order.taxAmount).toFixed(2)}</strong>
                          </p>
                          <p className="grand-total">
                            <span>Total</span>
                            <strong>INR {toNumber(order.totalAmount).toFixed(2)}</strong>
                          </p>
                        </div>
                      </article>
                    ))}
                    {!branchOrders.length && <p className="billing-muted">No orders found for selected branch.</p>}
                  </div>
              </>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function CatalogCard({
  row,
  onAdd,
}: {
  row: CatalogProductCard;
  onAdd: (productId: string, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <article className="catalog-item">
      <p className="title">{row.productName}</p>
      <p className="subtitle">{row.categoryName || "-"}</p>
      <p className="price">
        From {row.currency} {toNumber(row.minPrice).toFixed(2)}
      </p>
      <div className="actions">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
        />
        <button
          type="button"
          onClick={() => {
            onAdd(row.productId, quantity);
            setQuantity(1);
          }}
        >
          Add
        </button>
      </div>
    </article>
  );
}

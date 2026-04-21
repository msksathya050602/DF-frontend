'use client';

import './newBill.scss';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import AppDropdown from '@library/AppDropdown';
import { Loader } from '@library/Loader';
import { Modal } from '@library/Modal';
import { ArrowLeft, ArrowRight, FilePlus, Printer, Save, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@constants/routes';
import { currencyDisplayLabel } from '@/helpers/currencyDisplay';
import { getPricing, type Pricing } from '@/services/api/catalog';
import {
  createCustomer,
  type Customer,
  getCustomerOrders,
  searchCustomersByPhone,
} from '@/services/api/customers';
import { createOrder, getOrders, type Order } from '@/services/api/orders';

import { BillingPageShell } from '../BillingPageShell';
import {
  BILLING_PHONE_DIGITS,
  BillingCustomerDetails,
  BillingLine,
  billingPhoneDigits,
  billingPhoneMatchesStored,
  CatalogCard,
  CatalogProductCard,
  CategoryOption,
  dateInputToISO8601,
  formatOrderDate,
  isDeliveryDateAllowed,
  localTodayYmd,
  QuantityStepper,
  toNumber,
} from '../billingShared';
import { useBillingShell } from '../BillingShellContext';

type CreateStep = 1 | 2 | 3;

const ERR_DELIVERY_DATE_REQUIRED = 'Please select the delivery date.';
const ERR_DELIVERY_DATE_PAST = 'Delivery date must be today or later.';

export function NewBill() {
  const router = useRouter();
  const shell = useBillingShell();
  const { selectedBranchId, selectedBranch, userName, userEmail } = shell;
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [pricingRows, setPricingRows] = useState<Pricing[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState<BillingLine[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [screenError, setScreenError] = useState('');
  const [screenSuccess, setScreenSuccess] = useState('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [showOnboardCustomer, setShowOnboardCustomer] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [expectedDeliveryDateInput, setExpectedDeliveryDateInput] = useState('');
  const [phoneSuggestList, setPhoneSuggestList] = useState<Customer[]>([]);
  const [phoneSuggestOpen, setPhoneSuggestOpen] = useState(false);
  const [phoneSuggestLoading, setPhoneSuggestLoading] = useState(false);
  const [phoneSuggestHighlight, setPhoneSuggestHighlight] = useState(-1);
  const phoneSearchSeqRef = useRef(0);
  const phoneSuggestListId = 'billing-phone-suggest-list';

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart]
  );

  const selectedCustomer = useMemo(
    () => customers.find((item) => item.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
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
      .filter(
        (row) =>
          !selectedCategoryCode || row.product?.category?.categoryCode === selectedCategoryCode
      )
      .map((row) => row.service)
      .filter((service): service is NonNullable<Pricing['service']> => !!service)
      .filter((service) => {
        if (seen.has(service.id)) return false;
        seen.add(service.id);
        return true;
      })
      .sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }, [pricingRows, selectedCategoryCode]);

  const servicesByProduct = useMemo(() => {
    const map = new Map<string, BillingLine['availableServices']>();
    pricingRows.forEach((row) => {
      if (!row.product || !row.service) return;
      if (selectedCategoryCode && row.product.category?.categoryCode !== selectedCategoryCode)
        return;
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
          currency: row.currency || 'INR',
        });
      }
      map.set(
        row.productId,
        list.sort((a, b) => a.serviceName.localeCompare(b.serviceName))
      );
    });
    return map;
  }, [pricingRows, selectedCategoryCode, selectedServiceId, productSearch]);

  const catalogProducts = useMemo<CatalogProductCard[]>(() => {
    const map = new Map<string, CatalogProductCard>();
    pricingRows.forEach((row) => {
      if (!row.product || !row.service) return;
      if (selectedCategoryCode && row.product.category?.categoryCode !== selectedCategoryCode)
        return;
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
          categoryName: row.product.category?.categoryName || '-',
          minPrice: price,
          currency: row.currency || 'INR',
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

  useEffect(() => {
    if (!shell.ready) return;
    let cancelled = false;
    void (async () => {
      try {
        const pricingResult = await getPricing();
        if (cancelled) return;
        const activePricing = (pricingResult.pricing || []).filter((item) => item.isActive);
        setPricingRows(activePricing);
        if (activePricing.length) {
          const firstCategory = activePricing.find((item) => item.product?.category)?.product
            ?.category;
          if (firstCategory?.categoryCode) {
            setSelectedCategoryCode(firstCategory.categoryCode);
          }
        }
        if (!cancelled) setWorkspaceReady(true);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error_message?: string } } };
        if (!cancelled) {
          setScreenError(err?.response?.data?.error_message || 'Failed to load billing data.');
          setWorkspaceReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shell.ready]);

  useEffect(() => {
    if (createStep !== 3 || lastPlacedOrder) return;
    const today = localTodayYmd();
    setExpectedDeliveryDateInput((prev) => (prev && prev < today ? '' : prev));
  }, [createStep, lastPlacedOrder]);

  useEffect(() => {
    if (createStep !== 1) {
      setPhoneSuggestList([]);
      setPhoneSuggestOpen(false);
      setPhoneSuggestHighlight(-1);
      setPhoneSuggestLoading(false);
      return;
    }
    const digits = billingPhoneDigits(customerPhoneInput);
    if (digits.length < 2) {
      setPhoneSuggestList([]);
      setPhoneSuggestOpen(false);
      setPhoneSuggestHighlight(-1);
      setPhoneSuggestLoading(false);
      return;
    }
    const seq = ++phoneSearchSeqRef.current;
    const timer = setTimeout(async () => {
      setPhoneSuggestLoading(true);
      try {
        const { customers: found } = await searchCustomersByPhone(digits, 10);
        if (seq !== phoneSearchSeqRef.current) return;
        const list = (found || []).filter((item) => item.isActive);
        setPhoneSuggestList(list);
        setPhoneSuggestOpen(list.length > 0);
        setPhoneSuggestHighlight(-1);
      } catch {
        if (seq !== phoneSearchSeqRef.current) return;
        setPhoneSuggestList([]);
        setPhoneSuggestOpen(false);
      } finally {
        if (seq === phoneSearchSeqRef.current) setPhoneSuggestLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerPhoneInput, createStep]);

  const addToCart = (productId: string, quantity: number) => {
    const serviceOptions = servicesByProduct.get(productId) || [];
    if (!serviceOptions.length) return;
    const selectedDefaultService =
      serviceOptions.find((item) => item.serviceId === selectedServiceId) || serviceOptions[0];
    const baseRow = pricingRows.find((row) => row.productId === productId && row.product);
    const productName = baseRow?.product?.productName || 'Product';
    const nextQuantity = Math.max(1, quantity || 1);
    setCart((prev) => {
      const index = prev.findIndex(
        (line) =>
          line.productId === productId && line.serviceId === selectedDefaultService.serviceId
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
          : line
      )
    );
  };

  const removeLine = (productId: string, serviceId: string) => {
    setCart((prev) =>
      prev.filter((line) => !(line.productId === productId && line.serviceId === serviceId))
    );
  };

  const updateLineService = (
    productId: string,
    currentServiceId: string,
    nextServiceId: string
  ) => {
    setCart((prev) => {
      const current = prev.find(
        (line) => line.productId === productId && line.serviceId === currentServiceId
      );
      if (!current || currentServiceId === nextServiceId) return prev;
      const option = current.availableServices.find((item) => item.serviceId === nextServiceId);
      if (!option) return prev;

      const existingTargetLine = prev.find(
        (line) => line.productId === productId && line.serviceId === nextServiceId
      );
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
          : line
      );
    });
  };

  const onCustomerChangeById = async (nextCustomerId: string) => {
    setScreenError('');
    setScreenSuccess('');
    setShowOnboardCustomer(false);
    setSelectedCustomerId(nextCustomerId);
    if (nextCustomerId) {
      await loadOrders(nextCustomerId);
    } else {
      setOrders([]);
    }
  };

  const pickPhoneSuggestion = async (c: Customer) => {
    setShowOnboardCustomer(false);
    setScreenError('');
    setScreenSuccess('');
    setPhoneSuggestOpen(false);
    setPhoneSuggestList([]);
    setPhoneSuggestHighlight(-1);
    const stored = (c.customerPhone || '').replace(/\D/g, '');
    const ten =
      stored.length >= BILLING_PHONE_DIGITS
        ? stored.slice(-BILLING_PHONE_DIGITS)
        : billingPhoneDigits(customerPhoneInput);
    setCustomerPhoneInput(ten);
    setCustomers((prev) => {
      const byId = new Map(prev.map((x) => [x.id, x]));
      byId.set(c.id, c);
      return Array.from(byId.values());
    });
    setSelectedCustomerId(c.id);
    await loadOrders(c.id);
  };

  const searchCustomerByPhone = async () => {
    const digits = billingPhoneDigits(customerPhoneInput);
    setScreenError('');
    setScreenSuccess('');
    if (!digits) {
      setScreenError("Please enter the customer's phone number.");
      return;
    }
    if (digits.length !== BILLING_PHONE_DIGITS) {
      setScreenError('Enter a 10-digit phone number.');
      return;
    }
    try {
      const { customers: found } = await searchCustomersByPhone(digits, 20);
      const list = (found || []).filter((item) => item.isActive);
      setCustomers((prev) => {
        const byId = new Map(prev.map((c) => [c.id, c]));
        for (const c of list) {
          byId.set(c.id, c);
        }
        return Array.from(byId.values());
      });
      const matched = list.find((item) => billingPhoneMatchesStored(item.customerPhone, digits));
      if (!matched) {
        setSelectedCustomerId('');
        setOrders([]);
        setScreenError('');
        setShowOnboardCustomer(true);
        return;
      }
      setShowOnboardCustomer(false);
      setSelectedCustomerId(matched.id);
      await loadOrders(matched.id);
      setCreateStep(2);
    } catch {
      setScreenError('Could not search customers. Try again.');
    }
  };

  const closeOnboardModal = () => {
    setShowOnboardCustomer(false);
    setScreenError('');
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewAddress('');
  };

  const onboardCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phone = billingPhoneDigits(customerPhoneInput);
    if (phone.length !== BILLING_PHONE_DIGITS || !newFirstName.trim()) {
      setScreenError('First name and a 10-digit phone number are required.');
      return;
    }
    try {
      setIsCreatingCustomer(true);
      setScreenError('');
      const response = await createCustomer({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim() || undefined,
        customerPhone: phone,
        customerEmail: newEmail.trim() || undefined,
        customerAddress: newAddress.trim() || undefined,
      });
      const createdCustomer = response.customer;
      setCustomers((prev) => [createdCustomer, ...prev]);
      setSelectedCustomerId(createdCustomer.id);
      setShowOnboardCustomer(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewAddress('');
      setOrders([]);
      setCreateStep(2);
    } catch (error: any) {
      setScreenError(
        error?.response?.data?.error_message || 'Could not save the customer. Try again.'
      );
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedBranchId) {
      setScreenError('Select a branch in the sidebar first.');
      return;
    }
    if (!selectedCustomerId) {
      setScreenError('Choose a customer in step 1.');
      return;
    }
    if (!cart.length) {
      setScreenError('Add at least one item to the cart.');
      return;
    }
    const expectedISO = dateInputToISO8601(expectedDeliveryDateInput);
    if (!expectedISO) {
      setScreenError(ERR_DELIVERY_DATE_REQUIRED);
      return;
    }
    if (!isDeliveryDateAllowed(expectedDeliveryDateInput)) {
      setScreenError(ERR_DELIVERY_DATE_PAST);
      return;
    }
    try {
      setIsPlacingOrder(true);
      setScreenError('');
      setScreenSuccess('');
      await createOrder({
        customerId: selectedCustomerId,
        branchId: selectedBranchId,
        items: cart.map((line) => ({
          productId: line.productId,
          serviceId: line.serviceId,
          quantity: line.quantity,
        })),
        discountAmount: 0,
        taxAmount: 0,
        expectedDeliveryDate: expectedISO,
      });
      setCart([]);
      setExpectedDeliveryDateInput('');
      router.push(ROUTES.BILLING_ORDER_HISTORY);
    } catch (error: any) {
      setScreenError(error?.response?.data?.error_message || 'Could not save the bill. Try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!shell.ready || !workspaceReady) return null;

  return (
    <BillingPageShell
      title="Billing"
      subtitle="Find the customer, add items, then review and print."
      userName={userName || 'User'}
      userEmail={userEmail || ''}
      topbarExtraClass="billing-topbar--withSteps"
      stepTabs={{
        createStep,
        setCreateStep,
        selectedCustomerId,
        hasCompletedOrderForStep3: !!lastPlacedOrder,
      }}
      screenError={screenError}
      screenSuccess={screenSuccess}
      hideScreenError={showOnboardCustomer}
    >
      <>
        {createStep === 1 && (
          <>
            <section className="billing-card">
              <h2 className="billing-step-title">Enter Customer Phone Number</h2>

              <div className="billing-form-row billing-form-row--customer">
                <div className="billing-phoneField">
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-busy={phoneSuggestLoading}
                    maxLength={BILLING_PHONE_DIGITS}
                    placeholder="Type at least 2 digits…"
                    value={customerPhoneInput}
                    onChange={(e) => {
                      setCustomerPhoneInput(billingPhoneDigits(e.target.value));
                      if (screenError) setScreenError('');
                    }}
                    onFocus={() => {
                      if (phoneSuggestList.length > 0) setPhoneSuggestOpen(true);
                    }}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setPhoneSuggestOpen(false);
                        setPhoneSuggestHighlight(-1);
                      }, 150);
                    }}
                    onKeyDown={(e) => {
                      if (!phoneSuggestOpen || phoneSuggestList.length === 0) return;
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setPhoneSuggestOpen(false);
                        setPhoneSuggestHighlight(-1);
                        return;
                      }
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setPhoneSuggestHighlight((h) =>
                          h + 1 >= phoneSuggestList.length ? 0 : h + 1
                        );
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setPhoneSuggestHighlight((h) =>
                          h <= 0 ? phoneSuggestList.length - 1 : h - 1
                        );
                        return;
                      }
                      if (e.key === 'Enter' && phoneSuggestHighlight >= 0) {
                        e.preventDefault();
                        const c = phoneSuggestList[phoneSuggestHighlight];
                        if (c) void pickPhoneSuggestion(c);
                      }
                    }}
                  />
                  {phoneSuggestLoading ? (
                    <span className="billing-phoneSuggest-status" aria-live="polite">
                      Searching…
                    </span>
                  ) : null}
                  {phoneSuggestOpen && phoneSuggestList.length > 0 ? (
                    <ul
                      id={phoneSuggestListId}
                      className="billing-phoneSuggest"
                      role="listbox"
                      aria-label="Matching customers"
                    >
                      {phoneSuggestList.map((c, index) => {
                        const label = `${c.firstName}${c.lastName ? ` ${c.lastName}` : ''}`.trim();
                        const isHi = index === phoneSuggestHighlight;
                        return (
                          <li key={c.id} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={isHi}
                              className={`billing-phoneSuggest-item${isHi ? ' billing-phoneSuggest-item--active' : ''}`}
                              onMouseDown={(ev) => {
                                ev.preventDefault();
                                void pickPhoneSuggestion(c);
                              }}
                              onMouseEnter={() => setPhoneSuggestHighlight(index)}
                            >
                              <span className="billing-phoneSuggest-name">{label || '—'}</span>
                              {c.customerPhone ? (
                                <span className="billing-phoneSuggest-phone">
                                  {c.customerPhone}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="billing-inline-button"
                  onClick={() => void searchCustomerByPhone()}
                >
                  <Search size={16} strokeWidth={2} aria-hidden />
                  Search
                </button>
                <AppDropdown
                  value={selectedCustomerId}
                  onChange={(id) => void onCustomerChangeById(id)}
                  listTitle="Choose customer"
                  placeholder="— Choose customer —"
                  allowEmpty
                  emptyLabel="— Choose customer —"
                  options={customers.map((item) => ({
                    value: item.id,
                    label: `${item.firstName}${item.lastName ? ` ${item.lastName}` : ''}`.trim(),
                    description: item.customerPhone || undefined,
                  }))}
                />
              </div>

              {selectedCustomer && (
                <div className="billing-context">
                  <BillingCustomerDetails customer={selectedCustomer} variant="panel" />
                </div>
              )}
              {!!selectedCustomerId && createStep === 1 && (
                <div className="billing-nextAction">
                  <button type="button" onClick={() => setCreateStep(2)}>
                    Continue to add items
                    <ArrowRight size={16} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              )}
            </section>

            {showOnboardCustomer && (
              <Modal
                isCloseIcon
                handleModal={closeOnboardModal}
                onBackdropClick={closeOnboardModal}
              >
                <div
                  className="billing-onboard-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="billing-onboard-modal-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="billing-onboard-modal-alert">
                    No customer with this phone. Add their details to continue.
                  </div>
                  {screenError ? (
                    <p className="billing-error billing-onboard-modal-error">{screenError}</p>
                  ) : null}
                  <h2 id="billing-onboard-modal-title" className="billing-onboard-modal-heading">
                    New customer
                  </h2>
                  <p className="billing-muted billing-onboard-modal-phone">
                    Phone: <strong>{customerPhoneInput.trim()}</strong>
                  </p>
                  <form
                    className="onboard-form onboard-form--modal"
                    onSubmit={(e) => void onboardCustomer(e)}
                    onChange={() => setScreenError('')}
                  >
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
                    <div className="billing-onboard-modal-actions">
                      <button type="submit" disabled={isCreatingCustomer}>
                        {isCreatingCustomer ? (
                          'Saving…'
                        ) : (
                          <>
                            <Save size={16} strokeWidth={2} aria-hidden />
                            Save customer and continue
                          </>
                        )}
                      </button>
                      <button type="button" className="secondary" onClick={closeOnboardModal}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </Modal>
            )}
          </>
        )}

        {createStep === 2 && (
          <section className="billing-workspace billing-workspace--fill">
            <div className="billing-workspaceLeft billing-card">
              <div className="billing-form-row billing-form-row--three">
                <AppDropdown
                  value={selectedCategoryCode}
                  onChange={(code) => {
                    setSelectedCategoryCode(code);
                    setSelectedServiceId('');
                  }}
                  listTitle="Category"
                  placeholder="All categories"
                  allowEmpty
                  emptyLabel="All categories"
                  options={categoryOptions.map((category) => ({
                    value: category.categoryCode,
                    label: category.categoryName,
                  }))}
                />
                <AppDropdown
                  value={selectedServiceId}
                  onChange={setSelectedServiceId}
                  listTitle="Service"
                  placeholder="All services"
                  allowEmpty
                  emptyLabel="All services"
                  options={serviceOptions.map((service) => ({
                    value: service.id,
                    label: service.serviceName,
                  }))}
                />
                <input
                  type="text"
                  placeholder="Search by product name…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className="billing-catalog-scroll">
                <div className="billing-catalog-grid">
                  {catalogProducts.map((row) => (
                    <CatalogCard key={row.productId} row={row} onAdd={addToCart} />
                  ))}
                </div>
              </div>
              {!catalogProducts.length && (
                <p className="billing-muted">
                  Nothing matches your search. Try another category or search word.
                </p>
              )}
            </div>

            <aside className="billing-workspaceRight billing-card">
              <div className="basket-head">
                <div className="basket-head-title">
                  <Image
                    src="/icons/cart.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="billing-cart-headIcon"
                    aria-hidden
                    unoptimized
                  />
                  <h3>Cart</h3>
                </div>
                <span>{cart.length} items</span>
              </div>

              <div className="basket-customer">
                {selectedCustomer ? (
                  <BillingCustomerDetails customer={selectedCustomer} variant="sidebar" />
                ) : (
                  <>
                    <p>No customer yet</p>
                    <small>Choose a customer in step 1</small>
                  </>
                )}
              </div>

              <div className="basket-lines">
                {cart.map((line) => (
                  <div key={`${line.productId}-${line.serviceId}`} className="basket-line">
                    <div className="basket-line-top">
                      <p className="basket-line-title">{line.productName}</p>
                      <div className="basket-line-service">
                        <AppDropdown
                          className="appDropdown--inline"
                          variant="compact"
                          value={line.serviceId}
                          onChange={(sid) => updateLineService(line.productId, line.serviceId, sid)}
                          listTitle="Service"
                          menuMinWidth={140}
                          options={line.availableServices.map((service) => ({
                            value: service.serviceId,
                            label: service.serviceName,
                          }))}
                        />
                      </div>
                    </div>
                    <div className="basket-line-bottom">
                      <div className="basket-line-qty">
                        <span className="basket-line-qty-label">Qty</span>
                        <QuantityStepper
                          className="billing-qtyStepper--compact"
                          value={line.quantity}
                          onChange={(next) =>
                            updateLineQuantity(line.productId, line.serviceId, next)
                          }
                          ariaLabel={`Quantity for ${line.productName}`}
                        />
                      </div>
                      <div className="basket-line-actions">
                        <strong className="basket-line-price">
                          {currencyDisplayLabel(line.currency)}{' '}
                          {(line.quantity * line.unitPrice).toFixed(2)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => removeLine(line.productId, line.serviceId)}
                        >
                          <Trash2 size={14} strokeWidth={2} aria-hidden />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!cart.length && (
                  <p className="billing-muted">Cart is empty. Add products from the list.</p>
                )}
              </div>

              <div className="checkout-actions">
                <p className="total">
                  Total: {currencyDisplayLabel('INR')} {subtotal.toFixed(2)}
                </p>
                <button
                  type="button"
                  disabled={!cart.length || !selectedCustomerId}
                  onClick={() => {
                    if (!selectedCustomerId) {
                      setScreenError('Choose a customer in step 1.');
                      return;
                    }
                    if (!cart.length) {
                      setScreenError('Add at least one item to the cart.');
                      return;
                    }
                    setScreenError('');
                    setCreateStep(3);
                  }}
                >
                  Continue
                  <ArrowRight size={16} strokeWidth={2} aria-hidden />
                </button>
              </div>
            </aside>
          </section>
        )}

        {createStep === 3 && (
          <section
            className={`billing-card billing-printCard${isPlacingOrder && !lastPlacedOrder ? ' billing-printCard--loading' : ''}`}
          >
            <h2 className="billing-step-title">Review and print</h2>
            {!lastPlacedOrder ? (
              <>
                <p className="billing-muted">
                  Check the items and total, then save the bill. You can print after saving.
                </p>
                <div className="billing-deliveryField">
                  <label htmlFor="expected-delivery-date">
                    Delivery date
                    <abbr className="billing-required-abbr" title="Required">
                      *
                    </abbr>
                  </label>
                  <input
                    id="expected-delivery-date"
                    type="date"
                    required
                    min={localTodayYmd()}
                    value={expectedDeliveryDateInput}
                    onChange={(e) => {
                      setExpectedDeliveryDateInput(e.target.value);
                      setScreenError((prev) =>
                        prev === ERR_DELIVERY_DATE_REQUIRED || prev === ERR_DELIVERY_DATE_PAST
                          ? ''
                          : prev
                      );
                    }}
                    disabled={isPlacingOrder}
                  />
                </div>
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
                          {currencyDisplayLabel(line.currency)} {line.unitPrice.toFixed(2)}
                        </td>
                        <td>
                          {currencyDisplayLabel(line.currency)}{' '}
                          {(line.unitPrice * line.quantity).toFixed(2)}
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
                  <BillingCustomerDetails customer={selectedCustomer} variant="print" />
                  <p>
                    <span>Branch</span>
                    <strong>{selectedBranch?.branchName || '-'}</strong>
                  </p>
                  <p>
                    <span>Total Amount</span>
                    <strong>
                      {currencyDisplayLabel('INR')} {subtotal.toFixed(2)}
                    </strong>
                  </p>
                  <p>
                    <span>Delivery date</span>
                    <strong>
                      {expectedDeliveryDateInput
                        ? formatOrderDate(`${expectedDeliveryDateInput}T12:00:00`)
                        : '—'}
                    </strong>
                  </p>
                </div>
                <div className="print-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={isPlacingOrder}
                    onClick={() => {
                      setCreateStep(2);
                    }}
                  >
                    <ArrowLeft size={16} strokeWidth={2} aria-hidden />
                    Back to items
                  </button>
                  <button
                    type="button"
                    disabled={
                      isPlacingOrder ||
                      !cart.length ||
                      !isDeliveryDateAllowed(expectedDeliveryDateInput)
                    }
                    onClick={placeOrder}
                  >
                    {isPlacingOrder ? (
                      'Working…'
                    ) : (
                      <>
                        <Save size={16} strokeWidth={2} aria-hidden />
                        Save bill
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="billing-muted">Bill saved. You can print the receipt below.</p>
                <div className="print-summary">
                  <p>
                    <span>Order #</span>
                    <strong>{lastPlacedOrder?.orderNumber || '-'}</strong>
                  </p>
                  <BillingCustomerDetails customer={selectedCustomer} variant="print" />
                  <p>
                    <span>Total Amount</span>
                    <strong>
                      {currencyDisplayLabel('INR')}{' '}
                      {toNumber(lastPlacedOrder?.totalAmount).toFixed(2)}
                    </strong>
                  </p>
                  <p>
                    <span>Delivery date</span>
                    <strong>{formatOrderDate(lastPlacedOrder?.deliveryDate ?? null)}</strong>
                  </p>
                </div>
                <div className="print-actions">
                  <button type="button" onClick={() => window.print()}>
                    <Printer size={16} strokeWidth={2} aria-hidden />
                    Print receipt
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setCreateStep(1);
                      setSelectedCustomerId('');
                      setCustomerPhoneInput('');
                      setLastPlacedOrder(null);
                      setCart([]);
                      setExpectedDeliveryDateInput('');
                    }}
                  >
                    <FilePlus size={16} strokeWidth={2} aria-hidden />
                    Start another bill
                  </button>
                </div>
              </>
            )}
            {isPlacingOrder && !lastPlacedOrder ? (
              <div
                className="billing-printCard-loadingOverlay"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <Loader borderSize="5px" width="52px" height="52px" padding="10px">
                  <span className="billing-muted">Saving bill…</span>
                </Loader>
              </div>
            ) : null}
          </section>
        )}
      </>
    </BillingPageShell>
  );
}

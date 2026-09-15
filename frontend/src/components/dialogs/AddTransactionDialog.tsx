import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { Receipt, Building2, Box, Info, DollarSign, Loader2, Search } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionDialog({ open, onOpenChange }: AddTransactionDialogProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [customerSearch, setCustomerSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      customerId: "",
      productId: "",
      qty: 1,
      paymentMethod: "upi",
      status: "paid",
    },
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load all vendors & customers when modal opens
  useEffect(() => {
    if (open) {
      async function loadVendors() {
        try {
          setLoadingVendors(true);
          const res: any = await api.get("/vendors?limit=100");
          const activeVendors = res.data.vendors || [];
          setVendors(activeVendors);
          if (activeVendors.length > 0) {
            setSelectedVendorId(activeVendors[0].id);
          }
        } catch (err) {
          toast.error("Failed to load vendors list");
        } finally {
          setLoadingVendors(false);
        }
      }

      async function loadCustomers() {
        try {
          setLoadingCustomers(true);
          const res: any = await api.get("/customers?limit=200");
          let customerList = [];
          if (res) {
            if (Array.isArray(res)) {
              customerList = res;
            } else if (Array.isArray(res.data)) {
              customerList = res.data;
            } else if (res.data && Array.isArray(res.data.customers)) {
              customerList = res.data.customers;
            } else if (res.customers) {
              customerList = res.customers;
            }
          }
          setCustomers(customerList);
        } catch (err) {
          toast.error("Failed to load customers list");
        } finally {
          setLoadingCustomers(false);
        }
      }

      loadVendors();
      loadCustomers();
    }
  }, [open]);

  // Load products for the selected vendor
  useEffect(() => {
    if (open && selectedVendorId) {
      async function loadVendorProducts() {
        try {
          setLoadingProducts(true);
          const res: any = await api.get(`/products?limit=100&vendorId=${selectedVendorId}`);
          const vendorProducts = res.data.products || [];
          setProducts(vendorProducts);
          if (vendorProducts.length > 0) {
            form.setValue("productId", vendorProducts[0].id);
            setSelectedProduct(vendorProducts[0]);
          } else {
            form.setValue("productId", "");
            setSelectedProduct(null);
          }
        } catch (err) {
          toast.error("Failed to load products for the selected vendor");
        } finally {
          setLoadingProducts(false);
        }
      }
      loadVendorProducts();
    } else {
      setProducts([]);
      setSelectedProduct(null);
    }
  }, [open, selectedVendorId]);

  // Reset form inputs when modal state opens
  useEffect(() => {
    if (open) {
      form.reset({
        customerId: "",
        productId: "",
        qty: 1,
        paymentMethod: "upi",
        status: "paid",
      });
      setSelectedProduct(null);
      setCustomerSearch("");
      setDropdownOpen(false);
    }
  }, [open]);

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId);
  };

  const handleProductChange = (productId: string) => {
    form.setValue("productId", productId);
    const prod = products.find((p) => p.id === productId) || null;
    setSelectedProduct(prod);
  };

  const qty = form.watch("qty") || 0;
  const calculatedTotal = selectedProduct ? selectedProduct.price * parseInt(qty as any || 0) : 0;
  const stockExceeded = selectedProduct && parseInt(qty as any || 0) > selectedProduct.stock;

  const onSubmit = async (data: any) => {
    try {
      if (!selectedVendorId) {
        toast.error("Please select a vendor");
        return;
      }
      if (!data.productId || !selectedProduct) {
        toast.error("Please select a product");
        return;
      }
      if (!data.customerId) {
        toast.error("Customer selection is required");
        return;
      }

      const qtyVal = parseInt(data.qty as any);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        toast.error("Quantity must be a positive integer greater than 0");
        return;
      }

      if (qtyVal > selectedProduct.stock) {
        toast.error(`Insufficient stock! Only ${selectedProduct.stock} units are available.`);
        return;
      }

      // Map UI Payment Methods to backend database enums
      let paymentEnum = "upi";
      if (data.paymentMethod === "card") paymentEnum = "card";
      else if (data.paymentMethod === "cash") paymentEnum = "wallet";
      else if (data.paymentMethod === "netbanking") paymentEnum = "bank";

      const payload = {
        customerId: data.customerId,
        productId: data.productId,
        vendorId: selectedVendorId,
        qty: qtyVal,
        paymentMethod: paymentEnum,
        status: data.status,
      };

      await api.post("/transactions", payload);
      toast.success("Transaction recorded successfully!");
      
      // Auto-invalidate route data cache (refreshes dashboard, customers, transactions & analytics)
      await router.invalidate();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to record transaction:", err);
      toast.error(err.message || "Failed to record transaction");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone || "").includes(customerSearch)
  );

  const selectedCustomerId = form.watch("customerId");
  const selectedCustomer = customers.find((c) => (c.id || c._id) === selectedCustomerId);

  const getBadgeColor = (cat: string) => {
    if (cat === "Gold") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    if (cat === "Silver") return "bg-slate-400/10 text-slate-600 border-slate-400/20";
    return "bg-amber-600/10 text-amber-700 border-amber-600/20";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-0 gap-0 shadow-2xl border bg-background">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Receipt className="h-5 w-5 text-primary" />
            Create Transaction Order
          </DialogTitle>
          <DialogDescription>
            Onboard customer sales ledger logs. This will decrease product stock levels and accumulate vendor revenue metrics atomically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
            
            {/* Step 1: Select Vendor */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Step 1: Select Vendor *
              </Label>
              {loadingVendors ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground h-10 border rounded-md px-3 bg-secondary/10 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading vendors...
                </div>
              ) : vendors.length > 0 ? (
                <Select value={selectedVendorId} onValueChange={handleVendorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v: any) => (
                      <SelectItem key={v.id || v._id} value={v.id || v._id}>
                        {v.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-destructive p-2 border border-destructive/20 rounded bg-destructive/5">
                  No active vendors found. Please onboard a vendor first.
                </div>
              )}
            </div>

            {/* Step 2: Select Product */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-muted-foreground" />
                Step 2: Select Product *
              </Label>
              {loadingProducts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground h-10 border rounded-md px-3 bg-secondary/10 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" /> Fetching vendor catalog...
                </div>
              ) : products.length > 0 ? (
                <Select value={form.watch("productId")} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id || p._id} value={p.id || p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-md bg-secondary/5">
                  No products listed under this vendor catalog.
                </div>
              )}
            </div>

            {/* Product Meta Stats */}
            {selectedProduct && (
              <div className="space-y-1.5 p-4 md:col-span-2 bg-secondary/30 rounded-lg border text-sm grid grid-cols-2 gap-3">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Unit Price:</strong> ₹{selectedProduct.price}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Stock Available:</strong> {selectedProduct.stock} units</span>
                </div>
                <div><strong>Category:</strong> {selectedProduct.category}</div>
                <div><strong>SKU:</strong> {selectedProduct.sku}</div>
              </div>
            )}

            {/* Searchable Customer Dropdown */}
            <div className="space-y-2 relative md:col-span-2" ref={dropdownRef}>
              <Label>Select Customer *</Label>
              <div className="relative">
                <Input
                  placeholder="Type customer name, phone, or email to search..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  disabled={loadingCustomers}
                />
                {selectedCustomer && (
                  <Badge variant="outline" className={`absolute right-3 top-2.5 text-xs font-semibold ${getBadgeColor(selectedCustomer.customerCategory || "Bronze")}`}>
                    Selected: {selectedCustomer.name}
                  </Badge>
                )}
              </div>
              
              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-52 overflow-y-auto bg-popover text-popover-foreground">
                  {loadingCustomers ? (
                    <div className="p-3 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading customer list...
                    </div>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id || c._id}
                        className="p-3 border-b last:border-0 hover:bg-muted cursor-pointer flex items-center justify-between text-xs"
                        onClick={() => {
                          form.setValue("customerId", c.id || c._id);
                          setCustomerSearch(c.name);
                          setDropdownOpen(false);
                        }}
                      >
                        <div>
                          <div className="font-semibold text-sm">{c.name}</div>
                          <div className="text-muted-foreground">{c.phone} · {c.email}</div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-semibold ${getBadgeColor(c.customerCategory || "Bronze")}`}>
                          {c.customerCategory || "Bronze"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-muted-foreground text-center">
                      No matching customers found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="dialog-txn-qty">Quantity *</Label>
              <Input id="dialog-txn-qty" type="number" {...form.register("qty", { required: true, min: 1 })} />
              {stockExceeded && (
                <p className="text-xs text-destructive font-semibold animate-pulse">
                  Requested quantity exceeds available stock of {selectedProduct?.stock} units.
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={form.watch("paymentMethod")} onValueChange={(v) => form.setValue("paymentMethod", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash (Wallet)</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="netbanking">Net Banking (Bank)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Status */}
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Calculations */}
            {selectedProduct && (
              <div className="p-4 md:col-span-2 border rounded-lg bg-emerald-50/20 text-emerald-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Secure Total Amount</div>
                  <div className="text-2xl font-black">₹{calculatedTotal}</div>
                </div>
                <div className="text-xs opacity-75 text-right">
                  ₹{selectedProduct.price} × {qty || 0} units
                </div>
              </div>
            )}

          </div>

          <DialogFooter className="border-t pt-4 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={stockExceeded || !selectedProduct || !selectedCustomerId}
              className="gap-1.5"
            >
              Submit Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

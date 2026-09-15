import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export function useVendorScope() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchVendorData() {
      try {
        setLoading(true);
        // Find corresponding Vendor record for the user's email
        const vendorRes: any = await api.get(`/vendors?search=${encodeURIComponent(user.email)}`);
        const myVendor = vendorRes?.data?.vendors?.[0];

        if (myVendor) {
          setVendor(myVendor);

          // Fetch products, transactions, and analytics scoped to this vendor ID
          const [prodsRes, txsRes, analyticsRes] = await Promise.all([
            api.get(`/products?vendorId=${myVendor.id}&limit=200`),
            api.get(`/transactions?vendorId=${myVendor.id}&limit=200`),
            api.get(`/analytics`),
          ]);

          setProducts(prodsRes?.data?.products || []);
          setOrders(txsRes?.data?.transactions || []);
          setAnalytics(analyticsRes?.data || null);
        }
      } catch (error) {
        console.error("Failed to load vendor scoped data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVendorData();

    const handleRefetch = () => {
      fetchVendorData();
    };
    window.addEventListener("refetch-vendor-scope", handleRefetch);
    return () => {
      window.removeEventListener("refetch-vendor-scope", handleRefetch);
    };
  }, [user]);

  // Compute inventory items dynamically matching the frontend shape
  const inventory = useMemo(() => {
    const warehouses = ["WH-Mumbai-01", "WH-Bengaluru-02", "WH-Delhi-03", "WH-Chennai-04"];
    return products.map((p, i) => ({
      id: p.id,
      productId: p.id,
      productName: p.name,
      vendorName: p.vendorName || vendor?.businessName || "My Store",
      warehouse: warehouses[i % warehouses.length],
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      lastUpdated: p.updatedAt || p.createdAt,
    }));
  }, [products, vendor]);

  const defaultVendor = useMemo(() => {
    return {
      id: vendor?.id || "",
      businessName: user?.businessName || vendor?.businessName || "My Store",
      ownerName: user?.name || vendor?.ownerName || "",
      email: user?.email || vendor?.email || "",
      phone: user?.phone || vendor?.phone || "",
      avatar: user?.avatar || vendor?.avatar || "",
      status: vendor?.status || "pending",
      commission: vendor?.commission || 10,
      revenue: vendor?.revenue || 0,
      productCount: products.length,
      joinedAt: vendor?.joinedAt || new Date().toISOString(),
    };
  }, [user, vendor, products]);

  return {
    vendor: defaultVendor,
    vendorId: defaultVendor.id,
    products,
    orders,
    inventory,
    revenueByMonth: analytics?.revenueByMonth || [],
    categoryDistribution: analytics?.categoryDistribution || [],
    activityFeed: analytics?.activityFeed || [],
    loading,
  };
}

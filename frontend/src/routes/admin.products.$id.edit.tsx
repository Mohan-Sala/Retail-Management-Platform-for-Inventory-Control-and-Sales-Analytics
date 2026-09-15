import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader, BackLink } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

export const Route = createFileRoute("/admin/products/$id/edit")({
  loader: async ({ params }) => {
    try {
      const res: any = await api.get(`/products/${params.id}`);
      return res.data;
    } catch {
      throw notFound();
    }
  },
  component: EditProduct,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Not found.</div>,
});

function EditProduct() {
  const p = Route.useLoaderData();
  const nav = useNavigate();
  const form = useForm<any>({ defaultValues: p });
  return (
    <div>
      <BackLink to="/admin/products/$id" label="Back to product" />
      <PageHeader title={`Edit ${p.name}`} />
      <Card className="p-6">
        <form onSubmit={form.handleSubmit(async (data) => {
          try {
            await api.put(`/products/${p.id}`, data);
            toast.success("Product updated");
            nav({ to: "/admin/products/$id", params: { id: p.id } });
          } catch (err: any) {
            toast.error(err.message || "Failed to update product");
          }
        })} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2"><Label>Name</Label><Input {...form.register("name")} /></div>
          <div className="space-y-2"><Label>SKU</Label><Input {...form.register("sku")} /></div>
          <div className="space-y-2"><Label>Category</Label><Input {...form.register("category")} /></div>
          <div className="space-y-2"><Label>Price (₹)</Label><Input type="number" {...form.register("price")} /></div>
          <div className="space-y-2"><Label>Stock</Label><Input type="number" {...form.register("stock")} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea rows={4} {...form.register("description")} /></div>
          <div className="flex items-center justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => nav({ to: "/admin/products/$id", params: { id: p.id } })}>Cancel</Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

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

export const Route = createFileRoute("/admin/vendors/$id/edit")({
  loader: async ({ params }) => {
    try {
      const res: any = await api.get(`/vendors/${params.id}`);
      return res.data;
    } catch {
      throw notFound();
    }
  },
  component: EditVendor,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Vendor not found.</div>,
});

function EditVendor() {
  const v = Route.useLoaderData();
  const nav = useNavigate();
  const form = useForm<any>({ defaultValues: v });
  return (
    <div>
      <BackLink to="/admin/vendors/$id" label="Back to vendor" />
      <PageHeader title={`Edit ${v.businessName}`} />
      <Card className="p-6">
        <form onSubmit={form.handleSubmit(async (data) => {
          try {
            await api.put(`/vendors/${v.id}`, data);
            toast.success("Vendor updated");
            nav({ to: "/admin/vendors/$id", params: { id: v.id } });
          } catch (err: any) {
            toast.error(err.message || "Failed to update vendor");
          }
        })} className="grid gap-5 md:grid-cols-2">
          {(["businessName", "ownerName", "email", "phone", "gst", "city"] as const).map((k) => (
            <div key={k} className="space-y-2">
              <Label className="capitalize">{k.replace(/([A-Z])/g, " $1")}</Label>
              <Input {...form.register(k)} />
            </div>
          ))}
          <div className="space-y-2 md:col-span-2"><Label>Address</Label><Textarea {...form.register("address")} /></div>
          <div className="space-y-2"><Label>Commission %</Label><Input type="number" {...form.register("commission")} /></div>
          <div className="flex items-center justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => nav({ to: "/admin/vendors/$id", params: { id: v.id } })}>Cancel</Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

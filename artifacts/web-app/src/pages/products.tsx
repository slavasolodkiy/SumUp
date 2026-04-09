import { useState } from "react";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useListProductCategories,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Pencil, Trash2, X } from "lucide-react";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  sku: string;
  active: boolean;
}

const emptyForm: ProductForm = { name: "", description: "", price: "", currency: "GBP", category: "", sku: "", active: true };

export default function ProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const { data: products, isLoading } = useListProducts();
  const { data: categories } = useListProductCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const del = useDeleteProduct();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListProductsQueryKey() });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editId) {
        await update.mutateAsync({ productId: editId, data: payload as any });
        toast({ title: "Product updated" });
      } else {
        await create.mutateAsync({ data: payload as any });
        toast({ title: "Product created" });
      }
      invalidate();
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    } catch {
      toast({ title: "Error", description: "Failed to save product", variant: "destructive" });
    }
  };

  const startEdit = (p: any) => {
    setForm({ name: p.name, description: p.description || "", price: p.price.toString(), currency: p.currency, category: p.category || "", sku: p.sku || "", active: p.active });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await del.mutateAsync({ productId: id });
      invalidate();
      toast({ title: "Product deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    }
  };

  const fmt = (n: number, c = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(n);

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground" data-testid="text-page-title">Products</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your product catalogue</p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} data-testid="button-add-product">
            <Plus size={16} className="mr-1.5" />
            Add product
          </Button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-foreground">{editId ? "Edit product" : "New product"}</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)} data-testid="button-close-form">
                <X size={16} />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Product name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Flat White" required data-testid="input-product-name" />
              </div>
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="3.50" required data-testid="input-product-price" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  data-testid="select-currency"
                >
                  <option value="GBP">GBP (pound)</option>
                  <option value="EUR">EUR (euro)</option>
                  <option value="USD">USD (dollar)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  data-testid="select-category"
                >
                  <option value="">Select category</option>
                  {categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>SKU (optional)</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="FW-001" data-testid="input-sku" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description (optional)</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A short description" data-testid="input-description" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} data-testid="checkbox-active" />
                <Label htmlFor="active" className="cursor-pointer">Active (visible for sale)</Label>
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <Button type="submit" disabled={create.isPending || update.isPending} data-testid="button-save-product">
                  {create.isPending || update.isPending ? "Saving..." : editId ? "Update product" : "Create product"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel">Cancel</Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products?.length ? (
            <div className="divide-y divide-border">
              {products.map((p: any) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4" data-testid={`card-product-${p.id}`}>
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground" data-testid={`text-product-name-${p.id}`}>{p.name}</p>
                      {!p.active && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.category || "Uncategorised"}{p.sku ? ` · ${p.sku}` : ""}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground" data-testid={`text-product-price-${p.id}`}>{fmt(p.price, p.currency)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEdit(p)} data-testid={`button-edit-${p.id}`}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)} data-testid={`button-delete-${p.id}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <Package size={36} className="text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No products yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Add products to assign them to transactions</p>
              <Button className="mt-4" onClick={() => setShowForm(true)} data-testid="button-add-first-product">
                <Plus size={16} className="mr-1.5" />
                Add your first product
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

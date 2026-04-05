import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Camera, MapPin, DollarSign, Image, Trash2, Plus, Edit } from "lucide-react";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { useCurrency } from "@/hooks/useCurrency";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminPhotography = () => {
  const qc = useQueryClient();
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState("bookings");

  // Bookings
  const { data: bookings } = useQuery({
    queryKey: ["admin-photo-bookings"],
    queryFn: async () => {
      const { data } = await supabase.from("photo_bookings").select("*, photo_services(title), photo_packages(name, duration)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("photo_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-photo-bookings"] }); toast.success("Booking updated"); },
  });

  // Outside Dhaka requests
  const outsideDhakaBookings = bookings?.filter((b: any) => b.location_type === "outside_dhaka") || [];

  // Travel fees
  const { data: travelFees } = useQuery({
    queryKey: ["admin-travel-fees"],
    queryFn: async () => {
      const { data } = await supabase.from("photo_travel_fees").select("*").order("district");
      return data || [];
    },
  });

  const [editFee, setEditFee] = useState<any>(null);
  const updateFee = useMutation({
    mutationFn: async (fee: any) => {
      const { error } = await supabase.from("photo_travel_fees").update({ fee: fee.fee, is_available: fee.is_available }).eq("id", fee.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-travel-fees"] }); toast.success("Fee updated"); setEditFee(null); },
  });

  // Services & Packages
  const { data: services } = useQuery({
    queryKey: ["admin-photo-services"],
    queryFn: async () => {
      const { data } = await supabase.from("photo_services").select("*").order("display_order");
      return data || [];
    },
  });

  const { data: packages } = useQuery({
    queryKey: ["admin-photo-packages"],
    queryFn: async () => {
      const { data } = await supabase.from("photo_packages").select("*").order("display_order");
      return data || [];
    },
  });

  const [editPkg, setEditPkg] = useState<any>(null);
  const updatePkg = useMutation({
    mutationFn: async (pkg: any) => {
      const { error } = await supabase.from("photo_packages").update({ price: pkg.price, name: pkg.name, duration: pkg.duration }).eq("id", pkg.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-photo-packages"] }); toast.success("Package updated"); setEditPkg(null); },
  });

  // Portfolio
  const { data: portfolio } = useQuery({
    queryKey: ["admin-photo-portfolio"],
    queryFn: async () => {
      const { data } = await supabase.from("photo_portfolio").select("*").order("display_order");
      return data || [];
    },
  });

  const [newMedia, setNewMedia] = useState({ title: "", media_type: "photo", media_url: "", video_embed_url: "", thumbnail_url: "" });
  const addMedia = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("photo_portfolio").insert({ ...newMedia, display_order: (portfolio?.length || 0) + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-photo-portfolio"] });
      toast.success("Media added");
      setNewMedia({ title: "", media_type: "photo", media_url: "", video_embed_url: "", thumbnail_url: "" });
    },
  });

  const deleteMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("photo_portfolio").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-photo-portfolio"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Camera className="h-6 w-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold">Photography Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="outside">Outside Dhaka</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="travel">Travel Fees</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card>
            <CardHeader><CardTitle>All Bookings</CardTitle></CardHeader>
            <CardContent>
              <div className="md:hidden space-y-3">
                {bookings?.map((b: any) => (
                  <Card key={b.id} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{b.booking_number}</p>
                        <p className="text-xs text-muted-foreground">{b.customer_name} • {b.customer_phone}</p>
                      </div>
                      <Badge className={statusColors[b.status]}>{b.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{b.photo_services?.title} — {b.photo_packages?.name}</p>
                    <p className="text-xs mb-2">{b.event_date} {b.event_time && `at ${b.event_time}`}</p>
                    <p className="text-sm font-bold text-primary mb-2">{formatCurrency(b.total)}</p>
                    <div className="flex gap-1 flex-wrap">
                      {b.status === "pending" && <Button size="sm" variant="default" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "approved" })}>Approve</Button>}
                      {b.status === "approved" && <Button size="sm" variant="default" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "completed" })}>Complete</Button>}
                      {b.status !== "cancelled" && b.status !== "completed" && <Button size="sm" variant="destructive" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "cancelled" })}>Cancel</Button>}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.booking_number}</TableCell>
                        <TableCell>
                          <div>{b.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                        </TableCell>
                        <TableCell>{b.photo_services?.title}<br /><span className="text-xs text-muted-foreground">{b.photo_packages?.name}</span></TableCell>
                        <TableCell>{b.event_date}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(b.total)}</TableCell>
                        <TableCell><Badge className={statusColors[b.status]}>{b.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {b.status === "pending" && <Button size="sm" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "approved" })}>Approve</Button>}
                            {b.status === "approved" && <Button size="sm" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "completed" })}>Complete</Button>}
                            {b.status !== "cancelled" && b.status !== "completed" && <Button size="sm" variant="destructive" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "cancelled" })}>Cancel</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {(!bookings || bookings.length === 0) && <p className="text-center text-muted-foreground py-8">No bookings yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outside">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Outside Dhaka Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {travelFees?.filter((t: any) => t.district !== "Dhaka" && t.request_count > 0).map((t: any) => (
                  <Card key={t.id} className="p-3 text-center">
                    <p className="font-semibold text-sm">{t.district}</p>
                    <p className="text-2xl font-bold text-primary">{t.request_count}</p>
                    <p className="text-xs text-muted-foreground">requests</p>
                  </Card>
                ))}
              </div>
              {outsideDhakaBookings.length > 0 ? (
                <div className="space-y-3">
                  {outsideDhakaBookings.map((b: any) => (
                    <Card key={b.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{b.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{b.customer_phone} • {b.district}</p>
                          <p className="text-sm">{b.event_date} — {b.photo_services?.title}</p>
                        </div>
                        <Badge className={statusColors[b.status]}>{b.status}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No outside Dhaka requests yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Package Pricing</CardTitle></CardHeader>
            <CardContent>
              {services?.map((svc: any) => (
                <div key={svc.id} className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">{svc.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {packages?.filter((p: any) => p.service_id === svc.id).map((pkg: any) => (
                      <Card key={pkg.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{pkg.name}</p>
                            <p className="text-sm text-muted-foreground">{pkg.duration}</p>
                          </div>
                          <span className="text-lg font-bold text-primary">{formatCurrency(pkg.price)}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setEditPkg({ ...pkg })} className="w-full mt-2">
                          <Edit className="h-3 w-3 mr-1" /> Edit Price
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel">
          <Card>
            <CardHeader><CardTitle>Travel Conveyance Fees</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {travelFees?.map((t: any) => (
                  <Card key={t.id} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold">{t.district}</p>
                      <Badge variant={t.is_available ? "default" : "secondary"}>{t.is_available ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="text-lg font-bold text-primary mb-2">{formatCurrency(t.fee)}</p>
                    <p className="text-xs text-muted-foreground mb-2">{t.request_count} requests</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => setEditFee({ ...t })}>Edit</Button>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" /> Portfolio Gallery</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Add New Media</h4>
                <Input placeholder="Title" value={newMedia.title} onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })} />
                <Select value={newMedia.media_type} onValueChange={(v) => setNewMedia({ ...newMedia, media_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
                {newMedia.media_type === "photo" ? (
                  <CloudinaryUpload folder="photography/portfolio" onUpload={(url) => setNewMedia({ ...newMedia, media_url: url })} currentImage={newMedia.media_url} label="Upload Photo" />
                ) : (
                  <>
                    <Input placeholder="Video Embed URL (YouTube/Vimeo)" value={newMedia.video_embed_url} onChange={(e) => setNewMedia({ ...newMedia, video_embed_url: e.target.value, media_url: e.target.value })} />
                    <CloudinaryUpload folder="photography/thumbnails" onUpload={(url) => setNewMedia({ ...newMedia, thumbnail_url: url })} currentImage={newMedia.thumbnail_url} label="Thumbnail Image" />
                  </>
                )}
                <Button onClick={() => addMedia.mutate()} disabled={!newMedia.media_url}>
                  <Plus className="h-4 w-4 mr-1" /> Add to Portfolio
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {portfolio?.map((item: any) => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden border border-border">
                    {item.media_type === "photo" ? (
                      <img src={item.media_url} alt={item.title} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" /> : <Camera className="h-8 w-8 text-muted-foreground" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="destructive" onClick={() => deleteMedia.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.title && <p className="p-2 text-xs truncate">{item.title}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editPkg} onOpenChange={() => setEditPkg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Package</DialogTitle></DialogHeader>
          {editPkg && (
            <div className="space-y-4">
              <Input placeholder="Name" value={editPkg.name} onChange={(e) => setEditPkg({ ...editPkg, name: e.target.value })} />
              <Input placeholder="Duration" value={editPkg.duration} onChange={(e) => setEditPkg({ ...editPkg, duration: e.target.value })} />
              <Input type="number" placeholder="Price" value={editPkg.price} onChange={(e) => setEditPkg({ ...editPkg, price: Number(e.target.value) })} />
              <Button onClick={() => updatePkg.mutate(editPkg)} className="w-full">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editFee} onOpenChange={() => setEditFee(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Travel Fee — {editFee?.district}</DialogTitle></DialogHeader>
          {editFee && (
            <div className="space-y-4">
              <Input type="number" placeholder="Fee" value={editFee.fee} onChange={(e) => setEditFee({ ...editFee, fee: Number(e.target.value) })} />
              <div className="flex items-center gap-3">
                <Switch checked={editFee.is_available} onCheckedChange={(c) => setEditFee({ ...editFee, is_available: c })} />
                <span className="text-sm">Available for booking</span>
              </div>
              <Button onClick={() => updateFee.mutate(editFee)} className="w-full">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPhotography;

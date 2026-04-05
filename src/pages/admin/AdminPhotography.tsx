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
import { Camera, MapPin, DollarSign, Image, Trash2, Plus, Edit, CalendarCheck, Clock, TrendingUp, Users, CheckCircle2, XCircle, Eye, Video } from "lucide-react";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { useCurrency } from "@/hooks/useCurrency";

const statusConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock },
  approved: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: Eye },
  completed: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  cancelled: { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: XCircle },
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

  // Stats
  const totalBookings = bookings?.length || 0;
  const pendingCount = bookings?.filter((b: any) => b.status === "pending").length || 0;
  const completedCount = bookings?.filter((b: any) => b.status === "completed").length || 0;
  const totalRevenue = bookings?.filter((b: any) => b.status === "completed").reduce((sum: number, b: any) => sum + (b.total || 0), 0) || 0;

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Camera className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Photography Management</h1>
          <p className="text-xs text-muted-foreground">Manage bookings, pricing & portfolio</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Bookings", value: totalBookings, icon: CalendarCheck, color: "text-primary" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-600" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto p-1 bg-muted/50 rounded-xl w-full grid grid-cols-3 md:grid-cols-5 gap-1">
          {[
            { value: "bookings", label: "Bookings", icon: CalendarCheck },
            { value: "outside", label: "Outside Dhaka", icon: MapPin },
            { value: "pricing", label: "Pricing", icon: DollarSign },
            { value: "travel", label: "Travel Fees", icon: TrendingUp },
            { value: "portfolio", label: "Portfolio", icon: Image },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 py-2"
            >
              <tab.icon className="h-3.5 w-3.5 hidden md:block" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="mt-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg">All Bookings</CardTitle>
                <Badge variant="outline" className="text-xs">{totalBookings} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {bookings?.map((b: any) => (
                  <div key={b.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-mono text-xs font-medium text-primary">{b.booking_number}</p>
                        <p className="font-semibold text-sm text-foreground">{b.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{b.customer_phone}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Camera className="h-3 w-3" /> {b.photo_services?.title}</span>
                      <span>{b.photo_packages?.name}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div>
                        <p className="text-xs text-muted-foreground">{b.event_date} {b.event_time && `• ${b.event_time}`}</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(b.total)}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {b.status === "pending" && <Button size="sm" className="h-8 text-xs rounded-lg" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "approved" })}>Approve</Button>}
                        {b.status === "approved" && <Button size="sm" className="h-8 text-xs rounded-lg" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "completed" })}>Complete</Button>}
                        {b.status !== "cancelled" && b.status !== "completed" && (
                          <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "cancelled" })}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/30">
                      <TableHead className="text-xs font-medium text-muted-foreground">Booking #</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Customer</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Service</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Total</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.map((b: any) => (
                      <TableRow key={b.id} className="border-border/20 hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-primary font-medium">{b.booking_number}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{b.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{b.customer_phone}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{b.photo_services?.title}</p>
                          <p className="text-xs text-muted-foreground">{b.photo_packages?.name}</p>
                        </TableCell>
                        <TableCell className="text-sm">{b.event_date}</TableCell>
                        <TableCell className="font-semibold text-primary">{formatCurrency(b.total)}</TableCell>
                        <TableCell><StatusBadge status={b.status} /></TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            {b.status === "pending" && <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "approved" })}>Approve</Button>}
                            {b.status === "approved" && <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "completed" })}>Complete</Button>}
                            {b.status !== "cancelled" && b.status !== "completed" && <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => updateBookingStatus.mutate({ id: b.id, status: "cancelled" })}><XCircle className="h-3.5 w-3.5" /></Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {(!bookings || bookings.length === 0) && (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <CalendarCheck className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No bookings yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Bookings will appear here once customers start booking</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outside Dhaka Tab */}
        <TabsContent value="outside" className="mt-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Outside Dhaka Requests</CardTitle>
                  <p className="text-xs text-muted-foreground">Track expansion demand by district</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* District Demand Grid */}
              {travelFees?.filter((t: any) => t.district !== "Dhaka" && t.request_count > 0).length ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {travelFees?.filter((t: any) => t.district !== "Dhaka" && t.request_count > 0).map((t: any) => (
                    <div key={t.id} className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-4 text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t.district}</p>
                      <p className="text-3xl font-bold text-primary">{t.request_count}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">requests</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 border border-dashed border-border/50 p-6 text-center">
                  <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No district requests tracked yet</p>
                </div>
              )}

              {/* Booking List */}
              {outsideDhakaBookings.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Booking Requests</h3>
                  {outsideDhakaBookings.map((b: any) => (
                    <div key={b.id} className="rounded-xl border border-border/50 p-4 flex justify-between items-start gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{b.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{b.customer_phone} • {b.district}</p>
                        <p className="text-xs text-muted-foreground">{b.event_date} — {b.photo_services?.title}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No outside Dhaka booking requests yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="mt-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Package Pricing</CardTitle>
                  <p className="text-xs text-muted-foreground">Manage service packages & rates</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {services?.map((svc: any) => (
                <div key={svc.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h3 className="font-semibold text-foreground">{svc.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {packages?.filter((p: any) => p.service_id === svc.id).map((pkg: any) => (
                      <div key={pkg.id} className="rounded-xl border border-border/50 p-4 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{pkg.duration}</p>
                          </div>
                          <span className="text-lg font-bold text-primary">{formatCurrency(pkg.price)}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setEditPkg({ ...pkg })} className="w-full h-8 text-xs rounded-lg border-border/50">
                          <Edit className="h-3 w-3 mr-1.5" /> Edit Price
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Travel Fees Tab */}
        <TabsContent value="travel" className="mt-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Travel Conveyance Fees</CardTitle>
                  <p className="text-xs text-muted-foreground">Set location-based travel charges</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {travelFees?.map((t: any) => (
                  <div key={t.id} className="rounded-xl border border-border/50 p-4 hover:border-primary/20 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${t.is_available ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <p className="font-semibold text-sm text-foreground">{t.district}</p>
                      </div>
                      <Badge variant={t.is_available ? "default" : "secondary"} className="text-[10px] h-5 rounded-md">
                        {t.is_available ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-primary mb-1">{formatCurrency(t.fee)}</p>
                    <p className="text-[11px] text-muted-foreground mb-3">{t.request_count} requests</p>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs rounded-lg border-border/50" onClick={() => setEditFee({ ...t })}>
                      <Edit className="h-3 w-3 mr-1.5" /> Edit Fee
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="mt-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Image className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Portfolio Gallery</CardTitle>
                  <p className="text-xs text-muted-foreground">{portfolio?.length || 0} items in gallery</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Section */}
              <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/[0.02] p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm text-foreground">Add New Media</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Title" value={newMedia.title} onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })} className="h-9 text-sm rounded-lg" />
                  <Select value={newMedia.media_type} onValueChange={(v) => setNewMedia({ ...newMedia, media_type: v })}>
                    <SelectTrigger className="h-9 text-sm rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo"><span className="flex items-center gap-2"><Image className="h-3 w-3" /> Photo</span></SelectItem>
                      <SelectItem value="video"><span className="flex items-center gap-2"><Video className="h-3 w-3" /> Video</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newMedia.media_type === "photo" ? (
                  <CloudinaryUpload folder="photography/portfolio" onChange={(url) => setNewMedia({ ...newMedia, media_url: url })} value={newMedia.media_url} label="Upload Photo" />
                ) : (
                  <div className="space-y-3">
                    <Input placeholder="Video Embed URL (YouTube/Vimeo)" value={newMedia.video_embed_url} onChange={(e) => setNewMedia({ ...newMedia, video_embed_url: e.target.value, media_url: e.target.value })} className="h-9 text-sm rounded-lg" />
                    <CloudinaryUpload folder="photography/thumbnails" onChange={(url) => setNewMedia({ ...newMedia, thumbnail_url: url })} value={newMedia.thumbnail_url} label="Thumbnail Image" />
                  </div>
                )}
                <Button onClick={() => addMedia.mutate()} disabled={!newMedia.media_url} className="rounded-lg h-9 text-sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add to Portfolio
                </Button>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {portfolio?.map((item: any) => (
                  <div key={item.id} className="relative group rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                    {item.media_type === "photo" ? (
                      <img src={item.media_url} alt={item.title} className="w-full aspect-square object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full aspect-square bg-muted/50 flex items-center justify-center relative">
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        )}
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-foreground/70 text-background text-[9px] h-4 px-1.5 rounded-md">VIDEO</Badge>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-sm">
                      <Button size="sm" variant="destructive" className="rounded-lg h-8 text-xs" onClick={() => deleteMedia.mutate(item.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                    {item.title && (
                      <div className="p-2.5 bg-card">
                        <p className="text-xs font-medium truncate text-foreground">{item.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {(!portfolio || portfolio.length === 0) && (
                <div className="text-center py-12 rounded-xl bg-muted/20 border border-dashed border-border/50">
                  <Image className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground font-medium">No portfolio items yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload photos and videos to showcase your work</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Package Dialog */}
      <Dialog open={!!editPkg} onOpenChange={() => setEditPkg(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" /> Edit Package
            </DialogTitle>
          </DialogHeader>
          {editPkg && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Package Name</label>
                <Input value={editPkg.name} onChange={(e) => setEditPkg({ ...editPkg, name: e.target.value })} className="rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Duration</label>
                <Input value={editPkg.duration} onChange={(e) => setEditPkg({ ...editPkg, duration: e.target.value })} className="rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price</label>
                <Input type="number" value={editPkg.price} onChange={(e) => setEditPkg({ ...editPkg, price: Number(e.target.value) })} className="rounded-lg" />
              </div>
              <Button onClick={() => updatePkg.mutate(editPkg)} className="w-full rounded-lg">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Travel Fee Dialog */}
      <Dialog open={!!editFee} onOpenChange={() => setEditFee(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Edit Travel Fee — {editFee?.district}
            </DialogTitle>
          </DialogHeader>
          {editFee && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fee Amount</label>
                <Input type="number" value={editFee.fee} onChange={(e) => setEditFee({ ...editFee, fee: Number(e.target.value) })} className="rounded-lg" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <p className="text-sm font-medium">Available for Booking</p>
                  <p className="text-xs text-muted-foreground">Enable to allow bookings in this area</p>
                </div>
                <Switch checked={editFee.is_available} onCheckedChange={(c) => setEditFee({ ...editFee, is_available: c })} />
              </div>
              <Button onClick={() => updateFee.mutate(editFee)} className="w-full rounded-lg">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPhotography;

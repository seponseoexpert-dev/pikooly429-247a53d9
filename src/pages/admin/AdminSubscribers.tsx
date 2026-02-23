import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminSubscribers = () => {
  const queryClient = useQueryClient();

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast.success("Subscriber deleted");
    },
    onError: () => toast.error("Failed to delete subscriber"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("newsletter_subscribers").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Newsletter Subscribers</h2>
            <p className="text-sm text-muted-foreground">{subscribers.length} total subscribers</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Subscribed At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-40 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted rounded-full animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : subscribers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No subscribers yet</TableCell></TableRow>
              ) : (
                subscribers.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground hidden sm:inline-block" />
                      {sub.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sub.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleMutation.mutate({ id: sub.id, is_active: !sub.is_active })}
                      >
                        {sub.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {format(new Date(sub.created_at), "dd MMM yyyy, hh:mm a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(sub.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
    </div>
  );
};

export default AdminSubscribers;

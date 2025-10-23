import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Shield, User, Calendar, FileText } from "lucide-react";

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const AuditLogViewer = () => {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("grant")) return "default";
    if (action.includes("revoke")) return "destructive";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Admin Audit Log</CardTitle>
        </div>
        <CardDescription>
          Complete history of all admin actions with IP tracking and detailed changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading audit logs...</div>
        ) : auditLogs?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit logs found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeColor(log.action) as any}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-mono text-xs">
                          {log.admin_user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.target_user_id ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {log.target_user_id.slice(0, 8)}...
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-xs">
                      {log.ip_address || "N/A"}
                    </TableCell>
                    <TableCell>
                      <details className="cursor-pointer">
                        <summary className="flex items-center gap-1 text-sm text-primary hover:underline">
                          <FileText className="h-4 w-4" />
                          View details
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

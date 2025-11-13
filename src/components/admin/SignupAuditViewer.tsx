import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Shield, AlertTriangle, Calendar, Globe } from "lucide-react";
import { useState } from "react";

interface SignupAudit {
  id: string;
  user_id: string;
  email: string;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
  flagged_as_suspicious: boolean;
  fraud_reason: string | null;
  accounts_from_ip: number;
}

export const SignupAuditViewer = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: signups, isLoading } = useQuery({
    queryKey: ["signup-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signup_audit" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as unknown as SignupAudit[];
    },
  });

  const filteredSignups = signups?.filter(
    (signup) =>
      signup.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signup.ip_address.includes(searchQuery)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Signup Audit Log</CardTitle>
          </div>
          <Input
            placeholder="Search by email or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <CardDescription>
          Recent account signups with IP tracking and fraud detection
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading signup audit...</div>
        ) : filteredSignups?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No signups found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Accounts from IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignups?.map((signup) => (
                  <TableRow 
                    key={signup.id}
                    className={signup.flagged_as_suspicious ? "bg-destructive/10" : ""}
                  >
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(signup.created_at), "MMM d, yyyy HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {signup.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{signup.ip_address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={signup.accounts_from_ip > 3 ? "destructive" : "secondary"}>
                        {signup.accounts_from_ip}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {signup.flagged_as_suspicious ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Flagged
                        </Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {signup.fraud_reason || "-"}
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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertTriangle, Globe, Users, Calendar } from "lucide-react";

interface SuspiciousSignup {
  ip_address: string;
  account_count: number;
  signup_count: number;
  emails: string[];
  last_signup: string;
  first_signup: string;
  has_flags: boolean;
}

export const FraudDetectionPanel = () => {
  const { data: suspiciousIPs, isLoading } = useQuery({
    queryKey: ["suspicious-signups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_suspicious_signups" as any)
        .select("*")
        .order("account_count", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as unknown as SuspiciousSignup[];
    },
  });

  const getRiskLevel = (accountCount: number) => {
    if (accountCount >= 5) return { label: "Critical", variant: "destructive" as const };
    if (accountCount >= 3) return { label: "High", variant: "destructive" as const };
    return { label: "Moderate", variant: "secondary" as const };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle>Suspicious IP Activity</CardTitle>
        </div>
        <CardDescription>
          IP addresses with multiple account registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading fraud detection data...</div>
        ) : suspiciousIPs?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No suspicious activity detected
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Accounts</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>First Signup</TableHead>
                  <TableHead>Last Signup</TableHead>
                  <TableHead>Associated Emails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspiciousIPs?.map((ip) => {
                  const risk = getRiskLevel(ip.account_count);
                  return (
                    <TableRow 
                      key={ip.ip_address}
                      className={risk.variant === "destructive" ? "bg-destructive/10" : ""}
                    >
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{ip.ip_address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{ip.account_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={risk.variant}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {risk.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(ip.first_signup), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(ip.last_signup), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <details className="cursor-pointer">
                          <summary className="text-sm text-primary hover:underline">
                            View {ip.emails.length} email{ip.emails.length !== 1 ? 's' : ''}
                          </summary>
                          <div className="mt-2 space-y-1">
                            {ip.emails.map((email, idx) => (
                              <div key={idx} className="text-xs font-mono text-muted-foreground">
                                {email}
                              </div>
                            ))}
                          </div>
                        </details>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Zap, AlertTriangle } from 'lucide-react';

interface CostAnalytic {
  email: string;
  subscription_package: string | null;
  subscribed: boolean;
  month_year: string;
  total_credits: number;
  total_cost_usd: number;
  monthly_revenue: number;
  profit_margin: number;
}

export function CostAnalytics() {
  const [analytics, setAnalytics] = useState<CostAnalytic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_cost_analysis' as any)
        .select('*')
        .order('profit_margin', { ascending: true });

      if (error) throw error;
      if (data) {
        setAnalytics(data as any);
      }
    } catch (error) {
      console.error('Error loading cost analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = analytics.reduce((sum, row) => sum + (row.monthly_revenue || 0), 0);
  const totalCost = analytics.reduce((sum, row) => sum + (row.total_cost_usd || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

  // Identify users with negative margins
  const negativeMarginUsers = analytics.filter(row => row.profit_margin < 0);
  const warningMarginUsers = analytics.filter(row => row.profit_margin >= 0 && row.profit_margin < row.monthly_revenue * 0.4);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading cost analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total AI Costs</CardTitle>
            <Zap className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">OpenAI usage</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {totalProfit > 0 ? (
              <TrendingUp className="h-4 w-4 text-blue-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit > 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">After AI costs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            {profitMargin >= 70 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : profitMargin >= 40 ? (
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              profitMargin >= 70 ? 'text-green-600' : 
              profitMargin >= 40 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {negativeMarginUsers.length > 0 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {negativeMarginUsers.length} User{negativeMarginUsers.length !== 1 ? 's' : ''} with Negative Margins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              These users are costing more in AI usage than their subscription revenue. Consider implementing usage caps or reviewing their access.
            </p>
          </CardContent>
        </Card>
      )}

      {warningMarginUsers.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              {warningMarginUsers.length} User{warningMarginUsers.length !== 1 ? 's' : ''} with Low Margins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              These users have profit margins below 40%. Monitor their usage patterns.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed User Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead className="text-right">Credits Used</TableHead>
                  <TableHead className="text-right">AI Cost</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No usage data available for this month
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.map((row, idx) => {
                    const margin = row.monthly_revenue > 0 
                      ? ((row.profit_margin / row.monthly_revenue) * 100)
                      : 0;
                    
                    const isNegative = row.profit_margin < 0;
                    const isLow = margin < 40 && margin >= 0;
                    
                    return (
                      <TableRow key={idx} className={isNegative ? 'bg-red-50 dark:bg-red-950/20' : isLow ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                        <TableCell className="font-medium">{row.email}</TableCell>
                        <TableCell>
                          {row.subscription_package ? (
                            <Badge variant={row.subscribed ? 'default' : 'outline'}>
                              {row.subscription_package}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Free</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{row.total_credits || 0}</TableCell>
                        <TableCell className="text-right text-red-600">
                          ${(row.total_cost_usd || 0).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ${(row.monthly_revenue || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${row.profit_margin > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          ${(row.profit_margin || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={isNegative ? 'destructive' : isLow ? 'outline' : 'secondary'}>
                            {margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

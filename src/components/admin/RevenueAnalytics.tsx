import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, CreditCard } from "lucide-react";

export const RevenueAnalytics = () => {
  const [livePaidCount, setLivePaidCount] = useState(0);

  const { data: subscriptionStats } = useQuery({
    queryKey: ["revenue-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscribers_public")
        .select("subscription_tier, subscribed");
      
      if (error) throw error;
      
      const paidSubs = data.filter(s => s.subscribed);
      
      const tierCounts = paidSubs.reduce((acc: Record<string, number>, sub) => {
        const tier = sub.subscription_tier || "unknown";
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});
      
      setLivePaidCount(paidSubs.length);
      
      return {
        totalPaid: paidSubs.length,
        totalTrials: 0,
        tierBreakdown: tierCounts,
        conversionRate: 0
      };
    }
  });

  useEffect(() => {
    const subChannel = supabase
      .channel('revenue-subscriptions')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'subscribers_public'
      }, (payload) => {
        if (payload.new.subscribed && !payload.old.subscribed) {
          setLivePaidCount(prev => prev + 1);
        } else if (!payload.new.subscribed && payload.old.subscribed) {
          setLivePaidCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subChannel);
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid Subscribers</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold transition-all duration-300">{livePaidCount}</div>
          <p className="text-xs text-muted-foreground">Active paying users</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subscriptionStats?.totalTrials || 0}</div>
          <p className="text-xs text-muted-foreground">Active trials</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subscriptionStats?.conversionRate || 0}%</div>
          <p className="text-xs text-muted-foreground">Trial to paid</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tier Distribution</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {subscriptionStats?.tierBreakdown && Object.entries(subscriptionStats.tierBreakdown).map(([tier, count]) => (
              <div key={tier} className="flex justify-between text-sm">
                <span className="capitalize">{tier}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

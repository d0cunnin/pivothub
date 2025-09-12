import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Star, Target } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

export const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAnalytics } = useAnalytics();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getAnalytics(undefined, parseInt(timeRange));
      setAnalyticsData(data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const toolUsage = analyticsData.reduce((acc: Record<string, number>, item) => {
    acc[item.tool_name] = (acc[item.tool_name] || 0) + 1;
    return acc;
  }, {});

  const toolUsageData = Object.entries(toolUsage).map(([name, count]) => ({
    name: name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count
  }));

  const dailyUsage = analyticsData.reduce((acc: Record<string, number>, item) => {
    const date = new Date(item.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const dailyUsageData = Object.entries(dailyUsage)
    .map(([date, count]) => ({ date, count }))
    .slice(-7); // Last 7 days

  const avgResponseTime = analyticsData.length > 0 
    ? analyticsData.reduce((sum, item) => sum + (item.response_time_ms || 0), 0) / analyticsData.length
    : 0;

  const avgInputQuality = analyticsData.length > 0
    ? analyticsData.reduce((sum, item) => sum + (item.input_quality_score || 0), 0) / analyticsData.length
    : 0;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Usage Analytics</h2>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {analyticsData.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No data yet</h3>
            <p className="text-muted-foreground">
              Start using our AI tools to see analytics here
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Uses</span>
                </div>
                <p className="text-2xl font-bold mt-1">{analyticsData.length}</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                </div>
                <p className="text-2xl font-bold mt-1">{Math.round(avgResponseTime / 1000)}s</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Input Quality</span>
                </div>
                <p className="text-2xl font-bold mt-1">{avgInputQuality.toFixed(1)}/5</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Tools Used</span>
                </div>
                <p className="text-2xl font-bold mt-1">{Object.keys(toolUsage).length}</p>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tool Usage Chart */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Tool Usage Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={toolUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {toolUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Daily Usage Trend */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Daily Usage Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Most Used Tools */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Most Popular Tools</h3>
              <div className="space-y-2">
                {toolUsageData.slice(0, 5).map((tool, index) => (
                  <div key={tool.name} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{tool.name}</span>
                    </div>
                    <span className="text-muted-foreground">{Number(tool.count)} uses</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};
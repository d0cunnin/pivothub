import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText } from "lucide-react";

export const AssessmentAnalytics = () => {
  const { data: assessmentData } = useQuery({
    queryKey: ["assessment-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_results")
        .select("assessment_type, score");
      
      if (error) throw error;
      
      const typeStats = data.reduce((acc: Record<string, { count: number; totalScore: number }>, item) => {
        const type = item.assessment_type;
        if (!acc[type]) {
          acc[type] = { count: 0, totalScore: 0 };
        }
        acc[type].count += 1;
        acc[type].totalScore += Number(item.score) || 0;
        return acc;
      }, {});
      
      return Object.entries(typeStats).map(([type, stats]) => ({
        type,
        count: stats.count,
        avgScore: stats.totalScore / stats.count
      }));
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Assessment Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assessmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Completions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assessmentData?.map((item) => (
              <div key={item.type} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 capitalize">{item.type}</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Completions: <span className="font-medium text-foreground">{item.count}</span></p>
                  <p className="text-muted-foreground">Avg Score: <span className="font-medium text-foreground">{item.avgScore.toFixed(1)}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

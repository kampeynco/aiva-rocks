import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateAgentForm } from "@/components/agents/CreateAgentForm";

export default function Index() {
  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: recentCalls, isLoading: isLoadingCalls } = useQuery({
    queryKey: ['recent-calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <CreateAgentForm />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Voice Agents</CardTitle>
            <CardDescription>Your active and inactive voice agents</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAgents ? (
              <p>Loading agents...</p>
            ) : (
              <div className="space-y-2">
                {agents?.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{agent.name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Latest call activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCalls ? (
              <p>Loading calls...</p>
            ) : (
              <div className="space-y-2">
                {recentCalls?.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-2 border rounded">
                    <span>{call.phone_number}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(call.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
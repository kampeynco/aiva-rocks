import React, { useState } from 'react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const CALLS_PER_PAGE = 5;

export default function Index() {
  const [currentPage, setCurrentPage] = useState(1);

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

  const { data: callsData, isLoading: isLoadingCalls } = useQuery({
    queryKey: ['recent-calls', currentPage],
    queryFn: async () => {
      const { data: calls, error, count } = await supabase
        .from('calls')
        .select('*, agents(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * CALLS_PER_PAGE, currentPage * CALLS_PER_PAGE - 1);
      
      if (error) throw error;
      return { calls, totalCount: count || 0 };
    },
  });

  const totalPages = callsData ? Math.ceil(callsData.totalCount / CALLS_PER_PAGE) : 0;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
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
                {agents?.length === 0 ? (
                  <p className="text-muted-foreground">No agents found</p>
                ) : (
                  agents?.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                      <span>{agent.name}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Latest call activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCalls ? (
              <p>Loading calls...</p>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callsData?.calls.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No calls found
                          </TableCell>
                        </TableRow>
                      ) : (
                        callsData?.calls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell>{call.agents?.name || 'N/A'}</TableCell>
                            <TableCell>{call.phone_number}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded ${
                                call.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {call.status}
                              </span>
                            </TableCell>
                            <TableCell>{formatDuration(call.duration)}</TableCell>
                            <TableCell>{format(new Date(call.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(p => Math.max(1, p - 1));
                            }}
                            aria-disabled={currentPage === 1}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(p => Math.min(totalPages, p + 1));
                            }}
                            aria-disabled={currentPage === totalPages}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type Level = "city" | "subcity" | "woreda";
type Agent = { id: number; name: string; email: string; city_id: number | null; subcity_id: number | null; woreda_id: number | null };
type Window = { id: number; name: string; title?: string; administrative_level?: string; availability?: string[] | { levels?: string[] }; city_id: number | null; subcity_id: number | null; woreda_id: number | null };
type Assignment = { id: number; agent_id: number; window_id: number; assignment_level: Level };
type Board = { agents: Agent[]; windows: Window[]; assignments: Assignment[] };

export default function AgentWindowAssignmentPage() {
  const [board, setBoard] = useState<Board>({ agents: [], windows: [], assignments: [] });
  const [agentId, setAgentId] = useState(0);
  const [level, setLevel] = useState<Level>("city");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { const response = await api.get("/agent-window-assignment/board"); setBoard(response.data.data); }
    catch (error: any) { toast.error(error?.response?.data?.message || "Unable to load Agent assignments."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const agent = board.agents.find(a => a.id === agentId);
  const windows = useMemo(() => board.windows.filter(w => {
    if (!agent) return false;
    const levels = Array.isArray(w.availability) ? w.availability : w.availability?.levels ?? [];
    if (!levels.includes(level) && w.administrative_level !== level) return false;
    if (level === "subcity" && !agent.subcity_id || level === "woreda" && !agent.woreda_id) return false;
    return (["city_id", "subcity_id", "woreda_id"] as const).every(key => w[key] == null || w[key] === agent[key]);
  }), [board.windows, agent, level]);
  const change = async (windowId: number, assigned: boolean) => {
    setBusy(true);
    try {
      const payload = { agent_id: agentId, window_id: windowId, level };
      if (assigned) await api.delete("/agent-window-assignment/unassign", { data: payload });
      else await api.post("/agent-window-assignment/assign", payload);
      await load(); toast.success(assigned ? "Window removed." : "Window assigned.");
    } catch (error: any) {
      const errors = error?.response?.data?.errors;
      toast.error(errors ? Object.values(errors).flat().join(" ") : error?.response?.data?.message || "Unable to save assignment.");
    } finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
    <div><h1 className="text-2xl font-semibold">Agent Window Assignment</h1><p className="text-sm text-muted-foreground">Assign multiple windows to an Agent within the same authorized administrative location.</p></div>
    <Card><CardContent className="space-y-5 pt-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">Agent
          <select className="flex h-10 w-full rounded-md border bg-background px-3" value={agentId} onChange={e => setAgentId(Number(e.target.value))}>
            <option value={0}>Select Agent</option>{board.agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">Administrative level
          <select className="flex h-10 w-full rounded-md border bg-background px-3" value={level} onChange={e => setLevel(e.target.value as Level)}>
            <option value="city">City</option><option value="subcity">Subcity</option><option value="woreda">Woreda</option>
          </select>
        </label>
      </div>
      {loading ? <p role="status">Loading assignments…</p> : !agent ? <p className="text-sm text-muted-foreground">Select an Agent to manage their windows.</p> : windows.length === 0 ? <p className="text-sm text-muted-foreground">No eligible windows at this administrative level and location.</p> :
        <div className="space-y-2">{windows.map(w => {
          const assigned = board.assignments.some(a => a.agent_id === agentId && a.window_id === w.id && a.assignment_level === level);
          return <div key={w.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div><p className="font-medium">{w.name}</p>{w.title && <p className="text-sm text-muted-foreground">{w.title}</p>}</div>
            <Button disabled={busy} variant={assigned ? "outline" : "default"} onClick={() => void change(w.id, assigned)}>{assigned ? "Remove" : "Assign"}</Button>
          </div>;
        })}</div>}
    </CardContent></Card>
  </div>;
}

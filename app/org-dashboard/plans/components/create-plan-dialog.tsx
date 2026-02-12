"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Target, FolderOpen, Calendar, ActivityIcon, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Types
interface Project { id: string; name: string; startDate?: string; endDate?: string }
interface Activity { id: string; name: string; startDate: string; endDate: string; unitOfMeasure?: string; targetUnit?: number }
interface InterventionArea { 
  id: string; 
  villageName?: { id: string; name: string }; 
  gramPanchayat?: { id: string; name: string }; 
  blockName?: { id: string; name: string }; 
  district?: { id: string; name: string }; 
  state?: { id: string; name: string }; 
}
interface PlanYear { label: string; start: Date; end: Date }
interface ActivityPlan { activityId: string; unitOfMeasure: string; activityTarget: number; months: string[]; monthlyTargets: Record<string, number>; interventionAreaId?: string }

// Helpers
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart <= bEnd && bStart <= aEnd
}
function clampRangeToIntersection(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  const start = aStart > bStart ? aStart : bStart
  const end = aEnd < bEnd ? aEnd : bEnd
  return start <= end ? { start, end } : null
}
function monthsBetween(start: Date, end: Date) {
  const out: string[] = []
  const d = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  while (d <= endMonth) {
    out.push(format(d, "yyyy-MM"))
    d.setMonth(d.getMonth() + 1)
  }
  return out
}
function fyStartYearForDate(d: Date) { return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1 }
function fyRangeForStartYear(startYear: number): PlanYear {
  const start = new Date(startYear, 3, 1)
  const end = new Date(startYear + 1, 2, 31, 23, 59, 59, 999)
  return { start, end, label: `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}` }
}
function fyForDate(d: Date) { return fyRangeForStartYear(fyStartYearForDate(d)) }
function fyListBetween(projectStart: Date, projectEnd: Date) {
  const out: PlanYear[] = []
  for (let y = fyStartYearForDate(projectStart); y <= fyStartYearForDate(projectEnd); y++) {
    const fy = fyRangeForStartYear(y)
    if (overlaps(fy.start, fy.end, projectStart, projectEnd)) out.push(fy)
  }
  return out
}
function dateFromMonthKey(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number)
  if (!y || !m) return null
  return new Date(y, m - 1, 1)
}

// Form schema
const formSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  planYearStart: z.string().min(1, "Plan year required"),
  planYearEnd: z.string().min(1, "Plan year required"),
})

// Component
export function CreatePlanDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; onSuccess?: () => void }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [interventionAreas, setInterventionAreas] = useState<InterventionArea[]>([])
  const [planYear, setPlanYear] = useState<PlanYear | null>(null)
  const [availablePlanYears, setAvailablePlanYears] = useState<PlanYear[]>([])
  const [activityPlans, setActivityPlans] = useState<ActivityPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [showPlanYearDialog, setShowPlanYearDialog] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { projectId: "", planYearStart: "", planYearEnd: "" } })
  const watchedValues = form.watch()
  const selectedProject = projects.find(p => p.id === watchedValues.projectId) || null

  const filteredActivities = useMemo(() => {
    if (!planYear) return []
    return activities.filter(a => overlaps(new Date(a.startDate), new Date(a.endDate), planYear.start, planYear.end))
  }, [activities, planYear])

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => {
    if (!watchedValues.projectId) {
      setActivities([]); setInterventionAreas([]); setPlanYear(null); setAvailablePlanYears([]); setActivityPlans([])
      form.reset({ projectId: "", planYearStart: "", planYearEnd: "" })
      return
    }
    fetchActivities(watchedValues.projectId)
    fetchInterventionAreas(watchedValues.projectId)
    const proj = projects.find(p => p.id === watchedValues.projectId)
    if (proj?.startDate && proj?.endDate) setAvailablePlanYears(fyListBetween(new Date(proj.startDate), new Date(proj.endDate)))
    setPlanYear(null)
    form.setValue("planYearStart", ""); form.setValue("planYearEnd", "")
    setActivityPlans([])
  }, [watchedValues.projectId, projects])

  const addActivityToPlan = (activity: Activity) => {
    if (!planYear) return

    const intersection = clampRangeToIntersection(
      new Date(activity.startDate),
      new Date(activity.endDate),
      planYear.start,
      planYear.end
    )
    if (!intersection) return toast.error("Activity does not overlap with selected plan year")

    const monthList = monthsBetween(intersection.start, intersection.end)
    const newPlan: ActivityPlan = {
      activityId: activity.id,
      unitOfMeasure: activity.unitOfMeasure || "",
      activityTarget: activity.targetUnit || 0,
      months: monthList,
      monthlyTargets: Object.fromEntries(monthList.map((m) => [m, 0])),
      interventionAreaId: "",
    }

    setActivityPlans((prev) => [...prev, newPlan])
  }

  // Set Plan Year
  const handleSelectPlanYear = (py: PlanYear | null) => {
    setPlanYear(py)
    if (py) {
      form.setValue("planYearStart", py.start.toISOString())
      form.setValue("planYearEnd", py.end.toISOString())
    } else {
      form.setValue("planYearStart", "")
      form.setValue("planYearEnd", "")
    }

    setActivityPlans([])
  }

  // Quick Current FY
  const handleQuickCurrentFY = () => {
    const py = fyForDate(new Date())
    handleSelectPlanYear(py)
  }

  const onSubmit = async () => {
    try {
      if (!planYear) throw new Error("Plan year not selected")
      if (activityPlans.length === 0) throw new Error("No activities added")
      if (activityPlans.some(p => !p.interventionAreaId)) throw new Error("All activities must have an intervention area")

      setLoading(true)
      const payload = activityPlans.map(plan => ({
        activityId: plan.activityId,
        unitOfMeasure: plan.unitOfMeasure,
        activityTarget: plan.activityTarget,
        monthlyTargets: plan.monthlyTargets,
        planYearStart: planYear.start.toISOString(),
        planYearEnd: planYear.end.toISOString(),
        projectId: watchedValues.projectId,
        interventionAreaId: plan.interventionAreaId,
      }))
      const res = await fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error("Failed to create plans")
      toast.success("Plans created successfully")
      onSuccess?.(); onOpenChange(false)
      setActivityPlans([]); setPlanYear(null); form.reset()
    } catch (error) { toast.error((error as Error).message || "Failed") } finally { setLoading(false) }
  }

  async function fetchProjects() { try { const res = await fetch("/api/projects"); if (!res.ok) throw new Error(); setProjects(await res.json()) } catch { toast.error("Failed to fetch projects") } }
  async function fetchActivities(projectId: string) { try { const res = await fetch(`/api/projects/${projectId}/activities`); if (!res.ok) throw new Error(); setActivities(await res.json()) } catch { toast.error("Failed to fetch activities") } }
  async function fetchInterventionAreas(projectId: string) { try { const res = await fetch(`/api/projects/${projectId}/intervention-areas`); if (!res.ok) throw new Error(); setInterventionAreas(await res.json()) } catch { toast.error("Failed to fetch areas") } }
console.log(interventionAreas)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Create Activity Plan</DialogTitle>
          <DialogDescription>Select project → FY → activities → fill monthly targets → assign area</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Project & Plan Year */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FolderOpen className="h-4 w-4" /> Project & Year Plan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <FormField control={form.control} name="projectId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                    }} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger></FormControl>
                      <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name || 'Unnamed Project'}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {selectedProject && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleQuickCurrentFY} className="flex gap-2"><Calendar className="h-3 w-3" /> {" "}Current FY</Button>
                    {/* <Button variant="outline" size="sm" onClick={() => setShowPlanYearDialog(true)} disabled={availablePlanYears.length === 0}>Pick FY</Button> */}
                    {planYear && <Badge variant="secondary" className="flex items-center gap-1"><Calendar className="h-3 w-3" />{planYear.label}<Button variant="ghost" size="sm" onClick={() => handleSelectPlanYear(null)}><X className="h-3 w-3" /></Button></Badge>}
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Add Activities */}
            {selectedProject && planYear && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ActivityIcon className="h-4 w-4" /> Add Activities</CardTitle></CardHeader>
                <CardContent>
                  <Select onValueChange={id => { const act = activities.find(a => a.id === id); if (act) addActivityToPlan(act) }} value="">
                    <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                    <SelectContent>{filteredActivities.filter(a => !activityPlans.some(p => p.activityId === a.id)).map(a => <SelectItem key={a.id} value={a.id}>{a.name || 'Unnamed Activity'}</SelectItem>)}</SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Activity Plans */}
            {activityPlans.map((plan, idx) => {
              const activity = activities.find(a => a.id === plan.activityId)
              if (!activity) return null
              const total = Object.values(plan.monthlyTargets).reduce((a, b) => a + (b || 0), 0)
              return (
                <Card key={plan.activityId}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4" /> {activity.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActivityPlans(prev => prev.filter(p => p.activityId !== plan.activityId))
                      }
                    >
                      Remove
                      <X className="h-3 w-3 ml-1" />
                    </Button>
                  </CardHeader>

                  <CardContent className="overflow-x-auto">
                    <table className="table-auto border-collapse border border-muted-foreground text-sm min-w-xl">
                      <thead>
                        <tr className="bg-muted/50">
                        <th className="border px-1 py-1 w-16">Unit</th>
                          {plan.months.map(m => (
                            <th key={m} className="border px-1 py-1 w-14">{format(dateFromMonthKey(m)!, "MMM yy")}</th>
                          ))}
                          <th className="border px-1 py-1 min-w-[200px]">Intervention Area</th>
                          <th className="border px-1 py-1 w-16">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                           <td className="border px-1 py-1 text-center">{plan.unitOfMeasure}</td>
                          {plan.months.map(m => (
                            <td key={m} className="border px-1 py-1">
                              <Input
                                type="number"
                                min={0}
                                value={plan.monthlyTargets[m]}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setActivityPlans(prev =>
                                    prev.map((p, i) => (i === idx ? { ...p, monthlyTargets: { ...p.monthlyTargets, [m]: val } } : p))
                                  );
                                }}
                                className="w-16 text-right"
                              />
                            </td>
                          ))}
                         
                          <td className="border px-1 py-1 min-w-[200px]">
                            <Select
                              value={plan.interventionAreaId || ""}
                              onValueChange={v =>
                                setActivityPlans(prev => prev.map((p, i) => (i === idx ? { ...p, interventionAreaId: v } : p)))
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="w-72">
                                  <SelectValue placeholder="Select area" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {interventionAreas.map(a => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {[
                                      a.villageName?.name,
                                      a.gramPanchayat?.name, 
                                      a.blockName?.name, 
                                      a.district?.name, 
                                      a.state?.name
                                    ].filter(Boolean).join(', ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className={`border px-1 py-1 font-medium ${total > plan.activityTarget ? "text-destructive" : ""}`}>
                            {total}/{plan.activityTarget}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                  </CardContent>
                </Card>
              )
            })}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !watchedValues.projectId ||
                  !planYear
                }
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Plan
              </Button>
            </div>
          </form>
        </Form>


      </DialogContent>
    </Dialog>
  )
}

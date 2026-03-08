"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  IconCircleCheckFilled,
  IconLoader,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/lib/supabase-client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const judgesSchema = z.object({
  id: z.number(),
  entry: z.string(),
  status: z.string(),
  investment: z.string(),
  judge: z.string(),
  time: z.string().optional(),
  room: z.string().optional(),
  startTimeSort: z.number().optional(),
  submissionId: z.string().optional(),
})

type JudgesTableProps = {
  data: (z.infer<typeof judgesSchema> & { time?: string; room?: string; startTimeSort?: number; submissionId?: string })[]
  onInvestmentChange: (entryId: number, investment: number) => Promise<void>
  remainingAllocation: number
  totalInvested: number
  onOpenNotes?: (submissionId: string) => void
}

type JudgeRow = z.infer<typeof judgesSchema> & { time?: string; room?: string; startTimeSort?: number; submissionId?: string }

function ProjectNameCell({ row }: { row: { original: JudgeRow } }) {
  const submissionId = row.original.submissionId
  const [open, setOpen] = React.useState(false)
  const [details, setDetails] = React.useState<{
    team_name: string
    members: string[]
    tracks: string[]
    devpost_link: string
  } | null>(null)
  const [loading, setLoading] = React.useState(false)

  const loadDetails = async () => {
    if (details || !submissionId) return
    setLoading(true)
    const { data } = await supabase
      .from("test_submissions")
      .select("submitter_name, members, tracks, devpost_link")
      .eq("id", submissionId)
      .single()
    if (data) setDetails({
      team_name: (data as any).submitter_name ?? "",
      members: (data as any).members ?? [],
      tracks: (data as any).tracks ?? [],
      devpost_link: (data as any).devpost_link ?? "",
    })
    setLoading(false)
  }

  if (!submissionId) {
    return <div className="font-medium">{row.original.entry}</div>
  }

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) loadDetails()
    }}>
      <PopoverTrigger asChild>
        <button className="font-medium text-primary hover:underline text-left">
          {row.original.entry}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {loading ? (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        ) : details ? (
          <div className="grid gap-4">
            <div className="space-y-1">
              <h4 className="font-medium leading-none">{row.original.entry}</h4>
              <p className="text-sm text-muted-foreground">Team: {details.team_name}</p>
            </div>
            <div className="grid gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Members</p>
                <div className="flex flex-wrap gap-1">
                  {details.members?.length > 0 ? (
                    details.members.map((m, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Tracks</p>
                <div className="flex flex-wrap gap-1">
                  {details.tracks?.length > 0 ? (
                    details.tracks.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="text-xs">General</Badge>
                  )}
                </div>
              </div>
              {details.devpost_link && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Devpost</p>
                  <a
                    href={details.devpost_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View on Devpost
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Could not load details.</p>
        )}
      </PopoverContent>
    </Popover>
  )
}

function InvestmentCell({
  row,
  onInvestmentChange,
  remainingAllocation,
}: {
  row: { original: JudgeRow }
  onInvestmentChange: (entryId: number, investment: number) => Promise<void>
  remainingAllocation: number
}) {
  const entry = row.original
  const investment = entry.investment
  const [inputValue, setInputValue] = React.useState(investment || "")
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    setInputValue(investment || "")
  }, [investment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numValue = parseFloat(inputValue)
    if (isNaN(numValue) || numValue < 0) {
      toast.error("Invalid points", {
        description: "Please enter a valid positive number",
      })
      return
    }
    const currentInvestment = parseFloat(entry.investment || "0")
    const difference = numValue - currentInvestment
    if (remainingAllocation - difference < 0) {
      toast.error("Insufficient points", {
        description: `You have ${remainingAllocation.toFixed(2)} points remaining. Please adjust your points.`,
      })
      return
    }
    setIsSaving(true)
    try {
      await onInvestmentChange(entry.id, numValue)
    } catch (err) {
      toast.error("Failed to save points", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Label htmlFor={`${entry.id}-investment`} className="sr-only">
        Points
      </Label>
      <div className="flex items-center justify-end gap-1">
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-24 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          placeholder="0"
          type="number"
          step="1"
          min="0"
          id={`${entry.id}-investment`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSaving}
        />
        {inputValue !== investment && (
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            disabled={isSaving}
          >
            {isSaving ? "..." : "✓"}
          </Button>
        )}
      </div>
    </form>
  )
}

const createColumns = (
  onInvestmentChange: (entryId: number, investment: number) => Promise<void>,
  remainingAllocation: number,
  _onOpenNotes?: (submissionId: string) => void
): ColumnDef<JudgeRow>[] => [
  {
    accessorKey: "entry",
    header: "Project Name",
    cell: ({ row }) => <ProjectNameCell row={row} />,
    enableHiding: false,
  },
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.time || "Not scheduled"}
      </div>
    ),
  },
  {
    accessorKey: "room",
    header: "Room",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.room || "-"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Scored" ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : row.original.status === "Under Review" ? (
          <IconLoader />
        ) : null}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "investment",
    header: () => <div className="w-full text-right">Points</div>,
    cell: ({ row }) => (
      <InvestmentCell
        row={row}
        onInvestmentChange={onInvestmentChange}
        remainingAllocation={remainingAllocation}
      />
    ),
  },
]

export function JudgesDataTable({
  data: initialData,
  onInvestmentChange,
  remainingAllocation,
  totalInvested,
  onOpenNotes,
}: JudgesTableProps) {
  const [data, setData] = React.useState(() => initialData)
  const isMobile = useIsMobile()
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Keep the table in sync with refreshed judge assignments.
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const columns = React.useMemo(
    () => createColumns(onInvestmentChange, remainingAllocation, onOpenNotes),
    [onInvestmentChange, remainingAllocation, onOpenNotes]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnVisibilityChange: setColumnVisibility,
  })

  return (
    <div className="space-y-4">
      {/* Investment Summary */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Total Points Used</p>
            <p className="text-2xl font-bold"><NumberTicker value={totalInvested} /></p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Points Remaining</p>
            <p className={`text-2xl font-bold ${remainingAllocation < 0 ? "text-destructive" : ""}`}>
              <NumberTicker value={remainingAllocation} decimalPlaces={2} />
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Assigned Submissions</p>
            <p className="text-2xl font-bold"><NumberTicker value={data.length} /></p>
          </div>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <div key={row.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Project
                    </p>
                    <ProjectNameCell row={row} />
                  </div>
                  <div className="w-[140px] shrink-0">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                      Points
                    </p>
                    <InvestmentCell
                      row={row}
                      onInvestmentChange={onInvestmentChange}
                      remainingAllocation={remainingAllocation}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
              No submissions assigned.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No submissions assigned.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="px-2 text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} submission(s)
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
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
  IconNotes,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberTicker } from "@/components/ui/number-ticker"
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

const createColumns = (
  onInvestmentChange: (entryId: number, investment: number) => Promise<void>,
  remainingAllocation: number
): ColumnDef<z.infer<typeof judgesSchema> & { time?: string; room?: string; startTimeSort?: number; submissionId?: string }>[] => [
  {
    accessorKey: "entry",
    header: "Project Name",
    cell: ({ row }) => {
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
          .from("submissions")
          .select("team_name, members, tracks, devpost_link")
          .eq("id", submissionId)
          .single()
        if (data) setDetails(data)
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
              <p className="text-sm text-muted-foreground">Loading...</p>
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
    },
    enableHiding: false,
  },
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => {
      const time = (row.original as any).time
      return (
        <div className="text-sm text-muted-foreground">
          {time || "Not scheduled"}
        </div>
      )
    },
  },
  {
    accessorKey: "room",
    header: "Room",
    cell: ({ row }) => {
      const room = (row.original as any).room
      return (
        <div className="text-sm text-muted-foreground">
          {room || "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Invested" ? (
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
    header: () => <div className="w-full text-right">Investment</div>,
    cell: ({ row }) => {
      const entry = row.original
      const investment = entry.investment
      const [inputValue, setInputValue] = React.useState(investment || "")
      const [isSaving, setIsSaving] = React.useState(false)
      
      // Update input value when investment changes externally
      React.useEffect(() => {
        setInputValue(investment || "")
      }, [investment])
      
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const numValue = parseFloat(inputValue)
        if (isNaN(numValue) || numValue < 0) {
          toast.error("Invalid amount", {
            description: "Please enter a valid positive number",
          })
          return
        }
        
        // Check if exceeds remaining allocation
        const currentInvestment = parseFloat(entry.investment || "0")
        const difference = numValue - currentInvestment
        if (remainingAllocation - difference < 0) {
          toast.error("Insufficient funds", {
            description: `You have $${remainingAllocation.toFixed(2)} remaining. Please adjust your investment.`,
          })
          return
        }
        
        setIsSaving(true)
        try {
          await onInvestmentChange(entry.id, numValue)
          // Don't show success toast here - let the parent component handle it
        } catch (error) {
          toast.error("Failed to save investment", {
            description: error instanceof Error ? error.message : "Unknown error",
          })
        } finally {
          setIsSaving(false)
        }
      }
      
      return (
        <form onSubmit={handleSubmit}>
          <Label htmlFor={`${entry.id}-investment`} className="sr-only">
            Investment
          </Label>
          <div className="flex items-center justify-end gap-1">
            <span className="text-muted-foreground text-sm">$</span>
            <Input
              className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-24 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
              placeholder="0"
              type="number"
              step="10"
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
    },
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
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  
  // Track current page index to preserve it during updates
  const preservedPageIndexRef = React.useRef(pagination.pageIndex)

  // Update data when initialData changes, preserving pagination state
  React.useEffect(() => {
    // Check if this is just an update (same length, same submission IDs)
    const isDataUpdate = initialData.length === data.length && 
      initialData.every((newEntry) => {
        const oldEntry = data.find(e => (e as any).submissionId === (newEntry as any).submissionId)
        return oldEntry !== undefined
      })
    
    // If it's just a data update (not a full reload), preserve the current page
    if (isDataUpdate && preservedPageIndexRef.current > 0) {
      // Restore the preserved page index
      setPagination(prev => ({ 
        ...prev, 
        pageIndex: preservedPageIndexRef.current 
      }))
    }
    
    setData(initialData)
  }, [initialData, data])

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
      pagination,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const newPagination = typeof updater === 'function' ? updater(prev) : updater
        // Preserve the page index for future updates
        preservedPageIndexRef.current = newPagination.pageIndex
        return newPagination
      })
    },
  })

  return (
    <div className="space-y-4">
      {/* Investment Summary */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <p className="text-2xl font-bold">$<NumberTicker value={totalInvested} /></p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-2xl font-bold ${remainingAllocation < 0 ? "text-destructive" : ""}`}>
              $<NumberTicker value={remainingAllocation} decimalPlaces={2} />
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Assigned Submissions</p>
            <p className="text-2xl font-bold"><NumberTicker value={data.length} /></p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} submission(s)
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
              className="h-8 w-[70px] rounded-md border border-input bg-background"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              «
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              ‹
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              ›
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              »
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Fragment } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  PaginationState,
  getPaginationRowModel,
  ExpandedState,
} from "@tanstack/react-table"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Category } from "@/services/category-service"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  pageCount?: number
  onEdit?: (item: TData) => void
  onDelete?: (item: TData) => void
  getChildren?: (item: TData) => TData[]
  onRowClick?: (item: TData) => void
}

function getChildContext<TData>(child: TData, col: any): any {
  return {
    row: {
      original: child,
      getIsExpanded: () => false,
      toggleExpanded: () => {},
      getValue: (key: string) => (child as any)[key] ?? '',
      getCanExpand: () => false,
    } as any,
    column: { id: col.id } as any,
  } as any
}

export function DataTable<TData = Category, TValue = any>({
  columns,
  data,
  pageSize = 50,
  pageCount = 0,
  onDelete,
  getChildren,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  })
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination,
      expanded,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    onExpandedChange: setExpanded,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  })

return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-4 text-left align-middle font-medium"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const children = getChildren ? getChildren(row.original) : []
                  const hasChildren = children.length > 0
                  const isExpanded = row.getIsExpanded()

return (
                   <Fragment key={row.id}>
                     <tr
                       className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                       onClick={() => onRowClick?.(row.original)}
                     >
                       {row.getVisibleCells().map((cell) => (
                         <td key={cell.id} className="p-4 align-middle">
                           {flexRender(
                             cell.column.columnDef.cell,
                             cell.getContext()
                           )}
                         </td>
                       ))}
                     </tr>
{hasChildren && isExpanded && (
                       <Fragment key={`children-${row.id}`}>
                         {children.map((child: any, index) => (
                           <tr key={`child-${row.id}-${child?.id ?? child?.name ?? index}`} className="border-b bg-muted/20">
                             {columns.map((col, colIndex) => (
                               <td key={`${row.id}-${col.id}-${colIndex}`} className="p-4 align-middle" style={{ paddingLeft: col.id === 'name' ? '48px' : undefined }}>
                                 {flexRender(
                                   col.cell as any,
                                   getChildContext(child, col)
                                 )}
                               </td>
                             ))}
                           </tr>
                         ))}
                       </Fragment>
                     )}
                  </Fragment>
                )
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-muted-foreground">No results found</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.pageIndex + 1} of {pageCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
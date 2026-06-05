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
  ExpandedState,
} from "@tanstack/react-table"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Category } from "@/services/category-service"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  pageCount?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  onDelete?: (item: TData) => void
  getChildren?: (item: TData) => TData[]
  onRowClick?: (item: TData) => void
}

function getChildContext<TData>(child: TData, col: any): any {
  const colId = col?.id ?? 'unknown'
  return {
    row: {
      original: child,
      getIsExpanded: () => false,
      toggleExpanded: () => {},
      getValue: (key: string) => (child as any)[key] ?? '',
      getCanExpand: () => false,
    } as any,
    column: { id: colId } as any,
  } as any
}

export function DataTable<TData = Category, TValue = any>({
   columns,
   data,
   pageSize = 10,
   pageCount = 0,
   currentPage = 0,
   onPageChange,
   onDelete,
   getChildren,
   onRowClick,
 }: DataTableProps<TData, TValue>) {
   const [sorting, setSorting] = useState<SortingState>([])
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
   const [expanded, setExpanded] = useState<Record<string, boolean>>({})
   const [loadingPage, setLoadingPage] = useState<number | null>(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
      columnFilters,
      expanded: expanded as ExpandedState,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onExpandedChange: (updater) => {
      const newExpanded = typeof updater === 'function' ? updater(expanded as ExpandedState) : updater
      if (typeof newExpanded === 'object' && newExpanded !== null && !Array.isArray(newExpanded)) {
        setExpanded(newExpanded as Record<string, boolean>)
      }
    },
  })

  const totalPages = pageCount || 1

return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[640px] sm:min-w-0">
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
              {data?.length ? (
                data.map((item: any, index: number) => {
                  const children = getChildren ? getChildren(item) : []
                  const hasChildren = children.length > 0
                  const rowId = item?.id != null ? String(item.id) : `row-${index}`
                  
                  const toggleExpanded = () => {
                    setExpanded(prev => ({
                      ...prev,
                      [rowId]: !prev?.[rowId]
                    }))
                  }
                  
                  return (
                    <Fragment key={`row-${rowId}`}>
                      <tr
                        className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={() => onRowClick?.(item)}
                      >
                        {columns.map((col, colIndex) => {
                          const colKey = col.id ?? `col-${colIndex}`
                          return (
                            <td key={`${rowId}-${colKey}`} className="p-4 align-middle">
                              {flexRender(
                                col.cell,
                                {
                                  row: {
                                    original: item,
                                    getIsExpanded: () => !!expanded?.[rowId],
                                    toggleExpanded,
                                    getValue: (key: string) => item?.[key] ?? '',
                                    getCanExpand: () => hasChildren,
                                  } as any,
                                  column: { id: col.id } as any,
                                } as any
                              )}
                            </td>
                          )
                        })}
                      </tr>
                      {hasChildren && expanded?.[rowId] && (
                        <Fragment key={`children-${rowId}`}>
                          {children.map((child: any, childIndex: number) => {
                            const childKey = child?.id != null ? String(child.id) : `${rowId}-child-${childIndex}`
                            return (
                              <tr key={`child-${rowId}-${childKey}`} className="border-b bg-muted/20">
                                {columns.map((col, colIndex) => {
                                  const colKey = col?.id ?? `col-${colIndex}`
                                  return (
                                    <td key={`${rowId}-${childKey}-${colKey}-${colIndex}`} className="p-4 align-middle" style={{ paddingLeft: colKey === 'name' ? '48px' : undefined }}>
                                      {flexRender(
                                        col.cell as any,
                                        getChildContext(child, col)
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
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
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(0)}
              disabled={currentPage === 0}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 0}
              className="h-7 sm:h-8 px-2"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Prev</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange?.(page - 1)}
                  disabled={loadingPage === page}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  {loadingPage === page ? "..." : page}
                </Button>
              ))}
              {totalPages > 5 && (
                <span className="text-xs text-muted-foreground">...</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="h-7 sm:h-8 px-2"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
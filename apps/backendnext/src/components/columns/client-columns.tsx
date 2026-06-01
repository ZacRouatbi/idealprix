"use client"

import { ColumnDef } from "@tanstack/react-table"

export interface Client {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: string
  is_active: boolean
  created_at: string
  last_login?: string
}

export const clientColumns: ColumnDef<Client>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("email")}</div>
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <span className="capitalize">{role}</span>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
]
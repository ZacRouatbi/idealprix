"use client"

import React, { useEffect, useActionState } from "react";

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { useAuth } from "@lib/context/AuthContext"
import { updateCustomer } from "@lib/data/backend-api"

type MyInformationProps = {
  customer: any
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  const { customer: authCustomer } = useAuth()
  const [successState, setSuccessState] = React.useState(false)

const updateCustomerEmail = async (
    _currentState: Record<string, unknown>,
    formData: FormData
  ) => {
    try {
      await updateCustomer({
        email: formData.get("email") as string,
        first_name: authCustomer?.first_name || customer.first_name || "",
        last_name: authCustomer?.last_name || customer.last_name || "",
      })
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
  }

  const [state, formAction] = useActionState(updateCustomerEmail, {
    error: null as string | null,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} className="w-full">
      <AccountInfo
        label="Email"
        currentInfo={`${customer.email || authCustomer?.email || ""}`}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error || undefined}
        clearState={clearState}
        data-testid="account-email-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={customer.email || authCustomer?.email || ""}
            data-testid="email-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileEmail
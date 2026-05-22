import { useState } from "react"
import { User, Package, Mail, MapPin, Phone, Save } from "lucide-react"
import { useAuth } from "@lib/context/AuthContext"
import OrdersList, { BackendOrder } from "@modules/account/components/OrderCard"
import { updateCustomer } from "@lib/data/backend-api"

interface AccountTemplateProps {
  customer?: {
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    phone?: string | null
  } | null
  orders?: BackendOrder[]
}

export default function AccountTemplate({ customer, orders = [] }: AccountTemplateProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token, setCustomer } = useAuth()

  const [formData, setFormData] = useState({
    first_name: customer?.first_name || "",
    last_name: customer?.last_name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
  })

  const userInfo = customer
    ? {
        firstName: customer.first_name || "",
        lastName: customer.last_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: "",
      }
    : {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
      }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3000/api"}/auth`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      )

      if (res.ok) {
        const data = await res.json()
        setCustomer(data.user)
        setIsEditing(false)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.message || "Échec de la mise à jour")
      }
    } catch {
      setError("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon compte</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <User className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-lg text-gray-900">Informations personnelles</h2>
            </div>

            {!isEditing ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {userInfo.firstName} {userInfo.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Client fidèle</p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="w-4 h-4 text-red-600/70" />
                    {userInfo.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4 text-red-600/70" />
                    {userInfo.phone || "Non renseigné"}
                  </div>
                  {userInfo.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-red-600/70 mt-0.5" />
                      {userInfo.address}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gray-100 text-gray-900 font-medium py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Modifier mes informations
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Prénom</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Nom</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="flex-1 border border-gray-300 text-gray-900 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <Package className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-lg text-gray-900">Mes commandes</h2>
            </div>

            <div className="p-6">
              <OrdersList orders={orders} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
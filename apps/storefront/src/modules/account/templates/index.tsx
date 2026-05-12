import { useState } from "react";
import { User, Package, Mail, MapPin, Phone, Save } from "lucide-react";
import { HttpTypes } from "@medusajs/types";
import { useAuth } from "@lib/context/AuthContext";

interface AccountTemplateProps {
  customer?: HttpTypes.StoreCustomer | null;
  orders?: HttpTypes.StoreOrder[] | null;
}

export default function AccountTemplate({ customer, orders }: AccountTemplateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, setCustomer } = useAuth();

  const PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "";

  const [formData, setFormData] = useState({
    first_name: customer?.first_name || "",
    last_name: customer?.last_name || "",
    phone: customer?.phone || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/store/customers/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        setIsEditing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Échec de la mise à jour");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const userInfo = customer
    ? {
        firstName: customer.first_name || "",
        lastName: customer.last_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.addresses?.find((a) => a.is_default_billing)?.city || "",
      }
    : {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
      };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-800";
    if (status === "pending") return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: currency?.toUpperCase() || "TND",
    }).format(amount / 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Mon compte
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ===== SECTION 1 : INFORMATIONS PERSONNELLES ===== */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <User className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-lg text-gray-900">
                Informations personnelles
              </h2>
            </div>

            {/* Content */}
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
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

        {/* ===== SECTION 2 : MES COMMANDES ===== */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <Package className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-lg text-gray-900">
                Mes commandes
              </h2>
            </div>

            {!orders || orders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Vous n'avez pas encore passé de commande.</p>
                <a
                  href="/products"
                  className="text-red-600 font-medium hover:underline mt-2 inline-block"
                >
                  Découvrir nos produits
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">
                        Commande
                      </th>
                      <th className="px-6 py-3 text-left font-medium">Date</th>
                      <th className="px-6 py-3 text-left font-medium">
                        Articles
                      </th>
                      <th className="px-6 py-3 text-left font-medium">Total</th>
                      <th className="px-6 py-3 text-left font-medium">Statut</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          #{order.display_id}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(order.created_at as string)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {order.items?.length || 0}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {formatCurrency(order.total, order.currency_code)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`/account/orders/details/${order.id}`}
                            className="text-red-600 hover:underline text-sm font-medium"
                          >
                            Détails
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
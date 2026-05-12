import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@lib/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "";

  const { token, setToken, setCustomer } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/auth/customer/emailpass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        onAuthSuccess?.();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Échec de la connexion");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const [firstName, ...lastNameParts] = name.split(" ");
      const lastName = lastNameParts.join(" ") || firstName;

      // Step 1: Get registration JWT token
      const tokenRes = await fetch("/auth/customer/emailpass/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}));
        throw new Error(data.message || "Registration failed");
      }

      const tokenData = await tokenRes.json();
      const registrationToken = tokenData.token;

      // Step 2: Register customer with the token
      const res = await fetch("/store/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
          "Authorization": `Bearer ${registrationToken}`,
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (res.ok) {
        // Step 3: Auto-login after successful registration
        const loginRes = await fetch("/auth/customer/emailpass", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": PUBLISHABLE_KEY,
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          setToken(loginData.token);
        }
        onAuthSuccess?.();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Échec de la création du compte");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "login", label: "Connexion" },
    { id: "register", label: "Inscription" },
    { id: "reset", label: "Mot de passe" },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case "login":
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                Connexion
              </h2>
              <p className="text-sm text-[#717182] mt-1">Connectez-vous à votre compte</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                placeholder="exemple@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4302A] text-white py-2.5 rounded-lg font-medium hover:bg-[#b82a22] transition-colors disabled:opacity-50"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </motion.button>
          </form>
        );

      case "register":
        return (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                Créer un compte
              </h2>
              <p className="text-sm text-[#717182] mt-1">Rejoignez IdealPrix aujourd'hui</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] mb-1">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                placeholder="exemple@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4302A] text-white py-2.5 rounded-lg font-medium hover:bg-[#b82a22] transition-colors disabled:opacity-50"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {loading ? "Création..." : "Créer le compte"}
            </motion.button>
          </form>
        );

      case "reset":
        return (
          <form className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                Mot de passe oublié
              </h2>
              <p className="text-sm text-[#717182] mt-1">Réinitialisez votre mot de passe</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                placeholder="exemple@email.com"
                required
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4302A] text-white py-2.5 rounded-lg font-medium hover:bg-[#b82a22] transition-colors disabled:opacity-50"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </motion.button>
          </form>
        );
    }
  };

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-0 m-auto z-[110] h-fit w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-5">
          <h3 className="text-sm font-semibold text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
            {activeTab === "login" && "Connexion"}
            {activeTab === "register" && "Créer un compte"}
            {activeTab === "reset" && "Réinitialiser le mot de passe"}
          </h3>
        </div>

        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-white text-[#1E1E1E] shadow-sm"
                    : "text-gray-600 hover:text-[#1E1E1E]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 text-center text-sm">
          {activeTab === "login" && (
            <>
              <button onClick={() => setActiveTab("reset")} className="text-[#D4302A] hover:underline mr-4">
                Mot de passe oublié ?
              </button>
              <button onClick={() => setActiveTab("register")} className="text-[#D4302A] hover:underline">
                Pas de compte ? S'inscrire
              </button>
            </>
          )}
          {activeTab === "register" && (
            <button onClick={() => setActiveTab("login")} className="text-[#D4302A] hover:underline">
              Déjà un compte ? Se connecter
            </button>
          )}
          {activeTab === "reset" && (
            <button onClick={() => setActiveTab("login")} className="text-[#D4302A] hover:underline">
              Retour à la connexion
            </button>
          )}
        </div>
      </motion.div>
    </>,
    document.body
  );
}
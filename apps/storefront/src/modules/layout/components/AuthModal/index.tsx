import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { z } from "zod";
import { useAuth } from "@lib/context/AuthContext";
import { login, register } from "@lib/data/backend-api";
import { loginSchema, registerSchema } from "@lib/schemas/auth-schemas";

const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters');

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "reset">("login");
  const [formData, setFormData] = useState<LoginFormData & { name: string }>({
    email: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { setToken, setCustomer } = useAuth();

  if (!isOpen) return null;

  const validateField = (field: string, value: string | undefined): string | null => {
    try {
      const val = value ?? ""
      if (activeTab === "login") {
        if (field === "email") {
          loginSchema.shape.email.parse(val);
        } else if (field === "password") {
          loginSchema.shape.password.parse(val);
        }
      } else if (activeTab === "register") {
        if (field === "email") {
          registerSchema.shape.email.parse(val);
        } else if (field === "password") {
          registerSchema.shape.password.parse(val);
        } else if (field === "name") {
          if (val.length > 0) {
            nameSchema.parse(val);
          }
        }
      }
      return null;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return err.issues[0].message;
      }
      return "Validation error";
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const fieldError = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: fieldError || "" }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validation = loginSchema.safeParse({
      email: formData.email,
      password: formData.password,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err: z.ZodIssue) => {
        errors[err.path[0] as string] = err.message;
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const { user, token } = await login(formData.email, formData.password);
      setToken(token);
      setCustomer(user);
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Name validation - required field
    if (!formData.name || formData.name.length === 0) {
      setFieldErrors({ name: 'Name is required' });
      setLoading(false);
      return;
    }
    const nameValidation = nameSchema.safeParse(formData.name);
    if (!nameValidation.success) {
      setFieldErrors({ name: nameValidation.error.issues[0].message });
      setLoading(false);
      return;
    }

    const [firstName, ...lastNameParts] = formData.name.split(" ");
    const lastName = lastNameParts.join(" ") || firstName;

    const validation = registerSchema.safeParse({
      email: formData.email,
      password: formData.password,
      first_name: firstName,
      last_name: lastName,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err: z.ZodIssue) => {
        errors[err.path[0] as string] = err.message;
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

try {
       const { user, token } = await register({
         email: formData.email,
         password: formData.password,
         first_name: firstName,
         last_name: lastName,
       });
      setToken(token);
      setCustomer(user);
      onAuthSuccess?.();
      onClose();
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
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-gray-50 ${
                  fieldErrors.email ? "border-red-500" : "border-gray-300 focus:border-[#D4302A]"
                }`}
                placeholder="exemple@email.com"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] mb-1">Mot de passe</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-gray-50 ${
                  fieldErrors.password ? "border-red-500" : "border-gray-300 focus:border-[#D4302A]"
                }`}
                placeholder="••••••••"
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
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
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-gray-50 ${
                  fieldErrors.name ? "border-red-500" : "border-gray-300 focus:border-[#D4302A]"
                }`}
                placeholder="Jean Dupont"
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-gray-50 ${
                  fieldErrors.email ? "border-red-500" : "border-gray-300 focus:border-[#D4302A]"
                }`}
                placeholder="exemple@email.com"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1E1E1E] mb-1">Mot de passe</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none bg-gray-50 ${
                  fieldErrors.password ? "border-red-500" : "border-gray-300 focus:border-[#D4302A]"
                }`}
                placeholder="••••••••"
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
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
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
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
        className="fixed inset-0 z-[2147483647] bg-black/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-0 m-auto z-[2147483647] h-fit w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
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
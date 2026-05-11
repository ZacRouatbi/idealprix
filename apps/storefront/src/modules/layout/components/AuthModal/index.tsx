import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const tabs = [
    { id: "login", label: "Connexion" },
    { id: "register", label: "Inscription" },
    { id: "reset", label: "Mot de passe" },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case "login":
        return (
          <>
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-bold text-[#1E1E1E]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Connexion
              </h2>
              <p className="text-sm text-[#717182] mt-1">
                Connectez-vous à votre compte
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E1E1E] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                  placeholder="exemple@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E1E1E] mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                  placeholder="••••••••"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#D4302A] text-white py-2.5 rounded-lg font-medium hover:bg-[#b82a22] transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Se connecter
              </motion.button>
            </div>
          </>
        );

      case "register":
        return (
          <>
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-bold text-[#1E1E1E]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Créer un compte
              </h2>
              <p className="text-sm text-[#717182] mt-1">
                Rejoignez IdealPrix aujourd'hui
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E1E1E] mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E1E1E] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                  placeholder="exemple@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E1E1E] mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                  placeholder="••••••••"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#D4302A] text-white py-2.5 rounded-lg font-medium hover:bg-[#b82a22] transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Créer le compte
              </motion.button>
            </div>
          </>
        );

      case "reset":
        return (
          <>
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-bold text-[#1E1E1E]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Mot de passe oublié
              </h2>
              <p className="text-sm text-[#717182] mt-1">
                Réinitialisez votre mot de passe
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E1E1E] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4302A] bg-gray-50"
                  placeholder="exemple@email.com"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#D4302A] text-white py-2.5 rounded-lg font-medium hover:bg-[#b82a22] transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Envoyer le lien
              </motion.button>
            </div>
          </>
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
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
              <button
                onClick={() => setActiveTab("reset")}
                className="text-[#D4302A] hover:underline mr-4"
              >
                Mot de passe oublié ?
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className="text-[#D4302A] hover:underline"
              >
                Pas de compte ? S'inscrire
              </button>
            </>
          )}
          {activeTab === "register" && (
            <button
              onClick={() => setActiveTab("login")}
              className="text-[#D4302A] hover:underline"
            >
              Déjà un compte ? Se connecter
            </button>
          )}
          {activeTab === "reset" && (
            <button
              onClick={() => setActiveTab("login")}
              className="text-[#D4302A] hover:underline"
            >
              Retour à la connexion
            </button>
          )}
        </div>
      </motion.div>
    </>,
    document.body
  );
}
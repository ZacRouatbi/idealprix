import { useState } from "react";
import { createPortal } from "react-dom";

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

              <button
                className="w-full bg-[#D4302A] text-white py-2.5 rounded-lg font-medium hover:bg-[#b82a22] transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Se connecter
              </button>
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

              <button
                className="w-full bg-[#D4302A] text-white py-2.5 rounded-lg font-medium hover:bg-[#b82a22] transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Créer le compte
              </button>
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

              <button
                className="w-full bg-[#D4302A] text-white py-2.5 rounded-lg font-medium hover:bg-[#b82a22] transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Envoyer le lien
              </button>
            </div>
          </>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in-95 duration-200">
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

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderContent()}
        </div>
      </div>
    </div>,
    document.body
  );
}
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="bg-[#8D99AF] border-t border-gray-200">
      <div className="content-container mx-auto px-4 pb-8 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8 items-start">
          
          {/* Column 1 – Logo + description */}
          <div >
            <Link to="/" className="inline-block -mt-2px">
              <img
                src="/Idealprixlogo.png"
                alt="IdealPrix"
                className="h-10 w-auto"
              />
            </Link>
<p className="text-white text-sm leading-relaxed max-w-sm mt-2">
               Votre boutique en ligne pour tous vos besoins. Livraison rapide et service client disponible 24/7.
             </p>
          </div>

          {/* Column 2 – Quick links */}
          <div>
            <h4 className="font-medium text-white mb-4 mt-5">Liens rapides</h4>   {/* mt-0 kills browser margin */}
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-white hover:text-[#D4302A] transition-colors">
                  Accueil
                </a>
              </li>
              <li>
                <a href="/products" className="text-white hover:text-[#D4302A] transition-colors">
                  Produits
                </a>
              </li>
              <li>
                <a href="/cart" className="text-white hover:text-[#D4302A] transition-colors">
                  Panier
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 – Contact */}
          <div>
            <h4 className="font-medium text-white mb-4 mt-5">Contact</h4>         
            <p className="text-white text-sm">contact@idealprix.com</p>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-10 pt-6 text-center text-white text-sm">
          <p>&copy; {new Date().getFullYear()} IdealPrix. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
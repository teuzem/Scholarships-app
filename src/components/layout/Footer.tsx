import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'

const footerLinks = {
  'Bourses & Programmes': [
    { name: 'Toutes les bourses', href: '/scholarships' },
    { name: 'Programmes académiques', href: '/programs' },
    { name: 'Catégories', href: '/program-categories' },
    { name: 'Critères d\'admissibilité', href: '/eligibility-criteria' }
  ],
  'Institutions': [
    { name: 'Toutes les institutions', href: '/institutions' },
    { name: 'Types d\'institutions', href: '/institution-types' },
    { name: 'Profils d\'institutions', href: '/institution-profiles' },
    { name: 'Par pays', href: '/countries' }
  ],
  'Espace utilisateur': [
    { name: 'Mon profil', href: '/profile' },
    { name: 'Mes candidatures', href: '/applications' },
    { name: 'Mes favoris', href: '/favorites' },
    { name: 'Notifications', href: '/notifications' }
  ],
  'Support': [
    { name: 'Centre d\'aide', href: '/help' },
    { name: 'Contact', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Politique de confidentialité', href: '/privacy' }
  ]
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">ScholarConnect</span>
            </div>
            <p className="text-gray-300 text-sm mb-6 max-w-md">
              Votre plateforme de référence pour découvrir et postuler aux meilleures bourses d'études dans le monde entier.
            </p>
            
            {/* Contact info */}
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>contact@scholarconnect.fr</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Paris, France</span>
              </div>
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-white text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h3 className="text-lg font-semibold mb-3">Restez informé</h3>
            <p className="text-gray-300 text-sm mb-4">
              Recevez les dernières opportunités de bourses directement dans votre boîte email.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-r-md transition-colors font-medium">
                S'abonner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 ScholarConnect. Tous droits réservés.
            </div>
            
            {/* Social links */}
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

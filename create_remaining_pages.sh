#!/bin/bash

# Pages génériques pour les tables restantes
pages=(
  "InstitutionDetailPage"
  "CountryDetailPage" 
  "ProgramDetailPage"
  "FavoritesPage"
  "UserFavoritesPage"
  "MessagesPage"
  "DocumentsPage"
  "UserProfilesPage"
  "StudentProfilesPage"
  "InstitutionProfilesPage"
  "ProfilesPage"
  "UsersPage"
  "AnalyticsPage"
  "MlRecommendationsPage"
  "RecommendationHistoryPage"
  "ContinentsPage"
  "RegionsPage"
  "ProgramCategoriesPage"
  "InstitutionTypesPage"
  "EligibilityCriteriaPage"
  "ScholarshipProgramsPage"
)

for page in "${pages[@]}"; do
  cat > "src/pages/${page}.tsx" << PAGEEOF
import React from 'react'
import { Card } from '@/components/ui/Card'

export default function ${page}() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ${page/Page/}
        </h1>
        <p className="text-lg text-gray-600">
          Cette page est en cours de développement.
        </p>
      </div>
      
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-600">
            Fonctionnalité à venir prochainement...
          </p>
        </div>
      </Card>
    </div>
  )
}
PAGEEOF
done

echo "Pages créées avec succès!"

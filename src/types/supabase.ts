export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academic_programs: {
        Row: {
          average_salary_usd: number | null
          career_prospects: string[] | null
          created_at: string | null
          degree_type: string | null
          description: string | null
          duration_months: number | null
          id: string
          is_active: boolean | null
          languages: string[] | null
          level: string
          name: string
          program_category_id: string
          requirements: string[] | null
          skills: string[] | null
          updated_at: string | null
        }
        Insert: {
          average_salary_usd?: number | null
          career_prospects?: string[] | null
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          level: string
          name: string
          program_category_id: string
          requirements?: string[] | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Update: {
          average_salary_usd?: number | null
          career_prospects?: string[] | null
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          level?: string
          name?: string
          program_category_id?: string
          requirements?: string[] | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          scholarship_id: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          scholarship_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          scholarship_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          application_data: Json | null
          created_at: string | null
          id: string
          notes: string | null
          reviewed_at: string | null
          scholarship_id: string
          status: string | null
          student_id: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          application_data?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          scholarship_id: string
          status?: string | null
          student_id: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          application_data?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          scholarship_id?: string
          status?: string | null
          student_id?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      continents: {
        Row: {
          area_km2: number | null
          code: string
          created_at: string | null
          id: string
          name: string
          population: number | null
          updated_at: string | null
        }
        Insert: {
          area_km2?: number | null
          code: string
          created_at?: string | null
          id?: string
          name: string
          population?: number | null
          updated_at?: string | null
        }
        Update: {
          area_km2?: number | null
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          population?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      countries: {
        Row: {
          area_km2: number | null
          capital: string | null
          continent_id: string
          created_at: string | null
          currency: string | null
          flag_emoji: string | null
          gdp_usd: number | null
          id: string
          iso_code_2: string
          iso_code_3: string
          languages: string[] | null
          name: string
          name_official: string | null
          official_language: string | null
          population: number | null
          region: string | null
          subregion: string | null
          updated_at: string | null
        }
        Insert: {
          area_km2?: number | null
          capital?: string | null
          continent_id: string
          created_at?: string | null
          currency?: string | null
          flag_emoji?: string | null
          gdp_usd?: number | null
          id?: string
          iso_code_2: string
          iso_code_3: string
          languages?: string[] | null
          name: string
          name_official?: string | null
          official_language?: string | null
          population?: number | null
          region?: string | null
          subregion?: string | null
          updated_at?: string | null
        }
        Update: {
          area_km2?: number | null
          capital?: string | null
          continent_id?: string
          created_at?: string | null
          currency?: string | null
          flag_emoji?: string | null
          gdp_usd?: number | null
          id?: string
          iso_code_2?: string
          iso_code_3?: string
          languages?: string[] | null
          name?: string
          name_official?: string | null
          official_language?: string | null
          population?: number | null
          region?: string | null
          subregion?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          document_type: string | null
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          mime_type: string | null
          student_id: string
          uploaded_at: string | null
        }
        Insert: {
          document_type?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          student_id: string
          uploaded_at?: string | null
        }
        Update: {
          document_type?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          student_id?: string
          uploaded_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          scholarship_id: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          scholarship_id: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          scholarship_id?: string
          student_id?: string
        }
        Relationships: []
      }
      institution_profiles: {
        Row: {
          contact_email: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          description: string | null
          established_year: number | null
          focus_areas: string[] | null
          id: string
          institution_name: string
          institution_type: string | null
          international_students_percentage: number | null
          phone: string | null
          profile_id: string
          ranking_global: number | null
          ranking_national: number | null
          scholarship_budget_annual: number | null
          total_students: number | null
          updated_at: string | null
          verification_date: string | null
          verified: boolean | null
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          established_year?: number | null
          focus_areas?: string[] | null
          id: string
          institution_name: string
          institution_type?: string | null
          international_students_percentage?: number | null
          phone?: string | null
          profile_id: string
          ranking_global?: number | null
          ranking_national?: number | null
          scholarship_budget_annual?: number | null
          total_students?: number | null
          updated_at?: string | null
          verification_date?: string | null
          verified?: boolean | null
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          established_year?: number | null
          focus_areas?: string[] | null
          id?: string
          institution_name?: string
          institution_type?: string | null
          international_students_percentage?: number | null
          phone?: string | null
          profile_id?: string
          ranking_global?: number | null
          ranking_national?: number | null
          scholarship_budget_annual?: number | null
          total_students?: number | null
          updated_at?: string | null
          verification_date?: string | null
          verified?: boolean | null
          website_url?: string | null
        }
        Relationships: []
      }
      institution_types: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      institutions: {
        Row: {
          accreditation: string[] | null
          address: string | null
          city: string
          country_id: string
          created_at: string | null
          description: string | null
          email: string | null
          established_year: number | null
          faculty_count: number | null
          id: string
          institution_type_id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_short: string | null
          phone: string | null
          ranking_global: number | null
          ranking_national: number | null
          student_count: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accreditation?: string[] | null
          address?: string | null
          city: string
          country_id: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          established_year?: number | null
          faculty_count?: number | null
          id?: string
          institution_type_id: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_short?: string | null
          phone?: string | null
          ranking_global?: number | null
          ranking_national?: number | null
          student_count?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accreditation?: string[] | null
          address?: string | null
          city?: string
          country_id?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          established_year?: number | null
          faculty_count?: number | null
          id?: string
          institution_type_id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_short?: string | null
          phone?: string | null
          ranking_global?: number | null
          ranking_national?: number | null
          student_count?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          parent_message_id: string | null
          recipient_id: string
          related_application_id: string | null
          related_scholarship_id: string | null
          sender_id: string
          subject: string | null
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          recipient_id: string
          related_application_id?: string | null
          related_scholarship_id?: string | null
          sender_id: string
          subject?: string | null
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          recipient_id?: string
          related_application_id?: string | null
          related_scholarship_id?: string | null
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      ml_recommendations: {
        Row: {
          generated_at: string | null
          id: string
          is_viewed: boolean | null
          match_score: number
          recommendation_factors: Json | null
          scholarship_id: string
          student_id: string
        }
        Insert: {
          generated_at?: string | null
          id?: string
          is_viewed?: boolean | null
          match_score: number
          recommendation_factors?: Json | null
          scholarship_id: string
          student_id: string
        }
        Update: {
          generated_at?: string | null
          id?: string
          is_viewed?: boolean | null
          match_score?: number
          recommendation_factors?: Json | null
          scholarship_id?: string
          student_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          related_application_id: string | null
          related_scholarship_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          related_application_id?: string | null
          related_scholarship_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          related_application_id?: string | null
          related_scholarship_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          profile_image_url: string | null
          updated_at: string | null
          user_type: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
          user_type: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
          user_type?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      program_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recommendation_history: {
        Row: {
          algorithm_version: string | null
          created_at: string | null
          factors_considered: Json | null
          id: string
          recommendation_score: number | null
          scholarship_id: string
          user_id: string
        }
        Insert: {
          algorithm_version?: string | null
          created_at?: string | null
          factors_considered?: Json | null
          id?: string
          recommendation_score?: number | null
          scholarship_id: string
          user_id: string
        }
        Update: {
          algorithm_version?: string | null
          created_at?: string | null
          factors_considered?: Json | null
          id?: string
          recommendation_score?: number | null
          scholarship_id?: string
          user_id?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          continent_id: string
          country_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          continent_id: string
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          continent_id?: string
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scholarship_eligibility: {
        Row: {
          created_at: string | null
          criteria_type: string
          criteria_value: string
          id: string
          is_required: boolean | null
          max_value: number | null
          min_value: number | null
          scholarship_id: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criteria_type: string
          criteria_value: string
          id?: string
          is_required?: boolean | null
          max_value?: number | null
          min_value?: number | null
          scholarship_id: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criteria_type?: string
          criteria_value?: string
          id?: string
          is_required?: boolean | null
          max_value?: number | null
          min_value?: number | null
          scholarship_id?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scholarship_programs: {
        Row: {
          academic_program_id: string
          created_at: string | null
          id: string
          scholarship_id: string
        }
        Insert: {
          academic_program_id: string
          created_at?: string | null
          id?: string
          scholarship_id: string
        }
        Update: {
          academic_program_id?: string
          created_at?: string | null
          id?: string
          scholarship_id?: string
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          amount: number | null
          application_count: number | null
          application_deadline: string
          application_fee: number | null
          application_fee_currency: string | null
          application_process: string[] | null
          application_requirements: string[] | null
          application_status: string | null
          application_url: string | null
          benefits: string[] | null
          contact_email: string | null
          contact_phone: string | null
          coverage_details: string[] | null
          created_at: string | null
          currency: string | null
          description: string
          detailed_description: string | null
          duration_months: number | null
          eligibility_criteria: string
          end_date: string | null
          external_id: string | null
          favorite_count: number | null
          id: string
          institution_id: string
          is_active: boolean | null
          is_featured: boolean | null
          language_requirements: string | null
          max_age: number | null
          min_age: number | null
          min_gpa: number | null
          number_of_awards: number | null
          obligations: string[] | null
          published_at: string | null
          renewable: boolean | null
          renewal_criteria: string | null
          required_languages: string[] | null
          restrictions: string[] | null
          scholarship_type: string | null
          selection_criteria: string[] | null
          source_url: string | null
          start_date: string | null
          study_fields: string[]
          study_level: string | null
          tags: string[] | null
          target_countries: string[] | null
          target_nationalities: string[] | null
          target_regions: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          amount?: number | null
          application_count?: number | null
          application_deadline: string
          application_fee?: number | null
          application_fee_currency?: string | null
          application_process?: string[] | null
          application_requirements?: string[] | null
          application_status?: string | null
          application_url?: string | null
          benefits?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          coverage_details?: string[] | null
          created_at?: string | null
          currency?: string | null
          description: string
          detailed_description?: string | null
          duration_months?: number | null
          eligibility_criteria: string
          end_date?: string | null
          external_id?: string | null
          favorite_count?: number | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          is_featured?: boolean | null
          language_requirements?: string | null
          max_age?: number | null
          min_age?: number | null
          min_gpa?: number | null
          number_of_awards?: number | null
          obligations?: string[] | null
          published_at?: string | null
          renewable?: boolean | null
          renewal_criteria?: string | null
          required_languages?: string[] | null
          restrictions?: string[] | null
          scholarship_type?: string | null
          selection_criteria?: string[] | null
          source_url?: string | null
          start_date?: string | null
          study_fields: string[]
          study_level?: string | null
          tags?: string[] | null
          target_countries?: string[] | null
          target_nationalities?: string[] | null
          target_regions?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          amount?: number | null
          application_count?: number | null
          application_deadline?: string
          application_fee?: number | null
          application_fee_currency?: string | null
          application_process?: string[] | null
          application_requirements?: string[] | null
          application_status?: string | null
          application_url?: string | null
          benefits?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          coverage_details?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string
          detailed_description?: string | null
          duration_months?: number | null
          eligibility_criteria?: string
          end_date?: string | null
          external_id?: string | null
          favorite_count?: number | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          language_requirements?: string | null
          max_age?: number | null
          min_age?: number | null
          min_gpa?: number | null
          number_of_awards?: number | null
          obligations?: string[] | null
          published_at?: string | null
          renewable?: boolean | null
          renewal_criteria?: string | null
          required_languages?: string[] | null
          restrictions?: string[] | null
          scholarship_type?: string | null
          selection_criteria?: string[] | null
          source_url?: string | null
          start_date?: string | null
          study_fields?: string[]
          study_level?: string | null
          tags?: string[] | null
          target_countries?: string[] | null
          target_nationalities?: string[] | null
          target_regions?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          academic_achievements: string | null
          created_at: string | null
          current_education_level: string | null
          date_of_birth: string | null
          field_of_study: string | null
          financial_need_level: number | null
          gpa: number | null
          id: string
          languages_spoken: string[] | null
          nationality: string | null
          preferred_study_countries: string[] | null
          preferred_study_fields: string[] | null
          profile_id: string
          updated_at: string | null
          work_experience: string | null
        }
        Insert: {
          academic_achievements?: string | null
          created_at?: string | null
          current_education_level?: string | null
          date_of_birth?: string | null
          field_of_study?: string | null
          financial_need_level?: number | null
          gpa?: number | null
          id: string
          languages_spoken?: string[] | null
          nationality?: string | null
          preferred_study_countries?: string[] | null
          preferred_study_fields?: string[] | null
          profile_id: string
          updated_at?: string | null
          work_experience?: string | null
        }
        Update: {
          academic_achievements?: string | null
          created_at?: string | null
          current_education_level?: string | null
          date_of_birth?: string | null
          field_of_study?: string | null
          financial_need_level?: number | null
          gpa?: number | null
          id?: string
          languages_spoken?: string[] | null
          nationality?: string | null
          preferred_study_countries?: string[] | null
          preferred_study_fields?: string[] | null
          profile_id?: string
          updated_at?: string | null
          work_experience?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          scholarship_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          scholarship_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          scholarship_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          academic_level: string | null
          achievements: string[] | null
          address: string | null
          bio: string | null
          career_goals: string | null
          certifications: string[] | null
          country_of_residence: string | null
          created_at: string | null
          current_institution: string | null
          date_of_birth: string | null
          field_of_study: string | null
          financial_need_level: string | null
          gender: string | null
          gpa: number | null
          id: string
          interests: string[] | null
          language_proficiency: Json | null
          nationality: string | null
          phone: string | null
          profile_picture_url: string | null
          scholarship_preferences: Json | null
          social_links: Json | null
          updated_at: string | null
          user_id: string
          work_experience: string[] | null
        }
        Insert: {
          academic_level?: string | null
          achievements?: string[] | null
          address?: string | null
          bio?: string | null
          career_goals?: string | null
          certifications?: string[] | null
          country_of_residence?: string | null
          created_at?: string | null
          current_institution?: string | null
          date_of_birth?: string | null
          field_of_study?: string | null
          financial_need_level?: string | null
          gender?: string | null
          gpa?: number | null
          id?: string
          interests?: string[] | null
          language_proficiency?: Json | null
          nationality?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          scholarship_preferences?: Json | null
          social_links?: Json | null
          updated_at?: string | null
          user_id: string
          work_experience?: string[] | null
        }
        Update: {
          academic_level?: string | null
          achievements?: string[] | null
          address?: string | null
          bio?: string | null
          career_goals?: string | null
          certifications?: string[] | null
          country_of_residence?: string | null
          created_at?: string | null
          current_institution?: string | null
          date_of_birth?: string | null
          field_of_study?: string | null
          financial_need_level?: string | null
          gender?: string | null
          gpa?: number | null
          id?: string
          interests?: string[] | null
          language_proficiency?: Json | null
          nationality?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          scholarship_preferences?: Json | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string
          work_experience?: string[] | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

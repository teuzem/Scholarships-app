// Edge Function: profile-manager
// Gestion complète des profils utilisateur (création, modification, synchronisation)

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const requestData = await req.json();
        const { action, userId, profileData, userType } = requestData;

        // Vérifier l'autorisation
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Authorization header manquant');
        }

        // Obtenir les variables d'environnement
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Variables d\'environnement Supabase manquantes');
        }

        // Créer le client Supabase avec la clé de service
        const supabaseHeaders = {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'update_profile':
                return await updateProfile(supabaseUrl, supabaseHeaders, userId, profileData);
            
            case 'update_student_profile':
                return await updateStudentProfile(supabaseUrl, supabaseHeaders, userId, profileData);
            
            case 'update_institution_profile':
                return await updateInstitutionProfile(supabaseUrl, supabaseHeaders, userId, profileData);
            
            case 'get_full_profile':
                return await getFullProfile(supabaseUrl, supabaseHeaders, userId);
            
            case 'switch_user_type':
                return await switchUserType(supabaseUrl, supabaseHeaders, userId, userType);
            
            default:
                throw new Error(`Action non supportée: ${action}`);
        }

    } catch (error) {
        console.error('Erreur profile-manager:', error);
        const errorResponse = {
            error: {
                code: 'PROFILE_MANAGER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Met à jour le profil principal
async function updateProfile(supabaseUrl: string, headers: Record<string, string>, userId: string, profileData: any) {
    const updateData = {
        ...profileData,
        updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        throw new Error(`Erreur mise à jour profil: ${response.statusText}`);
    }

    // Récupérer le profil mis à jour
    const getResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        method: 'GET',
        headers
    });

    const updatedProfile = await getResponse.json();

    return new Response(JSON.stringify({ 
        success: true, 
        data: updatedProfile[0] || null 
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Met à jour le profil étudiant
async function updateStudentProfile(supabaseUrl: string, headers: Record<string, string>, userId: string, profileData: any) {
    const updateData = {
        ...profileData,
        updated_at: new Date().toISOString()
    };

    // Vérifier si le profil étudiant existe
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/student_profiles?user_id=eq.${userId}`, {
        method: 'GET',
        headers
    });

    const existingProfiles = await checkResponse.json();

    if (existingProfiles.length === 0) {
        // Créer un nouveau profil étudiant
        const createResponse = await fetch(`${supabaseUrl}/rest/v1/student_profiles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                user_id: userId,
                ...updateData,
                created_at: new Date().toISOString()
            })
        });

        if (!createResponse.ok) {
            throw new Error(`Erreur création profil étudiant: ${createResponse.statusText}`);
        }
    } else {
        // Mettre à jour le profil existant
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/student_profiles?user_id=eq.${userId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
            throw new Error(`Erreur mise à jour profil étudiant: ${updateResponse.statusText}`);
        }
    }

    // Récupérer le profil mis à jour
    const getResponse = await fetch(`${supabaseUrl}/rest/v1/student_profiles?user_id=eq.${userId}&select=*`, {
        method: 'GET',
        headers
    });

    const updatedProfile = await getResponse.json();

    return new Response(JSON.stringify({ 
        success: true, 
        data: updatedProfile[0] || null 
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Met à jour le profil institution
async function updateInstitutionProfile(supabaseUrl: string, headers: Record<string, string>, userId: string, profileData: any) {
    const updateData = {
        ...profileData,
        updated_at: new Date().toISOString()
    };

    // Vérifier si le profil institution existe
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/institution_profiles?user_id=eq.${userId}`, {
        method: 'GET',
        headers
    });

    const existingProfiles = await checkResponse.json();

    if (existingProfiles.length === 0) {
        // Créer un nouveau profil institution
        const createResponse = await fetch(`${supabaseUrl}/rest/v1/institution_profiles`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                user_id: userId,
                ...updateData,
                created_at: new Date().toISOString()
            })
        });

        if (!createResponse.ok) {
            throw new Error(`Erreur création profil institution: ${createResponse.statusText}`);
        }
    } else {
        // Mettre à jour le profil existant
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/institution_profiles?user_id=eq.${userId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
            throw new Error(`Erreur mise à jour profil institution: ${updateResponse.statusText}`);
        }
    }

    // Récupérer le profil mis à jour
    const getResponse = await fetch(`${supabaseUrl}/rest/v1/institution_profiles?user_id=eq.${userId}&select=*`, {
        method: 'GET',
        headers
    });

    const updatedProfile = await getResponse.json();

    return new Response(JSON.stringify({ 
        success: true, 
        data: updatedProfile[0] || null 
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Récupère le profil complet
async function getFullProfile(supabaseUrl: string, headers: Record<string, string>, userId: string) {
    // Récupérer le profil principal
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        method: 'GET',
        headers
    });

    const profileData = await profileResponse.json();
    const profile = profileData[0] || null;

    if (!profile) {
        throw new Error('Profil non trouvé');
    }

    let specificProfile = null;

    if (profile.user_type === 'student') {
        const studentResponse = await fetch(`${supabaseUrl}/rest/v1/student_profiles?user_id=eq.${userId}&select=*`, {
            method: 'GET',
            headers
        });
        const studentData = await studentResponse.json();
        specificProfile = studentData[0] || null;
    } else if (profile.user_type === 'institution') {
        const institutionResponse = await fetch(`${supabaseUrl}/rest/v1/institution_profiles?user_id=eq.${userId}&select=*`, {
            method: 'GET',
            headers
        });
        const institutionData = await institutionResponse.json();
        specificProfile = institutionData[0] || null;
    }

    return new Response(JSON.stringify({ 
        success: true, 
        data: {
            profile,
            specificProfile
        }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Change le type d'utilisateur
async function switchUserType(supabaseUrl: string, headers: Record<string, string>, userId: string, newUserType: string) {
    if (!['student', 'institution'].includes(newUserType)) {
        throw new Error('Type d\'utilisateur invalide');
    }

    // Mettre à jour le profil principal
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            user_type: newUserType,
            updated_at: new Date().toISOString()
        })
    });

    if (!updateResponse.ok) {
        throw new Error(`Erreur changement type utilisateur: ${updateResponse.statusText}`);
    }

    return new Response(JSON.stringify({ 
        success: true, 
        message: `Type d'utilisateur changé en ${newUserType}` 
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

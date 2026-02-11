const API_BASE_URL = 'https://backend-production-42b0.up.railway.app';
console.log('Using Hardcoded API_BASE_URL:', API_BASE_URL);

export const fetchUsers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/users`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch users');
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Helper to get auth headers
const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const headers = { 'Content-Type': 'application/json' };
    if (user && user.email) {
        headers['X-User-Email'] = user.email;
    }
    return headers;
};

export const fetchProjects = async (userEmail = null) => {
    try {
        const url = userEmail
            ? `${API_BASE_URL}/projects/?user_email=${encodeURIComponent(userEmail)}`
            : `${API_BASE_URL}/projects/`;

        const response = await fetch(url, { headers: getAuthHeaders() });
        console.log('fetchProjects status:', response.status);
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        console.log('fetchProjects data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }
};

export const fetchStages = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/stages/`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch stages');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching stages:', error);
        throw error;
    }
};

export const fetchResources = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/resources/`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch resources');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching resources:', error);
        throw error;
    }
};

export const fetchProjectById = async (recordId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${recordId}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Project not found');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching project by ID:', error);
        throw error;
    }
};

export const fetchResourcesByProject = async (recordId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/resources/project/${recordId}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch resources for project');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching resources by project:', error);
        throw error;
    }
};

export const fetchStageHistory = async (recordId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/history/${recordId}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch stage history');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stage history:', error);
        throw error;
    }
};

export const createProject = async (projectData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(projectData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create project');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
};

export const skipToStage = async (recordId, selectedStageName, nextStageExpectedDate = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${recordId}/skip-to-stage`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                selected_stage_name: selectedStageName,
                next_stage_expected_date: nextStageExpectedDate
            })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to move to stage');
        }
        return await response.json();
    } catch (error) {
        console.error('Error skipping to stage:', error);
        throw error;
    }
};

export const updateProjectStatus = async (recordId, statusData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${recordId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(statusData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update project status');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating project status:', error);
        throw error;
    }
};

export const checkEmailExists = async (email) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/check-email/${email}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Access not granted. Please contact the administrator.');
        }
        return await response.json();
    } catch (error) {
        console.error('Error checking email:', error);
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        return await response.json();
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
};

export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to authorize user');
        }
        return await response.json();
    } catch (error) {
        console.error('Error during user authorization:', error);
        throw error;
    }
};

export const updateProject = async (recordId, projectData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${recordId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(projectData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update project');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};

export const deleteProject = async (recordId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${recordId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete project');
        }
        return await response.json();
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
};

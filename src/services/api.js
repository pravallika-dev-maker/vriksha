const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('Using API_BASE_URL:', API_BASE_URL);

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

// FINANCE MODULE ENDPOINTS
export const fetchFinancials = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/finance/financials`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch financials');
        return await response.json();
    } catch (error) {
        console.error('Error fetching financials:', error);
        throw error;
    }
};

export const createFinancial = async (data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/finance/financials`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create financial record');
        return await response.json();
    } catch (error) {
        console.error('Error creating financial:', error);
        throw error;
    }
};

export const fetchCosts = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/finance/costs`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch costs');
        return await response.json();
    } catch (error) {
        console.error('Error fetching costs:', error);
        throw error;
    }
};

export const createCost = async (data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/finance/costs`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create cost item');
        return await response.json();
    } catch (error) {
        console.error('Error creating cost:', error);
        throw error;
    }
};

export const fetchFunds = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/finance/funds`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch funds');
        return await response.json();
    } catch (error) {
        console.error('Error fetching funds:', error);
        throw error;
    }
};

export const createFund = async (data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/finance/funds`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create fund record');
        return await response.json();
    } catch (error) {
        console.error('Error creating fund:', error);
        throw error;
    }
};

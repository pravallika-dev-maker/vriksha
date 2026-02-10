const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-production-42b0.up.railway.app';

export const fetchProjects = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/`);
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
        const response = await fetch(`${API_BASE_URL}/stages/`);
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
        const response = await fetch(`${API_BASE_URL}/resources/`);
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
        const response = await fetch(`${API_BASE_URL}/projects/${recordId}`);
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
        const response = await fetch(`${API_BASE_URL}/resources/project/${recordId}`);
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
        const response = await fetch(`${API_BASE_URL}/history/${recordId}`);
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
        const response = await fetch(`${API_BASE_URL}/auth/check-email/${email}`);
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
            headers: { 'Content-Type': 'application/json' },
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

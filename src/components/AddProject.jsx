import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject, fetchStages, fetchUsers } from '../services/api';
import './AddProject.css';

const AddProject = () => {
    const navigate = useNavigate();
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [allUsers, setAllUsers] = useState([]);

    const [formData, setFormData] = useState({
        client_name: '',
        deal_type: 'Pilot',
        deal_value: '',
        project_started_date: '',
        starting_stage_name: '',
        next_stage_expected_date: '',
        contract_years: '',
        project_category: 'Services',
        is_private: false
    });

    const [projectOwners, setProjectOwners] = useState([
        { name: '', email: '', access_level: 'WRITE' } // Default one owner
    ]);

    const [resources, setResources] = useState([
        { resource_name: '', role: '', email: '', access_level: 'READ' }
    ]);

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadStages();
    }, []);

    const handleAddOwner = () => {
        setProjectOwners([...projectOwners, { name: '', email: '', access_level: 'WRITE' }]);
    };

    const handleRemoveOwner = (index) => {
        const updatedOwners = projectOwners.filter((_, i) => i !== index);
        setProjectOwners(updatedOwners.length > 0 ? updatedOwners : [{ name: '', email: '', access_level: 'WRITE' }]);
    };

    const handleOwnerChange = (index, e) => {
        const { name, value } = e.target;
        const updatedOwners = [...projectOwners];

        if (name === 'project_owner_name') {
            const selectedUser = allUsers.find(u => u.full_name === value);
            updatedOwners[index].name = value;
            updatedOwners[index].email = selectedUser ? selectedUser.email : '';
        } else {
            updatedOwners[index][name] = value;
        }
        setProjectOwners(updatedOwners);
    };

    const handleAddResource = () => {
        setResources([...resources, { resource_name: '', role: '', email: '', access_level: 'READ' }]);
    };

    const handleRemoveResource = (index) => {
        const updatedResources = resources.filter((_, i) => i !== index);
        setResources(updatedResources.length > 0 ? updatedResources : [{ resource_name: '', role: '', email: '', access_level: 'READ' }]);
    };

    const handleResourceChange = (index, e) => {
        const { name, value } = e.target;
        const updatedResources = [...resources];
        updatedResources[index][name] = value;
        setResources(updatedResources);
    };

    const loadStages = async () => {
        try {
            // Get user from localStorage
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (user && user.full_name) {
                if (user && user.full_name) {
                    // Set initial owner to logged in user if available
                    setProjectOwners([{ name: user.full_name, email: user.email, access_level: 'WRITE' }]);
                }
            }

            const [stagesData, usersData] = await Promise.all([
                fetchStages(),
                fetchUsers()
            ]);

            setAllUsers(usersData);
            const sortedStages = stagesData.sort((a, b) => a.stage_order - b.stage_order);
            setStages(sortedStages);

            // Set default starting stage to first stage
            if (sortedStages.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    starting_stage_name: sortedStages[0].stage_name
                }));
            }
        } catch (err) {
            setError('Failed to load stages');
            console.error(err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'project_owner_name') {
            // Deprecated handler for single owner, keeping just in case but shouldn't be hit with new UI
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.client_name.trim()) {
            newErrors.client_name = 'Client name is required';
        }

        // Check if at least one owner is selected
        const validOwners = projectOwners.filter(o => o.name && o.name.trim() !== '');
        if (validOwners.length === 0) {
            newErrors.project_owner_name = 'At least one project owner is required';
        }

        if (!formData.deal_value || parseFloat(formData.deal_value) <= 0) {
            newErrors.deal_value = 'Deal value must be a positive number';
        }

        if (!formData.project_started_date) {
            newErrors.project_started_date = 'Project start date is required';
        }

        if (!formData.starting_stage_name) {
            newErrors.starting_stage_name = 'Starting stage is required';
        }

        // Validate next stage expected date if provided
        if (formData.next_stage_expected_date && formData.project_started_date) {
            const startDate = new Date(formData.project_started_date);
            const expectedDate = new Date(formData.next_stage_expected_date);

            if (expectedDate < startDate) {
                newErrors.next_stage_expected_date = 'Expected date cannot be before project start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Filter out empty resources
            const filteredResources = resources.filter(r => r.resource_name.trim() !== '');

            // Process Owners
            const validOwners = projectOwners.filter(o => o.name && o.name.trim() !== '');
            const ownerNames = validOwners.map(o => o.name).join(', ');

            // Add owners to resources list
            validOwners.forEach(owner => {
                // Check if owner is already in resources (by email) to avoid duplicates
                const exists = filteredResources.some(r => r.email === owner.email);
                if (!exists) {
                    filteredResources.push({
                        resource_name: owner.name,
                        role: 'Project Owner',
                        email: owner.email,
                        access_level: owner.access_level
                    });
                }
            });

            const projectData = {
                client_name: formData.client_name,
                deal_type: formData.deal_type,
                project_owner_name: ownerNames,
                deal_value: parseFloat(formData.deal_value),
                project_started_date: formData.project_started_date,
                starting_stage_name: formData.starting_stage_name,
                next_stage_expected_date: formData.next_stage_expected_date || null,
                contract_years: formData.contract_years ? parseFloat(formData.contract_years) : null,
                project_category: formData.project_category,
                is_private: formData.is_private,
                resources: filteredResources
            };

            const createdProject = await createProject(projectData);

            // Show success message and redirect
            alert('Project created successfully!');
            navigate(`/project/${createdProject.record_id}`);

        } catch (err) {
            setError(err.message || 'Failed to create project');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/dashboard');
    };

    return (
        <div className="add-project-container">
            <div className="add-project-card">
                <h1>Add New Project</h1>
                <p className="subtitle">Create a new project by entering business and deal details</p>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="project-form">
                    {/* ... (previous form fields) ... */}
                    <div className="form-section">
                        <h3 className="section-title">Project Details</h3>
                        <div className="form-grid">
                            {/* Client Name */}
                            <div className="form-group">
                                <label htmlFor="client_name">
                                    Client Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="client_name"
                                    name="client_name"
                                    value={formData.client_name}
                                    onChange={handleChange}
                                    placeholder="Enter client name"
                                    className={errors.client_name ? 'error' : ''}
                                />
                                {errors.client_name && <span className="error-text">{errors.client_name}</span>}
                            </div>

                            {/* Deal Type */}
                            <div className="form-group">
                                <label htmlFor="deal_type">
                                    Deal Type <span className="required">*</span>
                                </label>
                                <select
                                    id="deal_type"
                                    name="deal_type"
                                    value={formData.deal_type}
                                    onChange={handleChange}
                                >
                                    <option value="Pilot">Pilot</option>
                                    <option value="Project">Project</option>
                                </select>
                            </div>

                            {/* Project Category */}
                            <div className="form-group">
                                <label htmlFor="project_category">
                                    Project Category <span className="required">*</span>
                                </label>
                                <select
                                    id="project_category"
                                    name="project_category"
                                    value={formData.project_category}
                                    onChange={handleChange}
                                >
                                    <option value="Services">Services</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Product">Product</option>
                                </select>
                            </div>

                            {/* Multiple Project Owners Section */}
                            <div className="project-owners-wrapper">
                                <label className="project-owners-label">
                                    Project Owner(s) <span className="required">*</span>
                                </label>
                                {projectOwners.map((owner, index) => (
                                    <div key={index} className="project-owner-row">
                                        <div className="form-group">
                                            <select
                                                name="project_owner_name"
                                                value={owner.name}
                                                onChange={(e) => handleOwnerChange(index, e)}
                                                className={errors.project_owner_name ? 'error' : ''}
                                            >
                                                <option value="">Select Owner</option>
                                                {allUsers.map(u => (
                                                    <option key={u.email} value={u.full_name}>
                                                        {u.full_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <select
                                                name="access_level"
                                                value={owner.access_level}
                                                onChange={(e) => handleOwnerChange(index, e)}
                                            >
                                                <option value="READ">Read Only</option>
                                                <option value="WRITE">Read & Write</option>
                                            </select>
                                        </div>
                                        {projectOwners.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOwner(index)}
                                                className="btn-remove-resource"
                                                title="Remove Owner"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={handleAddOwner}
                                        className="btn-add-owner-text"
                                        title="Add another owner"
                                    >
                                        <span style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '4px' }}>+</span> Add Owner
                                    </button>
                                </div>
                                {errors.project_owner_name && <span className="error-text" style={{ display: 'block', marginTop: '5px' }}>{errors.project_owner_name}</span>}
                            </div>

                            {/* Deal Value */}
                            <div className="form-group">
                                <label htmlFor="deal_value">
                                    Deal Value <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="deal_value"
                                    name="deal_value"
                                    value={formData.deal_value}
                                    onChange={handleChange}
                                    placeholder="Enter deal value"
                                    min="0"
                                    step="0.01"
                                    className={errors.deal_value ? 'error' : ''}
                                />
                                {errors.deal_value && <span className="error-text">{errors.deal_value}</span>}
                            </div>

                            {/* Contract Duration */}
                            <div className="form-group">
                                <label htmlFor="contract_years">
                                    Contract Duration (Years)
                                </label>
                                <input
                                    type="number"
                                    id="contract_years"
                                    name="contract_years"
                                    value={formData.contract_years}
                                    onChange={handleChange}
                                    placeholder="e.g. 1, 2.5"
                                    min="0"
                                    step="0.1"
                                />
                            </div>

                            {/* Project Start Date */}
                            <div className="form-group">
                                <label htmlFor="project_started_date">
                                    Project Start Date <span className="required">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="project_started_date"
                                    name="project_started_date"
                                    value={formData.project_started_date}
                                    onChange={handleChange}
                                    className={errors.project_started_date ? 'error' : ''}
                                />
                                {errors.project_started_date && <span className="error-text">{errors.project_started_date}</span>}
                            </div>

                            {/* Starting Stage */}
                            <div className="form-group">
                                <label htmlFor="starting_stage_name">
                                    Starting Stage <span className="required">*</span>
                                </label>
                                <select
                                    id="starting_stage_name"
                                    name="starting_stage_name"
                                    value={formData.starting_stage_name}
                                    onChange={handleChange}
                                    className={errors.starting_stage_name ? 'error' : ''}
                                >
                                    {stages.map(stage => (
                                        <option key={stage.id} value={stage.stage_name}>
                                            {stage.stage_name}
                                        </option>
                                    ))}
                                </select>
                                <span className="helper-text">
                                    Select the current stage
                                </span>
                            </div>

                            {/* Expected Next Stage Date */}
                            <div className="form-group">
                                <label htmlFor="next_stage_expected_date">
                                    Expected Next Stage Date
                                </label>
                                <input
                                    type="date"
                                    id="next_stage_expected_date"
                                    name="next_stage_expected_date"
                                    value={formData.next_stage_expected_date}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Private Project Toggle (CEO only) */}
                            {JSON.parse(localStorage.getItem('user') || 'null')?.can_add_users && (
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 0' }}>
                                        <input
                                            type="checkbox"
                                            name="is_private"
                                            checked={formData.is_private}
                                            onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <span style={{ fontWeight: '600', color: '#1a202c' }}>Mark as Private Project</span>
                                            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Private projects are confidential and visible only to the CEO.</p>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3 className="section-title">Team Resources</h3>
                        </div>
                        <div className="resources-list">
                            {resources.map((resource, index) => (
                                <div key={index} className="resource-row">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            name="resource_name"
                                            value={resource.resource_name}
                                            onChange={(e) => handleResourceChange(index, e)}
                                            placeholder="Resource Name"
                                            style={{ padding: '8px' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            name="role"
                                            value={resource.role}
                                            onChange={(e) => handleResourceChange(index, e)}
                                            placeholder="Role"
                                            style={{ padding: '8px' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveResource(index)}
                                        className="btn-remove-resource"
                                        title="Remove member"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            {/* Show Plus Icon only when last fields are filled */}
                            {resources[resources.length - 1].resource_name.trim() !== '' &&
                                resources[resources.length - 1].role.trim() !== '' && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={handleAddResource}
                                            className="btn-add-resource-circle"
                                            title="Add another member"
                                        >
                                            +
                                        </button>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="btn-cancel"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProject;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject, fetchStages } from '../services/api';
import './AddProject.css';

const AddProject = () => {
    const navigate = useNavigate();
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        client_name: '',
        deal_type: 'Pilot',
        project_owner_name: '',
        deal_value: '',
        project_started_date: '',
        starting_stage_name: '',
        next_stage_expected_date: '',
        parent_record_id: ''
    });

    const [resources, setResources] = useState([
        { resource_name: '', role: '' }
    ]);

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadStages();
    }, []);

    const handleAddResource = () => {
        setResources([...resources, { resource_name: '', role: '' }]);
    };

    const handleRemoveResource = (index) => {
        const updatedResources = resources.filter((_, i) => i !== index);
        setResources(updatedResources.length > 0 ? updatedResources : [{ resource_name: '', role: '' }]);
    };

    const handleResourceChange = (index, e) => {
        const { name, value } = e.target;
        const updatedResources = [...resources];
        updatedResources[index][name] = value;
        setResources(updatedResources);
    };

    const loadStages = async () => {
        try {
            const stagesData = await fetchStages();
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

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

        if (!formData.project_owner_name.trim()) {
            newErrors.project_owner_name = 'Project owner is required';
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

            const projectData = {
                client_name: formData.client_name,
                deal_type: formData.deal_type,
                project_owner_name: formData.project_owner_name,
                deal_value: parseFloat(formData.deal_value),
                project_started_date: formData.project_started_date,
                starting_stage_name: formData.starting_stage_name,
                next_stage_expected_date: formData.next_stage_expected_date || null,
                parent_record_id: formData.parent_record_id || null,
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

                            {/* Project Owner */}
                            <div className="form-group">
                                <label htmlFor="project_owner_name">
                                    Project Owner <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="project_owner_name"
                                    name="project_owner_name"
                                    value={formData.project_owner_name}
                                    onChange={handleChange}
                                    placeholder="Enter project owner name"
                                    className={errors.project_owner_name ? 'error' : ''}
                                />
                                {errors.project_owner_name && <span className="error-text">{errors.project_owner_name}</span>}
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

                            {/* Parent Record ID */}
                            <div className="form-group">
                                <label htmlFor="parent_record_id">
                                    Parent Record ID (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="parent_record_id"
                                    name="parent_record_id"
                                    value={formData.parent_record_id}
                                    onChange={handleChange}
                                    placeholder="Reference ID"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3 className="section-title">Team Resources</h3>
                            <button
                                type="button"
                                onClick={handleAddResource}
                                className="btn-add-resource"
                            >
                                + Add Member
                            </button>
                        </div>
                        <div className="resources-list">
                            {resources.map((resource, index) => (
                                <div key={index} className="resource-row">
                                    <div className="form-group flex-1">
                                        <input
                                            type="text"
                                            name="resource_name"
                                            value={resource.resource_name}
                                            onChange={(e) => handleResourceChange(index, e)}
                                            placeholder="Resource Name"
                                        />
                                    </div>
                                    <div className="form-group flex-1">
                                        <input
                                            type="text"
                                            name="role"
                                            value={resource.role}
                                            onChange={(e) => handleResourceChange(index, e)}
                                            placeholder="Role (e.g. Developer)"
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

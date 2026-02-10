import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProjectById, fetchResourcesByProject, fetchStages, fetchStageHistory, updateProjectStatus, skipToStage } from '../services/api';
import ProgressTimeline from './ProgressTimeline';
import { ArrowLeft, Users, Calendar, Activity, ChevronRight, DollarSign, AlertCircle } from 'lucide-react';

const ProjectDetails = () => {
    const { recordId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [project, setProject] = useState(null);
    const [team, setTeam] = useState([]);
    const [stages, setStages] = useState([]);
    const [history, setHistory] = useState([]);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [statusFormData, setStatusFormData] = useState({
        deal_status: '',
        execution_status: ''
    });
    const [statusError, setStatusError] = useState(null);
    const [statusSaving, setStatusSaving] = useState(false);

    // Controlled Stage Skip States
    const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
    const [selectedTargetStage, setSelectedTargetStage] = useState('');
    const [nextStageExpectedDate, setNextStageExpectedDate] = useState('');
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const [skippingInProgress, setSkippingInProgress] = useState(false);
    const [skipError, setSkipError] = useState(null);

    useEffect(() => {
        const getProjectDetails = async () => {
            try {
                setLoading(true);
                const [projectData, teamData, stagesData, historyData] = await Promise.all([
                    fetchProjectById(recordId),
                    fetchResourcesByProject(recordId),
                    fetchStages(),
                    fetchStageHistory(recordId)
                ]);

                if (!projectData) throw new Error('Project record not found');

                setProject(projectData);
                setTeam(teamData);
                setStages(stagesData);
                setHistory(historyData);
                setStatusFormData({
                    deal_status: projectData.deal_status || 'Open',
                    execution_status: projectData.execution_status || 'Planning'
                });
                setLoading(false);
            } catch (err) {
                console.error('Error fetching project details:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (recordId) getProjectDetails();
    }, [recordId]);

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        const num = parseFloat(value.toString().replace(/[^0-9.-]+/g, ""));
        return isNaN(num) ? '₹0' : new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
        }).format(num);
    };

    const handleEditStatus = () => {
        setIsEditingStatus(true);
        setStatusError(null);
    };

    const handleCancelStatusEdit = () => {
        setIsEditingStatus(false);
        setStatusFormData({
            deal_status: project.deal_status || 'Open',
            execution_status: project.execution_status || 'Planning'
        });
        setStatusError(null);
    };

    const handleStatusChange = (e) => {
        const { name, value } = e.target;
        setStatusFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveStatus = async () => {
        setStatusSaving(true);
        setStatusError(null);

        try {
            const updatedProject = await updateProjectStatus(recordId, statusFormData);
            setProject(updatedProject);
            setIsEditingStatus(false);
        } catch (err) {
            setStatusError(err.message || 'Failed to update status');
        } finally {
            setStatusSaving(false);
        }
    };

    const isProjectReadOnly = () => {
        return project && (project.deal_status === 'Lost' || project.deal_status === 'Closed');
    };

    // Stage Skip Handlers
    const handleOpenSkipModal = () => {
        setIsSkipModalOpen(true);
        setSelectedTargetStage('');
        setNextStageExpectedDate('');
        setShowSkipConfirmation(false);
        setSkipError(null);
    };

    const handleCloseSkipModal = () => {
        if (!skippingInProgress) {
            setIsSkipModalOpen(false);
        }
    };

    const handleProceedToConfirmation = () => {
        if (!selectedTargetStage) return;

        // Check if any stages are being skipped
        const currentOrder = stages.find(s => s.stage_name === project.current_stage_name)?.stage_order || 0;
        const targetOrder = stages.find(s => s.stage_name === selectedTargetStage)?.stage_order || 0;

        if (targetOrder > currentOrder + 1) {
            setShowSkipConfirmation(true);
        } else {
            handleConfirmSkip();
        }
    };

    const handleConfirmSkip = async () => {
        setSkippingInProgress(true);
        setSkipError(null);
        try {
            const updatedProject = await skipToStage(recordId, selectedTargetStage, nextStageExpectedDate);

            // Refresh data
            const [historyData] = await Promise.all([
                fetchStageHistory(recordId)
            ]);

            setProject(updatedProject);
            setHistory(historyData);
            setIsSkipModalOpen(false);
        } catch (err) {
            setSkipError(err.message || 'Failed to move stage');
        } finally {
            setSkippingInProgress(false);
        }
    };

    const getAvailableNextStages = () => {
        if (!project || !stages.length) return [];
        const currentOrder = stages.find(s => s.stage_name === project.current_stage_name)?.stage_order || 0;
        return stages
            .filter(s => s.stage_order > currentOrder)
            .sort((a, b) => a.stage_order - b.stage_order);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p style={{ marginTop: '1.5rem', color: '#64748b', fontWeight: 600 }}>Loading Project Details...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="error-container">
                <h2 style={{ color: '#ef4444' }}>Error</h2>
                <p>{error || 'Project data not found.'}</p>
                <button onClick={() => navigate('/dashboard')} className="back-link" style={{ margin: '2rem auto' }}>
                    <ArrowLeft size={18} /> Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="project-details-container premium-layout">
            {/* Back Navigation */}
            <nav className="details-navbar">
                <button onClick={() => navigate('/dashboard')} className="back-link">
                    <ArrowLeft size={18} />
                    <span>Back to Dashboard</span>
                </button>
            </nav>

            {/* SINGLE MAIN CARD - Everything inside */}
            <div className="main-details-card">

                {/* 1. Project Header - Name and Owner FIRST */}
                <div className="project-header-section">
                    <h1 className="project-main-title">{project.client_name}</h1>
                    <div className="owner-badge-inline">
                        <Users size={16} />
                        <span className="owner-text">Lead Owner: <strong>{project.project_owner_name}</strong></span>
                    </div>
                </div>

                {/* Divider */}
                <div className="section-divider"></div>

                {/* 2. Progress Bar Section */}
                <div className="progress-bar-section">
                    <h3 className="section-heading">
                        <Activity size={16} />
                        Progress Journey
                    </h3>
                    <ProgressTimeline project={project} stages={stages} history={history} />
                </div>

                {/* Divider */}
                <div className="section-divider"></div>

                {/* 3. Stats Grid */}
                <div className="stats-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="section-heading">
                            <Activity size={16} />
                            Key Metrics
                        </h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!isEditingStatus && (
                                <button
                                    onClick={handleOpenSkipModal}
                                    disabled={isProjectReadOnly()}
                                    style={{
                                        padding: '8px 16px',
                                        background: isProjectReadOnly() ? '#e2e8f0' : '#f1f5f9',
                                        color: isProjectReadOnly() ? '#94a3b8' : '#475569',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: isProjectReadOnly() ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Move to Next Stage
                                </button>
                            )}
                            {!isEditingStatus && (
                                <button
                                    onClick={handleEditStatus}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Edit Status
                                </button>
                            )}
                        </div>
                    </div>

                    {statusError && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '12px',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '14px'
                        }}>
                            {statusError}
                        </div>
                    )}

                    <div className="stats-grid-inline">
                        <div className="stat-item-inline">
                            <div className="stat-icon-inline" style={{ background: '#dbeafe' }}>
                                <Activity size={18} style={{ color: '#1e40af' }} />
                            </div>
                            <div className="stat-details">
                                <span className="stat-label-inline">Current Stage</span>
                                <span className="stat-value-inline">{project.current_stage_name}</span>
                            </div>
                        </div>

                        <div className="stat-item-inline">
                            <div className="stat-icon-inline" style={{ background: '#d1fae5' }}>
                                <DollarSign size={18} style={{ color: '#065f46' }} />
                            </div>
                            <div className="stat-details">
                                <span className="stat-label-inline">Deal Value</span>
                                <span className="stat-value-inline">{formatCurrency(project.deal_value)}</span>
                            </div>
                        </div>

                        <div className="stat-item-inline">
                            <div className="stat-icon-inline" style={{ background: '#fef3c7' }}>
                                <Calendar size={18} style={{ color: '#92400e' }} />
                            </div>
                            <div className="stat-details">
                                <span className="stat-label-inline">Deal Status</span>
                                {isEditingStatus ? (
                                    <select
                                        name="deal_status"
                                        value={statusFormData.deal_status}
                                        onChange={handleStatusChange}
                                        style={{
                                            padding: '6px 12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            background: 'white'
                                        }}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="Won">Won</option>
                                        <option value="Lost">Lost</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                ) : (
                                    <span className="stat-value-inline">{project.deal_status}</span>
                                )}
                            </div>
                        </div>

                        <div className="stat-item-inline">
                            <div className="stat-icon-inline" style={{ background: '#e0e7ff' }}>
                                <ChevronRight size={18} style={{ color: '#4338ca' }} />
                            </div>
                            <div className="stat-details">
                                <span className="stat-label-inline">Execution Status</span>
                                {isEditingStatus ? (
                                    <select
                                        name="execution_status"
                                        value={statusFormData.execution_status}
                                        onChange={handleStatusChange}
                                        style={{
                                            padding: '6px 12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            background: 'white'
                                        }}
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                ) : (
                                    <span className="stat-value-inline">{project.execution_status}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {isEditingStatus && (
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginTop: '1rem',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={handleCancelStatusEdit}
                                disabled={statusSaving}
                                style={{
                                    padding: '8px 20px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveStatus}
                                disabled={statusSaving}
                                style={{
                                    padding: '8px 20px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    opacity: statusSaving ? 0.6 : 1
                                }}
                            >
                                {statusSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {isProjectReadOnly() && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '12px',
                            background: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#92400e'
                        }}>
                            ⚠️ This project is read-only because the deal status is set to "{project.deal_status}". Stage movement is disabled.
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="section-divider"></div>

                {/* 4. Details Grid */}
                <div className="details-section">
                    <div className="details-row">
                        {/* Project Info */}
                        <div className="info-column">
                            <h3 className="section-heading">
                                <Calendar size={16} />
                                Project Info
                            </h3>
                            <div className="info-list-inline">
                                <div className="info-row-inline">
                                    <span className="info-label-inline">Start Date</span>
                                    <span className="info-value-inline">{project.project_started_date || 'N/A'}</span>
                                </div>
                                <div className="info-row-inline">
                                    <span className="info-label-inline">Next Stage</span>
                                    <span className="info-value-inline">{project.next_stage_name || 'N/A'}</span>
                                </div>
                                <div className="info-row-inline">
                                    <span className="info-label-inline">Expected Date</span>
                                    <span className="info-value-inline">{project.next_stage_expected_date || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Team Section */}
                        <div className="team-column">
                            <h3 className="section-heading">
                                <Users size={16} />
                                Project Team
                            </h3>
                            <div className="team-grid-inline">
                                {team.length > 0 ? team.map((member, idx) => (
                                    <div key={idx} className="team-member-inline">
                                        <div className="member-avatar-inline">{member.resource_name?.charAt(0)}</div>
                                        <div className="member-details">
                                            <span className="member-name-inline">{member.resource_name}</span>
                                            <span className="member-role-inline">{member.role}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-state-inline">No team members assigned.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stage Skip Modal */}
            {isSkipModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '32px',
                        borderRadius: '16px',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        {!showSkipConfirmation ? (
                            <>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Move to Stage</h2>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                                    Current Stage: <strong style={{ color: '#1e293b' }}>{project.current_stage_name}</strong>
                                </p>

                                {skipError && (
                                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                                        {skipError}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Select Next Stage:</p>
                                    {getAvailableNextStages().map(stage => (
                                        <label key={stage.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            border: '2px solid',
                                            borderColor: selectedTargetStage === stage.stage_name ? '#6366f1' : '#f1f5f9',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            background: selectedTargetStage === stage.stage_name ? '#f5f7ff' : 'white'
                                        }}>
                                            <input
                                                type="radio"
                                                name="targetStage"
                                                value={stage.stage_name}
                                                checked={selectedTargetStage === stage.stage_name}
                                                onChange={(e) => setSelectedTargetStage(e.target.value)}
                                                style={{ marginRight: '12px', width: '18px', height: '18px' }}
                                            />
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>{stage.stage_name}</span>
                                        </label>
                                    ))}
                                    {getAvailableNextStages().length === 0 && (
                                        <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            Project is already at the final stage.
                                        </p>
                                    )}
                                </div>

                                {/* Next Stage Expected Date Input */}
                                <div style={{ marginBottom: '24px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Expected Date for Selected Stage:</p>
                                    <input
                                        type="date"
                                        value={nextStageExpectedDate}
                                        onChange={(e) => setNextStageExpectedDate(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #f1f5f9',
                                            borderRadius: '10px',
                                            fontSize: '0.95rem',
                                            color: '#1e293b'
                                        }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleCloseSkipModal}
                                        style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleProceedToConfirmation}
                                        disabled={!selectedTargetStage || !nextStageExpectedDate}
                                        style={{
                                            padding: '10px 24px',
                                            background: (!selectedTargetStage || !nextStageExpectedDate) ? '#e2e8f0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            cursor: (!selectedTargetStage || !nextStageExpectedDate) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    backgroundColor: '#fffbeb',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    color: '#f59e0b'
                                }}>
                                    <AlertCircle size={32} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>Confirm Stage Skip</h2>
                                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
                                    Stages between <strong>{project.current_stage_name}</strong> and <strong>{selectedTargetStage}</strong> will be skipped.
                                    <br />
                                    This action will be logged as 'Skipped'. Do you want to continue?
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setShowSkipConfirmation(false)}
                                        disabled={skippingInProgress}
                                        style={{ padding: '10px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmSkip}
                                        disabled={skippingInProgress}
                                        style={{
                                            padding: '10px 24px',
                                            background: '#f59e0b',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            cursor: skippingInProgress ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {skippingInProgress ? 'Processing...' : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;

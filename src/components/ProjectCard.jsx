import { useNavigate } from 'react-router-dom';

const formatCurrency = (value) => {
    if (!value) return '₹0';
    const num = parseFloat(value.toString().replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
};

const ProjectCard = ({ project, stageName, currentUser }) => {
    const navigate = useNavigate();
    const {
        record_id,
        client_name = 'Unknown Client',
        project_owner_name = 'No Owner',
        deal_value = 0,
        deal_type = 'Project',
        project_category,
        next_stage_name,
        next_stage_expected_date
    } = project;

    // Check if this project belongs to the current user
    const isOwnedByUser = currentUser && project_owner_name === currentUser.full_name;

    // Helper to get stage-specific class
    const getStageClass = (name) => {
        if (!name) return '';
        return `stage-${String(name).toLowerCase().trim().replace(/[^a-z0-9]/g, '-')}`;
    };

    return (
        <div className="project-card-container">
            <div
                className={`project-card ${getStageClass(stageName)}`}
                onClick={() => navigate(`/project/${record_id}`)}
            >
                {/* Always Visible - Simplified Info */}
                <div className="card-simple-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 className="project-name" style={{ margin: 0 }}>{client_name}</h3>
                        {isOwnedByUser && (
                            <div
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    boxShadow: '0 0 8px #10b981',
                                    animation: 'pulse 2s ease-in-out infinite',
                                    flexShrink: 0
                                }}
                                title="You own this project"
                            ></div>
                        )}
                    </div>

                    <div className="project-owner">
                        <div className="owner-avatar">{project_owner_name.charAt(0)}</div>
                        <span>{project_owner_name}</span>
                    </div>

                    {project_category && (
                        <div style={{
                            fontSize: '0.65rem',
                            color: '#6366f1',
                            background: '#eef2ff',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            width: 'fit-content',
                            marginTop: '2px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            border: '1px solid #e0e7ff'
                        }}>
                            {project_category}
                        </div>
                    )}

                    <div className="card-details">
                        <div className="detail-item">
                            <p className="detail-label">Potential Value</p>
                            <p className="detail-value budget">{formatCurrency(deal_value)}</p>
                        </div>
                    </div>
                </div>

                {/* Expanded Details - Content inside the same card */}
                <div className="card-expanded-content">
                    <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span className="detail-label" style={{ margin: 0 }}>{deal_type}</span>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                boxShadow: '0 0 8px var(--primary)'
                            }}></div>
                        </div>
                    </div>

                    {next_stage_name && (
                        <div className="next-step">
                            <span className="next-step-title">Next Stage</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <p className="milestone-name">{next_stage_name}</p>
                                {next_stage_expected_date && (
                                    <p className="detail-label" style={{ margin: 0, fontSize: '0.65rem', opacity: 0.8 }}>
                                        {next_stage_expected_date}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;

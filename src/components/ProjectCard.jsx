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

const ProjectCard = ({ project, stageName }) => {
    const navigate = useNavigate();
    const {
        record_id,
        client_name = 'Unknown Client',
        project_owner_name = 'No Owner',
        deal_value = 0,
        deal_type = 'Project',
        next_stage_name,
        next_stage_expected_date
    } = project;

    // Helper to get stage-specific class
    const getStageClass = (name) => {
        if (!name) return '';
        return `stage-${String(name).toLowerCase().trim().replace(/[^a-z0-9]/g, '-')}`;
    };

    return (
        <div
            className={`project-card ${getStageClass(stageName)}`}
            onClick={() => navigate(`/project/${record_id}`)}
        >
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
                <h3 className="project-name">{client_name}</h3>
            </div>

            <div className="project-owner">
                <div className="owner-avatar">{project_owner_name.charAt(0)}</div>
                <span>{project_owner_name}</span>
            </div>

            <div className="card-details">
                <div className="detail-item">
                    <p className="detail-label">Deal Value</p>
                    <p className="detail-value budget">{formatCurrency(deal_value)}</p>
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
    );
};

export default ProjectCard;

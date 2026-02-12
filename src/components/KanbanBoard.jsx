import React, { useState } from 'react';
import ProjectCard from './ProjectCard';

const KanbanBoard = ({ projects, stages, currentUser }) => {
    const [hoveredStage, setHoveredStage] = useState(null);
    // 1. Filter and Deduplicate
    // Include both 'Project' and 'Pilot' deal_types for the dashboard
    const projectOnlyDeals = projects.filter(p => {
        const type = String(p.deal_type || '').toLowerCase().trim();
        return type === 'project' || type === 'pilot';
    });

    const filteredProjects = projectOnlyDeals;

    // 2. Group projects with normalized keys
    const groupedProjects = {};
    filteredProjects.forEach(proj => {
        const stageName = String(proj.current_stage_name || 'Unassigned').trim();
        const key = stageName.toLowerCase();
        if (!groupedProjects[key]) groupedProjects[key] = { name: stageName, items: [] };
        groupedProjects[key].items.push(proj);
    });

    // 3. Create a master list of stages for display
    let displayStages = stages.map(s => ({
        name: String(s.stage_name || '').trim(),
        key: String(s.stage_name || '').trim().toLowerCase(),
        order: parseInt(s.stage_order || 99)
    }));

    // Add projects that aren't in the master stages list
    Object.keys(groupedProjects).forEach(key => {
        if (!displayStages.find(s => s.key === key)) {
            displayStages.push({
                name: groupedProjects[key].name,
                key: key,
                order: 99
            });
        }
    });

    displayStages.sort((a, b) => a.order - b.order);

    if (filteredProjects.length === 0) {
        return (
            <div className="section-card" style={{ textAlign: 'center', padding: '5rem' }}>
                <h2 style={{ color: 'var(--text-muted)' }}>No Projects Identified</h2>
                <p style={{ color: 'var(--text-light)' }}>The current pipeline is empty or filtered by criteria.</p>
            </div>
        );
    }

    return (
        <div className="dashboard-grid">
            {displayStages.map((stage) => {
                const projectsInStage = groupedProjects[stage.key]?.items || [];

                // Only show columns that have projects
                if (projectsInStage.length === 0) return null;

                return (
                    <div
                        key={stage.key}
                        className={`stage-column stage-${stage.key.replace(/[^a-z0-9]/g, '-')} ${hoveredStage === stage.key ? 'stage-expanded' : ''
                            } ${hoveredStage && hoveredStage !== stage.key ? 'stage-faded' : ''
                            }`}
                        onMouseEnter={() => setHoveredStage(stage.key)}
                        onMouseLeave={() => setHoveredStage(null)}
                    >
                        <div className="column-header">
                            <div className="column-title">{stage.name}</div>
                            <span className="column-badge">{projectsInStage.length}</span>
                        </div>
                        <div className="column-content">
                            {projectsInStage.map((project, idx) => (
                                <ProjectCard
                                    key={`${project.record_id || idx}`}
                                    project={project}
                                    stageName={stage.name}
                                    currentUser={currentUser}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KanbanBoard;

import React, { useState } from 'react';

const ProgressTimeline = ({ project, stages, history = [] }) => {
    const [hoveredStage, setHoveredStage] = useState(null);

    // ================================
    // CORE LOGIC
    // ================================

    // Get current stage order
    const currentStageOrder = stages.find(s =>
        String(s.stage_name).toLowerCase().trim() === String(project.current_stage_name).toLowerCase().trim()
    )?.stage_order || 0;

    // 1. Get all stages from history and join with Stage_Master
    const rawStagesWithHistory = history
        .map(h => {
            const masterStage = stages.find(s =>
                String(s.stage_name).toLowerCase().trim() === String(h.stage_name).toLowerCase().trim()
            );
            return {
                ...h,
                stage_order: masterStage ? parseInt(masterStage.stage_order || 0) : 999
            };
        });

    // Deduplicate history by stage_name to prevent double entries
    const deduplicatedMap = {};
    rawStagesWithHistory.forEach(h => {
        const name = h.stage_name;
        // Priority: In Progress > Completed > Skipped
        const statusPriority = { 'In Progress': 3, 'Completed': 2, 'Skipped': 1 };
        const currentPrio = statusPriority[deduplicatedMap[name]?.stage_status] || 0;
        const newPrio = statusPriority[h.stage_status] || 0;

        if (!deduplicatedMap[name] || newPrio > currentPrio) {
            deduplicatedMap[name] = h;
        }
    });

    const stagesWithHistory = Object.values(deduplicatedMap)
        .sort((a, b) => a.stage_order - b.stage_order);

    // 2. Filter to show only completed stages (stage_order < current) and current stage
    const completedStages = stagesWithHistory.filter(h =>
        h.stage_order <= currentStageOrder
    );

    // ================================
    // COLOR LOGIC (Based on Status)
    // ================================
    const getStageColor = (stage, isCurrent) => {
        const status = stage.stage_status;

        if (status === 'Skipped') {
            // Grey for skipped
            return { bg: '#f1f5f9', text: '#94a3b8', border: '#e2e8f0' };
        }

        if (status === 'In Progress' || (isCurrent && status !== 'Completed')) {
            // Blue for current/in-progress
            return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
        }

        // Green for completed (default)
        return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' };
    };

    // ================================
    // RENDER
    // ================================

    if (completedStages.length === 0) {
        return (
            <div className="solid-progress-empty">
                <p>No stages to display. Progress will appear as the project progresses.</p>
            </div>
        );
    }

    return (
        <div className="solid-progress-container">
            {/* Horizontal Solid Progress Bar */}
            <div className="solid-progress-bar">
                {completedStages.map((stage, index) => {
                    const isCurrentStage = stage.stage_order === currentStageOrder;
                    const colors = getStageColor(stage, isCurrentStage);
                    const isHovered = hoveredStage === index;
                    const hasDate = stage.stage_end_date && stage.stage_end_date.trim() !== '';

                    return (
                        <div
                            key={`${stage.stage_name}-${index}`}
                            className={`progress-segment ${isHovered ? 'hovered' : ''}`}
                            style={{
                                flex: 1,
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderLeft: index > 0 ? `2px solid ${colors.border}` : 'none',
                            }}
                            onMouseEnter={() => setHoveredStage(index)}
                            onMouseLeave={() => setHoveredStage(null)}
                        >
                            <div className="segment-content">
                                <span className="stage-name">{stage.stage_name}</span>
                                <span className="stage-date">
                                    {stage.stage_status === 'Skipped'
                                        ? 'Skipped'
                                        : (hasDate ? stage.stage_end_date : (isCurrentStage ? 'In Progress' : 'Completed'))
                                    }
                                </span>
                            </div>

                            {/* Tooltip on Hover */}
                            {isHovered && (
                                <div className="stage-tooltip">
                                    <div className="tooltip-header">{stage.stage_name}</div>
                                    <div className="tooltip-row">
                                        <span className="tooltip-label">Status:</span>
                                        <span className="tooltip-value" style={{ fontWeight: 700 }}>
                                            {stage.stage_status || (isCurrentStage ? 'In Progress' : 'Completed')}
                                        </span>
                                    </div>
                                    {stage.stage_status !== 'Skipped' && (
                                        <>
                                            <div className="tooltip-row">
                                                <span className="tooltip-label">Started on:</span>
                                                <span className="tooltip-value">
                                                    {stage.stage_start_date && stage.stage_start_date.trim() !== ''
                                                        ? stage.stage_start_date
                                                        : 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="tooltip-row">
                                                <span className="tooltip-label">Ended on:</span>
                                                <span className="tooltip-value">
                                                    {hasDate
                                                        ? stage.stage_end_date
                                                        : (isCurrentStage ? 'In Progress' : 'Unknown')}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgressTimeline;

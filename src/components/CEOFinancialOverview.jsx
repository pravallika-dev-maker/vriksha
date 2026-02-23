import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseConfig';
import { fetchProjects } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Building2, TrendingUp, TrendingDown, DollarSign, Users, Briefcase, Plus, X, ArrowLeft } from 'lucide-react';
import './CEOFinancialOverview.css';

const CEOFinancialOverview = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [financials, setFinancials] = useState([]);
    const [costs, setCosts] = useState([]);

    // Modal state
    const [showRevModal, setShowRevModal] = useState(false);
    const [showCostModal, setShowCostModal] = useState(false);
    const [hoveredMonth, setHoveredMonth] = useState(null);

    // Timeline configuration (next 12 months including current)
    const generateMonths = () => {
        const months = [];
        const date = new Date();
        date.setDate(1); // Set to 1st to avoid month skipping issues
        for (let i = 0; i < 12; i++) {
            months.push({
                label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
                value: new Date(date),
                year: date.getFullYear(),
                monthIndex: date.getMonth(),
            });
            date.setMonth(date.getMonth() + 1);
        }
        return months;
    };

    const [timelineMonths] = useState(generateMonths());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch projects
            const projs = await fetchProjects();
            setProjects(projs);

            // 2. Consolidated Financials Logic
            // We include ALL projects, but we apply the ownership rules strictly.
            const { data: finData, error: finErr } = await supabase
                .from('project_financials')
                .select('*');

            if (finErr) throw finErr;

            const consolidatedFinancials = projs
                .filter(p => {
                    if (p.deal_status === 'Lost' || p.deal_status === 'Cancelled' || !p.project_started_date) return false;
                    const d = new Date(p.project_started_date);
                    return !isNaN(d.getTime());
                })
                .map(p => {
                    // Check if there is an explicit financial record for this project
                    const explicitFin = finData?.find(f => String(f.project_id) === String(p.record_id) || String(f.project_id) === String(p.id));

                    if (explicitFin) {
                        return explicitFin; // Use billing_owner and exact amount from project_financials
                    } else {
                        // Fallback: calculate from project data but HIDE project_owner
                        const years = p.contract_years || 1;
                        const start = new Date(p.project_started_date);
                        const end = new Date(start);
                        end.setMonth(end.getMonth() + Math.round(years * 12));

                        return {
                            project_id: p.record_id || p.id,
                            project_category: p.project_category || 'Services',
                            monthly_billing_amount: p.deal_value / (years * 12),
                            billing_owner: 'Owner Not Assigned (Finance)', // RULE: NEVER USE project_owner
                            billing_start_date: p.project_started_date,
                            billing_end_date: end.toISOString().split('T')[0]
                        };
                    }
                });

            setFinancials(consolidatedFinancials);

            // 3. Fetch costs
            const { data: costData, error: costErr } = await supabase
                .from('cost_items')
                .select('*');

            if (costErr) throw costErr;
            setCosts(costData || []);

        } catch (error) {
            console.error('Error fetching financial data:', error);
            // Optionally set error state or show notification
        }
        setLoading(false);
    };

    const isMonthInRange = (monthObj, startStr, endStr) => {
        const startDate = new Date(startStr);
        startDate.setDate(1); // align to start of month
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(endStr);
        // Set to end of month
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        const checkDate = new Date(monthObj.year, monthObj.monthIndex, 15); // middle of month

        return checkDate >= startDate && checkDate <= endDate;
    };

    const getMonthStats = (monthObj) => {
        // Calculate Revenue
        const monthFinancials = financials.filter(f => isMonthInRange(monthObj, f.billing_start_date, f.billing_end_date));
        const totalRevenue = monthFinancials.reduce((sum, f) => sum + Number(f.monthly_billing_amount), 0);

        // Group by project_category
        const revenueByCategory = {};
        monthFinancials.forEach(f => {
            let cat = f.project_category || 'Services';
            if (cat === 'Products') cat = 'Product'; // Normalize naming
            revenueByCategory[cat] = (revenueByCategory[cat] || 0) + Number(f.monthly_billing_amount);
        });

        // Calculate Cost
        const monthCosts = costs.filter(c => isMonthInRange(monthObj, c.start_date, c.end_date));
        const totalCost = monthCosts.reduce((sum, c) => sum + Number(c.monthly_amount), 0);

        // Group by cost_category + owner for summary
        const costByGroup = {};
        monthCosts.forEach(c => {
            const groupKey = `${c.cost_category} — ${c.owner_name}`;
            costByGroup[groupKey] = (costByGroup[groupKey] || 0) + Number(c.monthly_amount);
        });

        // Group by cost_category (for other logic if needed)
        const costByCategory = {};
        monthCosts.forEach(c => {
            costByCategory[c.cost_category] = (costByCategory[c.cost_category] || 0) + Number(c.monthly_amount);
        });

        return {
            totalRevenue,
            totalCost,
            pnl: totalRevenue - totalCost,
            revenueByCategory,
            costByCategory,
            costByGroup,
            monthFinancials,
            monthCosts
        };
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const handleAddRevenue = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const newRecord = {
            project_id: formData.get('project_id'),
            project_category: formData.get('project_category'),
            monthly_billing_amount: Number(formData.get('monthly_billing_amount')),
            billing_owner: formData.get('billing_owner'),
            billing_start_date: formData.get('billing_start_date'),
            billing_end_date: formData.get('billing_end_date'),
        };

        const { error } = await supabase.from('project_financials').insert([newRecord]);
        if (!error) {
            setShowRevModal(false);
            fetchData();
            alert('Revenue mapping saved!');
        } else {
            console.error('Insert error', error);
            alert('Error mapping revenue. Check console.');
        }
    };

    const handleAddCost = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const newRecord = {
            cost_name: formData.get('cost_name'),
            cost_category: formData.get('cost_category'),
            monthly_amount: Number(formData.get('monthly_amount')),
            owner_name: formData.get('owner_name'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
        };

        const { error } = await supabase.from('cost_items').insert([newRecord]);
        if (!error) {
            setShowCostModal(false);
            fetchData();
            alert('Cost item added automatically!');
        } else {
            console.error('Insert error', error);
            alert('Error creating record. Check console.');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading Financial Data...</p>
            </div>
        );
    }

    // Prepare active revenue list for current timeframe 
    // We can show ALL active project financials across the timeline
    const activeProjectsBreakdown = financials.map(f => {
        const proj = projects.find(p => String(p.record_id) === String(f.project_id) || String(p.id) === String(f.project_id));
        return {
            ...f,
            projectName: proj ? proj.client_name || `Project #${f.project_id}` : `Project #${f.project_id}`
        };
    });

    const categoryRevenueTotals = {
        'Services': 0,
        'Marketing': 0,
        'Product': 0
    };
    const activeProjectsByCategory = {
        'Services': 0,
        'Marketing': 0,
        'Product': 0
    };
    activeProjectsBreakdown.forEach(f => {
        let cat = f.project_category || 'Services';
        if (cat === 'Products') cat = 'Product'; // Normalize naming

        if (categoryRevenueTotals[cat] !== undefined) {
            categoryRevenueTotals[cat] += Number(f.monthly_billing_amount);
            activeProjectsByCategory[cat] += 1;
        } else {
            categoryRevenueTotals[cat] = Number(f.monthly_billing_amount);
            activeProjectsByCategory[cat] = 1;
        }
    });

    return (
        <div className="ceo-dashboard-container">
            <header className="ceo-header-card">
                <div className="ceo-header-title">
                    <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', padding: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1>CEO Financial Overview</h1>
                    <p>Executive Consolidated PNL & Projections</p>
                </div>
                <div className="ceo-actions-container">
                    <button className="ceo-action-btn ceo-action-cost" onClick={() => setShowCostModal(true)}>
                        <Plus size={18} /> Add Cost Center
                    </button>
                </div>
            </header>

            {/* MONTHLY TIMELINE VIEW */}
            <h2 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem' }}>Monthly Consolidation Timeline</h2>
            <div className="timeline-card">
                <div className="timeline-container">
                    {timelineMonths.map((m, idx) => {
                        const stats = getMonthStats(m);
                        return (
                            <div
                                className={`timeline-month ${hoveredMonth && hoveredMonth.label === m.label ? 'active' : ''}`}
                                key={idx}
                                onMouseEnter={() => setHoveredMonth(m)}
                            >
                                <h3>{m.label}</h3>

                                <div className="timeline-metric">
                                    <span style={{ color: '#64748b' }}>Revenue</span>
                                    <span className="metric-revenue">{formatCurrency(stats.totalRevenue)}</span>
                                </div>
                                <div className="timeline-metric">
                                    <span style={{ color: '#64748b' }}>Costs</span>
                                    <span className="metric-cost">{formatCurrency(stats.totalCost)}</span>
                                </div>
                                <div className={`timeline-metric metric-pnl ${stats.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                                    <span>Net PNL</span>
                                    <span>{formatCurrency(stats.pnl)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FLOATING CENTER BREAKDOWN POPUP */}
            {hoveredMonth && (() => {
                const stats = getMonthStats(hoveredMonth);
                return (
                    <div className="center-popup-overlay" onClick={() => setHoveredMonth(null)}>
                        <div
                            className="month-tooltip-area center-popup premium-executive-card"
                            onClick={(e) => e.stopPropagation()}
                            onMouseLeave={() => setHoveredMonth(null)}
                        >
                            {/* SECTION 1 — HEADER */}
                            <div className="popup-header">
                                <h3>Financial Breakdown — {hoveredMonth.label}</h3>
                            </div>

                            {/* SECTION 2 — KPI SUMMARY STRIP */}
                            <div className="kpi-summary-strip">
                                <div className="kpi-metric">
                                    <span>REVENUE</span>
                                    <strong className="revenue-text">{formatCurrency(stats.totalRevenue)}</strong>
                                </div>
                                <div className="kpi-metric">
                                    <span>COSTS</span>
                                    <strong className="cost-text">{formatCurrency(stats.totalCost)}</strong>
                                </div>
                                <div className="kpi-metric">
                                    <span>NET PNL</span>
                                    <strong className={stats.pnl >= 0 ? 'pnl-positive-bold' : 'pnl-negative-bold'}>
                                        {formatCurrency(stats.pnl)}
                                    </strong>
                                </div>
                            </div>

                            <div className="main-content-split">
                                {/* PANEL: REVENUE AGGREGATED */}
                                <div className="content-panel left-panel">
                                    <h4 className="panel-title">REVENUE AGGREGATED</h4>
                                    <div className="revenue-list">
                                        {Object.entries(stats.revenueByCategory).map(([cat, amount], i) => (
                                            <div className="row-item" key={i}>
                                                <span className="row-label">{cat}</span>
                                                <span className="row-value revenue-text">+{formatCurrency(amount)}</span>
                                            </div>
                                        ))}
                                        {Object.keys(stats.revenueByCategory).length === 0 && <div className="empty-state">No revenue data</div>}
                                    </div>
                                </div>

                                {/* PANEL: MONTHLY PROJECTS */}
                                <div className="content-panel right-panel">
                                    <h4 className="panel-title">MONTHLY PROJECTS</h4>
                                    <div className="projects-scroll-list">
                                        {stats.monthFinancials.length > 0 ? (
                                            [...stats.monthFinancials]
                                                .sort((a, b) => b.monthly_billing_amount - a.monthly_billing_amount)
                                                .map((f, i) => {
                                                    const proj = projects.find(p => String(p.record_id) === String(f.project_id) || String(p.id) === String(f.project_id));
                                                    return (
                                                        <div className="row-item-detailed" key={i}>
                                                            <div className="item-info">
                                                                <span className="row-label-primary">{proj?.client_name || 'Project'}</span>
                                                                <span className="row-label-secondary">Billing: {f.billing_owner}</span>
                                                            </div>
                                                            <span className="row-value revenue-text">+{formatCurrency(f.monthly_billing_amount)}</span>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <div className="empty-state">No active projects</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4 — COST BREAKDOWNS (FULL WIDTH) */}
                            <div className="costs-section">
                                <h4 className="panel-title">COST BREAKDOWNS</h4>
                                <div className="costs-table-wrapper">
                                    {stats.monthCosts.length > 0 ? (
                                        <table className="costs-table">
                                            <thead>
                                                <tr>
                                                    <th>Cost Item</th>
                                                    <th>Category</th>
                                                    <th>Owner</th>
                                                    <th className="col-amount">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.monthCosts.map((c, i) => (
                                                    <tr key={i}>
                                                        <td>{c.cost_name}</td>
                                                        <td>{c.cost_category}</td>
                                                        <td>{c.owner_name}</td>
                                                        <td className="col-amount cost-text">-{formatCurrency(c.monthly_amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="empty-state">No external costs recorded for this month.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <div className="sections-grid">
                {/* CATEGORY REVENUE BREAKDOWN */}
                <div className="section-card">
                    <h2><Briefcase size={20} color="#3b82f6" /> Category Revenue Monthly</h2>
                    <div className="breakdown-list">
                        {Object.keys(categoryRevenueTotals).length > 0 ? Object.entries(categoryRevenueTotals).map(([cat, amount], idx) => (
                            <div className="breakdown-item" key={idx}>
                                <div className="breakdown-header">
                                    <span className="breakdown-name">{cat}</span>
                                    <span className="breakdown-amount metric-revenue">+{formatCurrency(amount)}/mo</span>
                                </div>
                                <div className="breakdown-meta">
                                    <span className="category-badge">{cat}</span>
                                    <span>{activeProjectsByCategory[cat]} Active Projects</span>
                                </div>
                            </div>
                        )) : (
                            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No active categories.</p>
                        )}
                    </div>
                </div>

                {/* PROJECT REVENUE BREAKDOWN */}
                <div className="section-card">
                    <h2><TrendingUp size={20} color="#10b981" /> Project Revenue Breakdown</h2>
                    <div className="breakdown-list scrollable-breakdown">
                        {activeProjectsBreakdown.length > 0 ? activeProjectsBreakdown.map((f, idx) => (
                            <div className="breakdown-item" key={idx}>
                                <div className="breakdown-header">
                                    <span className="breakdown-name">{f.projectName}</span>
                                    <span className="breakdown-amount metric-revenue">+{formatCurrency(f.monthly_billing_amount)}/mo</span>
                                </div>
                                <div className="breakdown-meta">
                                    <span className="category-badge">{f.project_category}</span>
                                    <span>Owner: {f.billing_owner}</span>
                                </div>
                            </div>
                        )) : (
                            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No active project revenue recorded.</p>
                        )}
                    </div>
                </div>

                {/* COST CENTERS BREAKDOWN */}
                <div className="section-card">
                    <h2><TrendingDown size={20} color="#ef4444" /> Cost Centers Directory</h2>
                    <div className="breakdown-list scrollable-breakdown">
                        {costs.length > 0 ? costs.map((c, idx) => (
                            <div className="breakdown-item" key={idx}>
                                <div className="breakdown-header">
                                    <span className="breakdown-name">{c.cost_name}</span>
                                    <span className="breakdown-amount metric-cost">-{formatCurrency(c.monthly_amount)}/mo</span>
                                </div>
                                <div className="breakdown-meta">
                                    <span className="category-badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>{c.cost_category}</span>
                                    <span>Owner: {c.owner_name}</span>
                                </div>
                            </div>
                        )) : (
                            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No cost centers recorded.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {
                showRevModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Revenue Mapping — Define Billing Rule</h2>
                                <button className="close-btn" onClick={() => setShowRevModal(false)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAddRevenue}>
                                <div className="form-group">
                                    <label>Select Project</label>
                                    <select name="project_id" required>
                                        <option value="">Select a project...</option>
                                        {projects.map(p => (
                                            <option key={p.id || p.record_id} value={p.record_id || p.id}>
                                                {p.client_name} ({p.record_id || p.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Project Category</label>
                                    <select name="project_category" required>
                                        <option value="Services">Services</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Product">Product</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Monthly Billing (₹)</label>
                                    <input type="number" step="0.01" name="monthly_billing_amount" required placeholder="0.00" />
                                </div>
                                <div className="form-group">
                                    <label>Billing Owner (Finance)</label>
                                    <input type="text" name="billing_owner" required placeholder="e.g. Vijay" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Billing Start Date</label>
                                        <input type="date" name="billing_start_date" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Billing End Date</label>
                                        <input type="date" name="billing_end_date" required />
                                    </div>
                                </div>
                                <button type="submit" className="submit-btn" style={{ background: '#10b981' }}>Secure Revenue Rule</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                showCostModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Add Cost Center</h2>
                                <button className="close-btn" onClick={() => setShowCostModal(false)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAddCost}>
                                <div className="form-group">
                                    <label>Cost Name</label>
                                    <input type="text" name="cost_name" required placeholder="e.g. AWS Hosting" />
                                </div>
                                <div className="form-group">
                                    <label>Cost Category</label>
                                    <select name="cost_category" required>
                                        <option value="Salary">Salary</option>
                                        <option value="Rent">Rent</option>
                                        <option value="Tools">Tools</option>
                                        <option value="Server">Server</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Monthly Amount (₹)</label>
                                    <input type="number" step="0.01" name="monthly_amount" required placeholder="0.00" />
                                </div>
                                <div className="form-group">
                                    <label>Owner Responsible</label>
                                    <input type="text" name="owner_name" required placeholder="Jane Doe" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" name="start_date" required />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" name="end_date" required />
                                    </div>
                                </div>
                                <button type="submit" className="submit-btn" style={{ background: '#ef4444' }}>Save Cost Rule</button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CEOFinancialOverview;

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseConfig';
import {
    fetchProjects,
    fetchFinancials,
    fetchCosts,
    createFinancial,
    createCost,
    fetchFunds,
    createFund
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Building2, TrendingUp, TrendingDown, DollarSign, Users, Briefcase, Plus, X, ArrowLeft } from 'lucide-react';
import './CEOFinancialOverview.css';

const CEOFinancialOverview = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [financials, setFinancials] = useState([]);
    const [costs, setCosts] = useState([]);
    const [funds, setFunds] = useState([]);
    const [activeTab, setActiveTab] = useState('overall');

    // Modal state
    const [showRevModal, setShowRevModal] = useState(false);
    const [showCostModal, setShowCostModal] = useState(false);
    const [showFundModal, setShowFundModal] = useState(false);
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
            console.log('Initiating financial data fetch...');

            // 1. Fetch projects
            const projs = await fetchProjects();
            setProjects(projs || []);
            console.log('Fetched projects:', projs?.length || 0);

            // 2. Fetch Financials
            const finData = await fetchFinancials();
            console.log('Fetched financials:', finData?.length || 0);

            // Logic to consolidate financials
            const consolidatedFinancials = (projs || [])
                .filter(p => {
                    if (p.deal_status === 'Lost' || p.deal_status === 'Cancelled' || !p.project_started_date) return false;
                    const d = new Date(p.project_started_date);
                    return !isNaN(d.getTime());
                })
                .map(p => {
                    const explicitFin = finData?.find(f => String(f.project_id) === String(p.record_id) || String(f.project_id) === String(p.id));

                    if (explicitFin) {
                        return explicitFin;
                    } else {
                        const years = p.contract_years || 1;
                        const start = new Date(p.project_started_date);
                        const end = new Date(start);
                        end.setMonth(end.getMonth() + Math.round(years * 12));

                        return {
                            project_id: p.record_id || p.id,
                            project_category: p.project_category || 'Services',
                            monthly_billing_amount: p.deal_value / (years * 12),
                            billing_owner: 'Owner Not Assigned (Finance)',
                            billing_start_date: p.project_started_date,
                            billing_end_date: end.toISOString().split('T')[0]
                        };
                    }
                });

            setFinancials(consolidatedFinancials);

            // 3. Fetch costs
            const costData = await fetchCosts();
            setCosts(costData || []);
            console.log('Fetched costs:', costData?.length || 0);

            // 4. Fetch Funds
            const fundsData = await fetchFunds();
            setFunds(fundsData || []);
            console.log('Fetched funds:', fundsData?.length || 0);

        } catch (error) {
            console.error('CRITICAL: Financial Data Fetch Failed', error);
        } finally {
            setLoading(false);
        }
    };

    const isMonthInRange = (monthObj, startStr, endStr) => {
        const startDate = new Date(startStr);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(endStr);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        const checkDate = new Date(monthObj.year, monthObj.monthIndex, 15);
        return checkDate >= startDate && checkDate <= endDate;
    };

    const getMonthStats = (monthObj) => {
        const monthFinancials = financials.filter(f => isMonthInRange(monthObj, f.billing_start_date, f.billing_end_date));
        const totalRevenue = monthFinancials.reduce((sum, f) => sum + Number(f.monthly_billing_amount), 0);

        const revenueByCategory = {};
        monthFinancials.forEach(f => {
            let cat = f.project_category || 'Services';
            if (cat === 'Products') cat = 'Product';
            revenueByCategory[cat] = (revenueByCategory[cat] || 0) + Number(f.monthly_billing_amount);
        });

        const monthCosts = costs.filter(c => isMonthInRange(monthObj, c.start_date, c.end_date));
        const totalCost = monthCosts.reduce((sum, c) => sum + Number(c.monthly_amount), 0);

        const monthFunds = funds.filter(f => {
            if (!f.funding_date) return false;
            const fundDate = new Date(f.funding_date);
            return fundDate.getMonth() === monthObj.monthIndex && fundDate.getFullYear() === monthObj.year;
        });
        const totalFunds = monthFunds.reduce((sum, f) => sum + Number(f.amount_raised || 0), 0);

        const costByCategory = {};
        monthCosts.forEach(c => {
            costByCategory[c.cost_category] = (costByCategory[c.cost_category] || 0) + Number(c.monthly_amount);
        });

        return {
            totalRevenue,
            totalCost,
            totalFunds,
            pnl: totalRevenue - totalCost,
            revenueByCategory,
            costByCategory,
            monthFinancials,
            monthCosts,
            monthFunds
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
        try {
            await createFinancial(newRecord);
            setShowRevModal(false);
            fetchData();
        } catch (error) { console.error(error); }
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
        try {
            await createCost(newRecord);
            setShowCostModal(false);
            fetchData();
        } catch (error) { console.error(error); }
    };

    const handleAddFund = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newRecord = {
            investor_name: formData.get('investor_name'),
            amount_raised: Number(formData.get('amount_raised')),
            funding_date: formData.get('funding_date'),
            funding_type: formData.get('funding_type'),
            owner_responsible: formData.get('owner_responsible'),
            notes: formData.get('notes'),
        };
        try {
            await createFund(newRecord);
            setShowFundModal(false);
            fetchData();
        } catch (error) { console.error(error); }
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

    const activeProjectsBreakdown = financials.map(f => {
        const proj = projects.find(p => String(p.record_id) === String(f.project_id) || String(p.id) === String(f.project_id));
        return { ...f, projectName: proj ? proj.client_name || `Project #${f.project_id}` : `Project #${f.project_id}` };
    });

    const categoryRevenueTotals = { 'Services': 0, 'Marketing': 0, 'Product': 0 };
    const activeProjectsByCategory = { 'Services': 0, 'Marketing': 0, 'Product': 0 };
    activeProjectsBreakdown.forEach(f => {
        let cat = f.project_category || 'Services';
        if (cat === 'Products') cat = 'Product';
        if (categoryRevenueTotals[cat] !== undefined) {
            categoryRevenueTotals[cat] += Number(f.monthly_billing_amount);
            activeProjectsByCategory[cat] += 1;
        }
    });

    const renderOverall = () => (
        <>
            <h2 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem' }}>Monthly Consolidation Timeline</h2>
            <div className="timeline-card">
                <div className="timeline-container">
                    {timelineMonths.map((m, idx) => {
                        const stats = getMonthStats(m);
                        return (
                            <div className={`timeline-month ${hoveredMonth?.label === m.label ? 'active' : ''}`} key={idx} onMouseEnter={() => setHoveredMonth(m)}>
                                <h3>{m.label}</h3>
                                <div className="timeline-metric"><span>Revenue</span><span className="metric-revenue">{formatCurrency(stats.totalRevenue)}</span></div>
                                <div className="timeline-metric"><span>Costs</span><span className="metric-cost">{formatCurrency(stats.totalCost)}</span></div>
                                <div className={`timeline-metric metric-pnl ${stats.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}><span>Net PNL</span><span>{formatCurrency(stats.pnl)}</span></div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {hoveredMonth && (() => {
                const stats = getMonthStats(hoveredMonth);
                return (
                    <div className="center-popup-overlay" onClick={() => setHoveredMonth(null)}>
                        <div className="month-tooltip-area center-popup premium-executive-card" onClick={(e) => e.stopPropagation()} onMouseLeave={() => setHoveredMonth(null)}>
                            <div className="popup-header"><h3>Financial Breakdown — {hoveredMonth.label}</h3></div>
                            <div className="kpi-summary-strip">
                                <div className="kpi-metric"><span>REVENUE</span><strong className="revenue-text">{formatCurrency(stats.totalRevenue)}</strong></div>
                                <div className="kpi-metric"><span>COSTS</span><strong className="cost-text">{formatCurrency(stats.totalCost)}</strong></div>
                                <div className="kpi-metric"><span>NET PNL</span><strong className={stats.pnl >= 0 ? 'pnl-positive-bold' : 'pnl-negative-bold'}>{formatCurrency(stats.pnl)}</strong></div>
                                {stats.totalFunds > 0 && <div className="kpi-metric"><span>FUNDS RAISED</span><strong style={{ color: '#8b5cf6' }}>{formatCurrency(stats.totalFunds)}</strong></div>}
                            </div>
                            <div className="main-content-split">
                                <div className="content-panel left-panel">
                                    <h4 className="panel-title">REVENUE AGGREGATED</h4>
                                    <div className="revenue-list">
                                        {Object.entries(stats.revenueByCategory).map(([cat, amount], i) => (
                                            <div className="row-item" key={i}><span className="row-label">{cat}</span><span className="row-value revenue-text">+{formatCurrency(amount)}</span></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="content-panel right-panel">
                                    <h4 className="panel-title">MONTHLY PROJECTS</h4>
                                    <div className="projects-scroll-list">
                                        {stats.monthFinancials.map((f, i) => {
                                            const proj = projects.find(p => String(p.record_id) === String(f.project_id) || String(p.id) === String(f.project_id));
                                            return (
                                                <div className="row-item-detailed" key={i}>
                                                    <div className="item-info"><span className="row-label-primary">{proj?.client_name || 'Project'}</span><span className="row-label-secondary">{f.billing_owner}</span></div>
                                                    <span className="row-value revenue-text">+{formatCurrency(f.monthly_billing_amount)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="costs-section">
                                <h4 className="panel-title">COST BREAKDOWNS</h4>
                                <div className="costs-table-wrapper">
                                    <table className="costs-table">
                                        <thead><tr><th>Cost Item</th><th>Category</th><th>Owner</th><th className="col-amount">Amount</th></tr></thead>
                                        <tbody>
                                            {stats.monthCosts.map((c, i) => (
                                                <tr key={i}><td>{c.cost_name}</td><td>{c.cost_category}</td><td>{c.owner_name}</td><td className="col-amount cost-text">-{formatCurrency(c.monthly_amount)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {stats.monthFunds.length > 0 && (
                                <div className="costs-section" style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <h4 className="panel-title" style={{ color: '#8b5cf6' }}>FUNDS RAISED IN {hoveredMonth.label}</h4>
                                    <div className="costs-table-wrapper">
                                        <table className="costs-table">
                                            <thead><tr><th>Investor</th><th>Type</th><th>Owner</th><th className="col-amount">Amount</th></tr></thead>
                                            <tbody>
                                                {stats.monthFunds.map((f, i) => (
                                                    <tr key={i}><td><strong>{f.investor_name}</strong></td><td>{f.funding_type}</td><td>{f.owner_responsible}</td><td className="col-amount revenue-text">{formatCurrency(f.amount_raised)}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            <div className="sections-grid">
                <div className="section-card">
                    <h2><Briefcase size={20} color="#3b82f6" /> Category Revenue Monthly</h2>
                    <div className="breakdown-list">
                        {Object.entries(categoryRevenueTotals).map(([cat, amount], idx) => (
                            <div className="breakdown-item" key={idx}>
                                <div className="breakdown-header"><span className="breakdown-name">{cat}</span><span className="breakdown-amount metric-revenue">+{formatCurrency(amount)}/mo</span></div>
                                <div className="breakdown-meta"><span className="category-badge">{cat}</span><span>{activeProjectsByCategory[cat]} Projects</span></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="section-card">
                    <h2><TrendingUp size={20} color="#10b981" /> Project Revenue Breakdown</h2>
                    <div className="breakdown-list scrollable-breakdown">
                        {activeProjectsBreakdown.map((f, idx) => (
                            <div className="breakdown-item" key={idx}>
                                <div className="breakdown-header"><span className="breakdown-name">{f.projectName}</span><span className="breakdown-amount metric-revenue">+{formatCurrency(f.monthly_billing_amount)}/mo</span></div>
                                <div className="breakdown-meta"><span className="category-badge">{f.project_category}</span><span>{f.billing_owner}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="section-card">
                    <h2><TrendingDown size={20} color="#ef4444" /> Cost Centers Directory</h2>
                    <div className="breakdown-list scrollable-breakdown">
                        {costs.map((c, idx) => (
                            <div className="breakdown-item" key={idx}>
                                <div className="breakdown-header"><span className="breakdown-name">{c.cost_name}</span><span className="breakdown-amount metric-cost">-{formatCurrency(c.monthly_amount)}/mo</span></div>
                                <div className="breakdown-meta"><span className="category-badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>{c.cost_category}</span><span>{c.owner_name}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="section-card">
                    <h2><DollarSign size={20} color="#8b5cf6" /> Investment Funds Raised</h2>
                    <div className="breakdown-list scrollable-breakdown">
                        {funds.map((f, idx) => (
                            <div className="breakdown-item" key={idx}>
                                <div className="breakdown-header"><span className="breakdown-name">{f.investor_name}</span><span className="breakdown-amount" style={{ color: '#8b5cf6' }}>{formatCurrency(f.amount_raised || 0)}</span></div>
                                <div className="breakdown-meta"><span className="category-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>{f.funding_type}</span><span>{f.funding_date ? new Date(f.funding_date).toLocaleDateString() : 'N/A'}</span></div>
                            </div>
                        ))}
                        {funds.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No investment records.</p>}
                    </div>
                </div>
            </div>
        </>
    );

    const renderRevenue = () => (
        <div className="tab-content-area">
            <div className="section-card full-width-card">
                <h2><Briefcase size={20} color="#3b82f6" /> Monthly Revenue Rules</h2>
                <table className="finance-table">
                    <thead><tr><th>Project Name</th><th>Category</th><th>Monthly Billing</th><th>Billing Owner</th><th>Duration</th></tr></thead>
                    <tbody>
                        {activeProjectsBreakdown.map((f, i) => (
                            <tr key={i}>
                                <td><strong>{f.projectName}</strong></td>
                                <td><span className="category-badge">{f.project_category}</span></td>
                                <td className="revenue-text">+{formatCurrency(f.monthly_billing_amount)}</td>
                                <td>{f.billing_owner}</td>
                                <td>{new Date(f.billing_start_date).toLocaleDateString()} - {new Date(f.billing_end_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCosts = () => (
        <div className="tab-content-area">
            <div className="section-card full-width-card">
                <h2><TrendingDown size={20} color="#ef4444" /> Cost Center Management</h2>
                <table className="finance-table">
                    <thead><tr><th>Cost Item</th><th>Category</th><th>Monthly Amount</th><th>Owner</th><th>Duration</th></tr></thead>
                    <tbody>
                        {costs.map((c, i) => (
                            <tr key={i}>
                                <td><strong>{c.cost_name}</strong></td>
                                <td><span className="category-badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>{c.cost_category}</span></td>
                                <td className="cost-text">-{formatCurrency(c.monthly_amount)}</td>
                                <td>{c.owner_name}</td>
                                <td>{new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderFunds = () => {
        // --- DATA AGGREGATIONS ---
        const totalRaised = funds.reduce((sum, f) => sum + Number(f.amount_raised || 0), 0);
        const totalCosts = costs.reduce((sum, c) => sum + Number(c.monthly_amount || 0), 0);
        const totalRevenueActual = financials.reduce((sum, f) => sum + Number(f.monthly_billing_amount || 0), 0);
        const remainingCash = totalRaised - totalCosts;

        // Group Investors
        const investorGroups = funds.reduce((acc, f) => {
            const name = f.investor_name || 'Individual / Internal';
            if (!acc[name]) {
                acc[name] = { name, total: 0, count: 0, lastDate: null };
            }
            acc[name].total += Number(f.amount_raised || 0);
            acc[name].count += 1;
            const fDate = f.funding_date ? new Date(f.funding_date) : null;
            if (fDate && (!acc[name].lastDate || fDate > new Date(acc[name].lastDate))) {
                acc[name].lastDate = f.funding_date;
            }
            return acc;
        }, {});

        const sortedInvestors = Object.values(investorGroups).sort((a, b) => b.total - a.total);
        const sortedHistory = [...funds].sort((a, b) => new Date(b.funding_date || 0) - new Date(a.funding_date || 0));

        // Utilization bars percentage
        const maxScale = Math.max(totalRaised, totalRevenueActual, totalCosts, 1);
        const getPct = (val) => (val / maxScale) * 100;

        return (
            <div className="tab-content-area">
                <div className="investment-dashboard">

                    {/* SECTION 1 — FUNDING SUMMARY */}
                    <div>
                        <span className="dashboard-section-title">Funding Summary</span>
                        <div className="funding-summary-grid">
                            <div className="kpi-card-premium">
                                <span className="kpi-label">Total Funds Raised</span>
                                <span className="kpi-value" style={{ color: '#8b5cf6' }}>{formatCurrency(totalRaised)}</span>
                            </div>
                            <div className="kpi-card-premium">
                                <span className="kpi-label">Funds Used (Operational)</span>
                                <span className="kpi-value" style={{ color: '#ef4444' }}>{formatCurrency(totalCosts)}</span>
                            </div>
                            <div className="kpi-card-premium">
                                <span className="kpi-label">Remaining Cash Balance</span>
                                <span className="kpi-value" style={{ color: '#10b981' }}>{formatCurrency(remainingCash)}</span>
                            </div>
                            <div className="kpi-card-premium">
                                <span className="kpi-label">Total Investors Count</span>
                                <span className="kpi-value">{sortedInvestors.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2 — INVESTOR OVERVIEW */}
                    <div>
                        <span className="dashboard-section-title">Investor Overview</span>
                        <div className="investor-grid">
                            {sortedInvestors.map((inv, idx) => (
                                <div className="investor-card" key={idx}>
                                    <h3>{inv.name}</h3>
                                    <div className="investor-stats">
                                        <span className="investor-amount">{formatCurrency(inv.total)}</span>
                                        <span className="investor-meta">{inv.count} Investments</span>
                                        <span className="investor-meta">Last: {inv.lastDate ? new Date(inv.lastDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                    </div>
                                </div>
                            ))}
                            {sortedInvestors.length === 0 && <p className="empty-state">No investor data found.</p>}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '2.5rem' }}>
                        {/* SECTION 3 — FUNDING TIMELINE */}
                        <div>
                            <span className="dashboard-section-title">Funding History (Timeline)</span>
                            <div className="timeline-list-card">
                                {sortedHistory.map((f, i) => (
                                    <div className="timeline-row" key={i}>
                                        <span className="date">{f.funding_date ? new Date(f.funding_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                        <span className="investor">{f.investor_name}</span>
                                        <span className="amount">+{formatCurrency(f.amount_raised || 0)}</span>
                                        <span className="type">{f.funding_type || 'Equity'}</span>
                                    </div>
                                ))}
                                {sortedHistory.length === 0 && <p className="empty-state">No funding records recorded.</p>}
                            </div>
                        </div>

                        {/* SECTION 4 — UTILIZATION SNAPSHOT */}
                        <div>
                            <span className="dashboard-section-title">Utilization Snapshot</span>
                            <div className="utilization-snapshot">
                                <div className="util-row">
                                    <div className="util-info"><span className="util-label">Total Capital Raised</span><span className="util-value">{formatCurrency(totalRaised)}</span></div>
                                    <div className="util-bar-bg"><div className="util-bar-fill" style={{ width: '100%', background: '#8b5cf6' }}></div></div>
                                </div>
                                <div className="util-row">
                                    <div className="util-info"><span className="util-label">Revenue Generated</span><span className="util-value">{formatCurrency(totalRevenueActual)}</span></div>
                                    <div className="util-bar-bg"><div className="util-bar-fill" style={{ width: `${getPct(totalRevenueActual)}%`, background: '#10b981' }}></div></div>
                                </div>
                                <div className="util-row">
                                    <div className="util-info"><span className="util-label">Operational Costs</span><span className="util-value">{formatCurrency(totalCosts)}</span></div>
                                    <div className="util-bar-bg"><div className="util-bar-fill" style={{ width: `${getPct(totalCosts)}%`, background: '#ef4444' }}></div></div>
                                </div>
                                <div className="util-row" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                    <div className="util-info"><span className="util-label" style={{ fontWeight: 800 }}>Net Cash Position</span><span className="util-value" style={{ color: remainingCash >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(remainingCash)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="ceo-dashboard-container">
            <header className="ceo-header-card">
                <div className="ceo-header-title">
                    <button onClick={() => navigate('/dashboard')} className="back-link"><ArrowLeft size={16} /> Back to Dashboard</button>
                    <h1>CEO Financial Overview</h1>
                    <p>Executive Consolidated PNL & Projections</p>
                </div>
                <div className="ceo-actions-container">
                    {activeTab === 'revenue' && <button className="ceo-action-btn ceo-action-revenue" onClick={() => setShowRevModal(true)}><Plus size={18} /> Map Revenue</button>}
                    {activeTab === 'funds' && <button className="ceo-action-btn ceo-action-revenue" onClick={() => setShowFundModal(true)}><Plus size={18} /> Add Fund</button>}
                    <button className="ceo-action-btn ceo-action-cost" onClick={() => setShowCostModal(true)}><Plus size={18} /> Add Cost</button>
                </div>
            </header>

            {/* TAB NAVIGATION */}
            <div className="ceo-tabs-nav">
                <button className={activeTab === 'overall' ? 'active' : ''} onClick={() => setActiveTab('overall')}>Overall</button>
                <button className={activeTab === 'revenue' ? 'active' : ''} onClick={() => setActiveTab('revenue')}>Revenue</button>
                <button className={activeTab === 'costs' ? 'active' : ''} onClick={() => setActiveTab('costs')}>Costs</button>
                <button className={activeTab === 'funds' ? 'active' : ''} onClick={() => setActiveTab('funds')}>Funds</button>
            </div>

            {activeTab === 'overall' && renderOverall()}
            {activeTab === 'revenue' && renderRevenue()}
            {activeTab === 'costs' && renderCosts()}
            {activeTab === 'funds' && renderFunds()}

            {/* MODALS */}
            {showRevModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Revenue Mapping</h2>
                            <button className="close-btn" onClick={() => setShowRevModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddRevenue} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
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
                                    <label>Category</label>
                                    <select name="project_category" required>
                                        <option value="Services">Services</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Product">Product</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Monthly Billing (₹)</label><input type="number" step="0.01" name="monthly_billing_amount" required /></div>
                                <div className="form-group"><label>Billing Owner</label><input type="text" name="billing_owner" required /></div>
                                <div className="form-group"><label>Start Date</label><input type="date" name="billing_start_date" required /></div>
                                <div className="form-group"><label>End Date</label><input type="date" name="billing_end_date" required /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                <button type="button" onClick={() => setShowRevModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                                <button type="submit" className="submit-btn" style={{ flex: 2, background: '#10b981', margin: 0 }}>Secure Revenue Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCostModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Cost Center</h2>
                            <button className="close-btn" onClick={() => setShowCostModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddCost} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
                                <div className="form-group"><label>Cost Name</label><input type="text" name="cost_name" required /></div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="cost_category" required>
                                        <option value="Salary">Salary</option>
                                        <option value="Rent">Rent</option>
                                        <option value="Tools">Tools</option>
                                        <option value="Server">Server</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Monthly Amount (₹)</label><input type="number" step="0.01" name="monthly_amount" required /></div>
                                <div className="form-group"><label>Owner</label><input type="text" name="owner_name" required /></div>
                                <div className="form-group"><label>Start Date</label><input type="date" name="start_date" required /></div>
                                <div className="form-group"><label>End Date</label><input type="date" name="end_date" required /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                <button type="button" onClick={() => setShowCostModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                                <button type="submit" className="submit-btn" style={{ flex: 2, background: '#ef4444', margin: 0 }}>Save Cost Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showFundModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Fund Source</h2>
                            <button className="close-btn" onClick={() => setShowFundModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddFund} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
                                <div className="form-group"><label>Investor Name</label><input type="text" name="investor_name" required /></div>
                                <div className="form-group"><label>Amount Raised (₹)</label><input type="number" name="amount_raised" required /></div>
                                <div className="form-group">
                                    <label>Funding Type</label>
                                    <select name="funding_type" required>
                                        <option value="Seed">Seed</option>
                                        <option value="Series A">Series A</option>
                                        <option value="Equity">Equity</option>
                                        <option value="Debt">Debt</option>
                                        <option value="Grant">Grant</option>
                                        <option value="Internal">Internal</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Funding Date</label><input type="date" name="funding_date" required /></div>
                                <div className="form-group"><label>Owner Responsible</label><input type="text" name="owner_responsible" required /></div>
                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea name="notes" style={{ width: '100%', minHeight: '70px', borderRadius: '12px', padding: '10px 16px', border: '2px solid #f1f5f9', fontSize: '0.95rem', fontFamily: 'inherit', background: '#f8fafc', resize: 'vertical' }}></textarea>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                <button type="button" onClick={() => setShowFundModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                                <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>Save Fund Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CEOFinancialOverview;

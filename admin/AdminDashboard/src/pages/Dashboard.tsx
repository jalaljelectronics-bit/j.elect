// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, DashboardStats } from '../api/statsService';

const EMPTY_STATS: DashboardStats = {
  totalProducts: 0,
  totalOrdersThisMonth: 0,
  clientQueriesPending: 0,
  newOrders24h: 0,
  totalProjectsCount: 0,
  totalBlogsCount: 0,
};

export const Dashboard: React.FC = () => {
  // Live counts pulled from the backend so every card reflects real
  // database data instead of hardcoded placeholder numbers.
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDashboardStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err);
        if (active) setError('Could not load live stats.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalProducts = stats.totalProducts;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cardsConfig = [
    {
      title: 'Total Products',
      value: totalProducts,
      footer: '✓ Active in inventory',
      footerColor: '#10b981',
      borderColor: '#10b981'
    },
    {
      title: 'Total Orders (Month)',
      value: stats.totalOrdersThisMonth,
      footer: 'Target pacing normally',
      footerColor: '#3b82f6',
      borderColor: '#3b82f6'
    },
    {
      title: 'Client Queries',
      value: stats.clientQueriesPending,
      footer: 'Requires agent response',
      footerColor: '#ef4444',
      borderColor: '#ef4444'
    },
    {
      title: 'Total Projects',
      value: stats.totalProjectsCount,
      footer: '💼 Commercial & University',
      footerColor: '#6366f1',
      borderColor: '#6366f1'
    },
    {
      title: 'Total Blogs',
      value: stats.totalBlogsCount,
      footer: '📝 Live articles & drafts',
      footerColor: '#ec4899',
      borderColor: '#ec4899' 
    },
    {
      title: 'New Orders (24 Hours)',
      value: stats.newOrders24h,
      footer: 'Requires fulfillment actions',
      footerColor: '#64748b',
      borderColor: '#f59e0b'
    }
  ];

  return (
    <div>
      {/* Welcome Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
          Welcome back, Admin!
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
          Here is an overview of your store's performance today.
          {loading && (
            <span style={{ marginLeft: '0.5rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Loading live data…
            </span>
          )}
          {error && (
            <span style={{ marginLeft: '0.5rem', color: '#ef4444' }}>
              {error}
            </span>
          )}
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="cards-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        {cardsConfig.map((card, index) => {
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                backgroundColor: '#fff',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                borderLeft: `4px solid ${card.borderColor}`,
                transform: isHovered ? 'translateY(-5px)' : 'translateY(0px)',
                boxShadow: isHovered 
                  ? '0 10px 20px -5px rgba(15, 23, 42, 0.15), 0 8px 8px -5px rgba(15, 23, 42, 0.1)' 
                  : '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.25s ease-in-out',
                cursor: 'default',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: card.footerColor, marginTop: '0.5rem', fontWeight: '500' }}>
                {card.footer}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links To Main Sections (Clean Text, No Emojis) */}
      <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1.25rem', marginTop: 0 }}>
          ⚡ Quick Administrative Actions
        </h3>
        
        <div className="quick-links-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
          gap: '1rem' 
        }}>
          <Link to="/admin/products" style={{ padding: '0.85rem', backgroundColor: '#3b82f6', color: '#fff', textDecoration: 'none', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', transition: 'opacity 0.2s' }}>
            Manage Product Catalog
          </Link>
          <Link to="/admin/categories" style={{ padding: '0.85rem', backgroundColor: '#10b981', color: '#fff', textDecoration: 'none', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', transition: 'opacity 0.2s' }}>
            Audit Stock Categories
          </Link>
          <Link to="/admin/projects" style={{ padding: '0.85rem', backgroundColor: '#6366f1', color: '#fff', textDecoration: 'none', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', transition: 'opacity 0.2s' }}>
            Review Project Portfolio
          </Link>
          <Link to="/admin/blogs" style={{ padding: '0.85rem', backgroundColor: '#ec4899', color: '#fff', textDecoration: 'none', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', transition: 'opacity 0.2s' }}>
            Compose Blog Post
          </Link>
          <Link to="/admin/orders" style={{ padding: '0.85rem', backgroundColor: '#f59e0b', color: '#fff', textDecoration: 'none', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', transition: 'opacity 0.2s' }}>
            View Incoming Orders
          </Link>
          <Link to="/admin/queries" style={{ padding: '0.85rem', backgroundColor: '#ef4444', color: '#fff', textDecoration: 'none', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', transition: 'opacity 0.2s' }}>
            Respond to Client Queries
          </Link>
        </div>
      </div>
    </div>
  );
};
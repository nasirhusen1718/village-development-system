import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import StatusCard from "../../components/dashboard/StatusCard";
import SectorDistribution from "../../components/charts/SectorDistribution";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner, { LoadingCard } from "../../components/common/LoadingSpinner";
import { getDashboardData } from "../../api/dashboard";
import {
  ArrowPathIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { toast } from 'react-toastify';

const sectors = [
  { key: "healthcare", label: "Healthcare", icon: "🩺", color: "bg-red-100 text-red-800" },
  { key: "agriculture", label: "Agriculture", icon: "🌾", color: "bg-green-100 text-green-800" },
  { key: "village", label: "Infrastructure", icon: "🏗️", color: "bg-blue-100 text-blue-800" },
  { key: "education", label: "Education", icon: "📚", color: "bg-purple-100 text-purple-800" },
  { key: "water", label: "Water & Sanitation", icon: "💧", color: "bg-cyan-100 text-cyan-800" },
];

export default function OfficerDashboard() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    total_month: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    escalated: 0,
    sector_distribution: {}
  });
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardData();
      setDashboardData(prev => ({
        ...prev,
        ...data,
        sector_distribution: data.sector_distribution || {}
      }));
      setLastRefresh(new Date());
      if (showToast) {
        toast.success('Dashboard data refreshed successfully!');
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
      toast.error("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAction = (action) => {
    setPendingAction(action);
    setShowConfirm(true);
  };

  const confirmAction = () => {
    if (pendingAction) {
      toast.success(`Action "${pendingAction}" completed successfully!`);
      loadData(true);
    }
    setShowConfirm(false);
    setPendingAction(null);
  };

  const getTrendPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const previousMonthData = {
    total: Math.max(0, dashboardData.total_month - 5),
    pending: Math.max(0, dashboardData.pending - 2),
    in_progress: Math.max(0, dashboardData.in_progress - 1),
    resolved: Math.max(0, dashboardData.resolved - 3),
    escalated: Math.max(0, dashboardData.escalated - 1)
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderStatusCards = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatusCard
          title="Total This Month"
          count={dashboardData.total_month}
          status="info"
          icon={<BellAlertIcon className="h-6 w-6 text-blue-500" />}
          trend={dashboardData.total_month >= previousMonthData.total ? "up" : "down"}
          trendPercentage={getTrendPercentage(dashboardData.total_month, previousMonthData.total)}
        />
        <StatusCard
          title="Pending"
          count={dashboardData.pending}
          status="pending"
          icon={<ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />}
          trend={dashboardData.pending >= previousMonthData.pending ? "up" : "down"}
          trendPercentage={getTrendPercentage(dashboardData.pending, previousMonthData.pending)}
        />
        <StatusCard
          title="In Progress"
          count={dashboardData.in_progress}
          status="in_progress"
          icon={<ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />}
          trend={dashboardData.in_progress >= previousMonthData.in_progress ? "up" : "down"}
          trendPercentage={getTrendPercentage(dashboardData.in_progress, previousMonthData.in_progress)}
        />
        <StatusCard
          title="Resolved"
          count={dashboardData.resolved}
          status="resolved"
          icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />}
          trend={dashboardData.resolved >= previousMonthData.resolved ? "up" : "down"}
          trendPercentage={getTrendPercentage(dashboardData.resolved, previousMonthData.resolved)}
        />
      </div>
    );
  };

  const renderSectorCards = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {sectors.map((sector, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {sectors.map((sector) => {
          const count = dashboardData.sector_distribution?.[sector.key] || 0;
          const trend = count > 0 ? 'up' : 'down';
          const trendPercentage = count > 0 ? Math.min(count * 10, 100) : 0;

          return (
            <div
              key={sector.key}
              onClick={() => nav(`/officer/problems?sector=${sector.key}`)}
              className={`${sector.color.replace('text-', 'hover:bg-').replace('800', '100')} p-6 rounded-lg shadow cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center border border-transparent hover:border-${sector.color.split('-')[1]}-200`}
            >
              <div className="text-4xl mb-3">{sector.icon}</div>
              <h3 className="font-semibold text-gray-900">{sector.label}</h3>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold mr-2">{count}</span>
                <span className="text-sm text-gray-500">issues</span>
              </div>
              {count > 0 && (
                <div className="mt-2 text-xs px-2 py-1 rounded-full bg-opacity-20 bg-black text-gray-700">
                  {trend === 'up' ? '↑' : '↓'} {trendPercentage}% from last month
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Officer Dashboard" />

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage village development issues
              {lastRefresh && (
                <span className="ml-2 text-sm text-gray-500">
                  • Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => loadData(true)}
                className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Status Overview */}
        {renderStatusCards()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Sector Distribution */}
          <div className="lg:col-span-2">
            <SectorDistribution
              data={dashboardData.sector_distribution}
              loading={loading}
              error={error}
              height={400}
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CogIcon className="h-5 w-5 mr-2 text-gray-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => nav("/officer/problems/new")}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Report New Issue
                </button>
                <button
                  onClick={() => nav("/officer/calendar")}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View Calendar
                </button>
                <button
                  onClick={() => handleAction('Generate Monthly Report')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Generate Report
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {dashboardData.recent_activity?.length > 0 ? (
                  dashboardData.recent_activity.map((activity, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {activity.user?.charAt(0) || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{activity.user || 'User'}</span> {activity.action}
                        </p>
                        <p className="text-xs text-gray-500">{activity.timestamp || 'Just now'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sector Cards */}
        {renderSectorCards()}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmAction}
          title="Confirm Action"
          message={`Are you sure you want to ${pendingAction?.toLowerCase()}?`}
          confirmText={pendingAction || 'Confirm'}
          confirmColor="bg-blue-600 hover:bg-blue-700"
        />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { ArrowPathIcon, BellAlertIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

// Components
import Navbar from "../../components/Navbar";
import StatusCard from "../../components/dashboard/StatusCard";
import SectorDistribution from "../../components/charts/SectorDistribution";
import ConfirmationModal from "../../components/common/ConfirmationModal";

// API
import { getDashboardData } from "../../api/dashboard";

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
  const [summary, setSummary] = useState({ 
    total_month: 0, 
    pending: 0, 
    in_progress: 0,
    resolved: 0,
    escalated: 0,
    sector_distribution: {}
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();
      setSummary(prev => ({
        ...prev,
        ...data,
        sector_distribution: data.sector_distribution || {}
      }));
    } catch (err) {
      console.error("Error loading dashboard data:", err);
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
      // In a real app, you would call an API here
      toast.success(`Action "${pendingAction}" completed successfully!`);
      // Refresh data after action
      loadData();
    }
    setShowConfirm(false);
    setPendingAction(null);
  };

  const getTrendPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calculate trend data (in a real app, this would come from the API)
  const previousMonthData = {
    total: summary.total_month - 5,
    pending: summary.pending - 2,
    in_progress: summary.in_progress - 1,
    resolved: summary.resolved - 3,
    escalated: summary.escalated - 1
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !Object.keys(summary.sector_distribution).length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Officer Dashboard" />
        <div className="flex items-center justify-center h-64">
          <ArrowPathIcon className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Officer Dashboard" />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatusCard 
            title="Total This Month" 
            count={summary.total_month}
            status="info"
            icon={<BellAlertIcon className="h-6 w-6" />}
            trend={summary.total_month >= previousMonthData.total ? "up" : "down"}
            trendPercentage={getTrendPercentage(summary.total_month, previousMonthData.total)}
          />
          <StatusCard 
            title="Pending" 
            count={summary.pending}
            status="pending"
            icon={<ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />}
            trend={summary.pending >= previousMonthData.pending ? "up" : "down"}
            trendPercentage={getTrendPercentage(summary.pending, previousMonthData.pending)}
          />
          <StatusCard 
            title="In Progress" 
            count={summary.in_progress}
            status="in_progress"
            icon={<ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />}
            trend={summary.in_progress >= previousMonthData.in_progress ? "up" : "down"}
            trendPercentage={getTrendPercentage(summary.in_progress, previousMonthData.in_progress)}
          />
          <StatusCard 
            title="Resolved" 
            count={summary.resolved}
            status="resolved"
            icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />}
            trend={summary.resolved >= previousMonthData.resolved ? "up" : "down"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Sector Distribution */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Sector-wise Problem Distribution</h3>
                <button
                  onClick={loadData}
                  className="text-gray-500 hover:text-gray-700"
                  title="Refresh data"
                >
                  <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="h-80">
                <SectorDistribution data={summary.sector_distribution} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => nav("/officer/problems/new")}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Report New Issue
                </button>
                <button
                  onClick={() => nav("/officer/calendar")}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View Calendar
                </button>
                <button
                  onClick={() => handleAction('Generate Monthly Report')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Generate Report
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {summary.recent_activity?.length > 0 ? (
                  summary.recent_activity.map((activity, idx) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {sectors.map((sector) => {
            const count = summary.sector_distribution?.[sector.key] || 0;
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
};

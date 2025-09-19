import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ stat, index }) => {
    const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
    const trendColor = stat.trend === 'up' ? 'text-green-400' : 'text-red-400';

    return (
        <div
            className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fade-in-up`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    <div className="flex items-center mt-3">
                        <TrendIcon className={`w-4 h-4 mr-1 ${trendColor}`} />
                        <span className={`text-sm font-medium ${trendColor}`}>
                            {stat.change}
                        </span>
                        <span className="text-white/70 text-sm ml-1">vs last month</span>
                    </div>
                </div>
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                    <stat.icon className="w-7 h-7" />
                </div>
            </div>
        </div>
    );
};

export default StatCard;
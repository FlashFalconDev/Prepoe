import React from 'react';

const BusinessOverview: React.FC = () => {
  // 假資料
  const accountStatus = {
    companyName: '示例股份有限公司',
    level: 'Gold',
    plan: '年費專業版',
    expireAt: '2026-12-31',
    availableSeats: 25,
    usedSeats: 18,
  };

  const levelUsage = [
    { month: '2025-06', usage: 1200 },
    { month: '2025-07', usage: 1620 },
    { month: '2025-08', usage: 1390 },
    { month: '2025-09', usage: 1876 },
  ];

  const recentActivities = [
    { time: '2025-09-20 14:32', action: '新增 3 位成員' },
    { time: '2025-09-19 09:10', action: '升級至 Gold 等級' },
    { time: '2025-09-18 21:05', action: '綁定自訂網域 business.example.com' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">基本狀況</h2>

      {/* 帳戶狀況 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">帳戶狀況</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">公司名稱</div>
            <div className="text-base font-medium text-gray-900">{accountStatus.companyName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">等級</div>
            <div className="text-base font-medium text-gray-900">{accountStatus.level}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">方案</div>
            <div className="text-base font-medium text-gray-900">{accountStatus.plan}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">到期日</div>
            <div className="text-base font-medium text-gray-900">{accountStatus.expireAt}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">可用席次</div>
            <div className="text-base font-medium text-gray-900">{accountStatus.availableSeats}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">已用席次</div>
            <div className="text-base font-medium text-gray-900">{accountStatus.usedSeats}</div>
          </div>
        </div>
      </section>

      {/* 等級使用紀錄 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">等級使用紀錄</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">月份</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">用量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {levelUsage.map((row) => (
                <tr key={row.month}>
                  <td className="px-4 py-2 text-gray-800">{row.month}</td>
                  <td className="px-4 py-2 text-gray-800">{row.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 近期活動 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">近期活動</h3>
        <ul className="space-y-2">
          {recentActivities.map((a, idx) => (
            <li key={idx} className="flex items-center justify-between">
              <span className="text-gray-700">{a.action}</span>
              <span className="text-sm text-gray-500">{a.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default BusinessOverview;



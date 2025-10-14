import React from 'react';

const BusinessUsage: React.FC = () => {
  // 假資料：功能使用紀錄
  const usageLogs = [
    { time: '2025-09-20 08:10', user: 'Alice', feature: '客服對話', detail: '發起 12 次對話' },
    { time: '2025-09-19 16:42', user: 'Bob', feature: '內容創作', detail: '生成 3 篇文章' },
    { time: '2025-09-19 10:05', user: 'Clair', feature: '名片管理', detail: '更新雲端名片' },
    { time: '2025-09-18 21:33', user: 'David', feature: '文件向量庫', detail: '上傳 5 份文件' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">使用紀錄</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">時間</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">成員</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">功能</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">細節</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usageLogs.map((log, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-gray-800">{log.time}</td>
                  <td className="px-4 py-2 text-gray-800">{log.user}</td>
                  <td className="px-4 py-2 text-gray-800">{log.feature}</td>
                  <td className="px-4 py-2 text-gray-800">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessUsage;



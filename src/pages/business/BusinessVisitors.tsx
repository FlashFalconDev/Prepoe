import React from 'react';

const BusinessVisitors: React.FC = () => {
  // 假資料：關聯訪客清單
  const visitors = [
    { id: 'V001', name: '王小明', source: '活動報名', lastVisit: '2025-09-20 18:22', sessions: 5 },
    { id: 'V002', name: '林佳欣', source: '名片掃碼', lastVisit: '2025-09-20 11:03', sessions: 2 },
    { id: 'V003', name: '陳志豪', source: '私域助手', lastVisit: '2025-09-19 09:47', sessions: 8 },
    { id: 'V004', name: '黃沛君', source: '文章導流', lastVisit: '2025-09-18 22:10', sessions: 3 },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">關聯訪客</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">姓名/暱稱</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">來源</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">最近造訪</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">會話數</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitors.map(v => (
                <tr key={v.id}>
                  <td className="px-4 py-2 text-gray-800">{v.id}</td>
                  <td className="px-4 py-2 text-gray-800">{v.name}</td>
                  <td className="px-4 py-2 text-gray-800">{v.source}</td>
                  <td className="px-4 py-2 text-gray-800">{v.lastVisit}</td>
                  <td className="px-4 py-2 text-gray-800">{v.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessVisitors;



import React from 'react';

const BusinessAccounts: React.FC = () => {
  // 假資料：帳戶分配（部門/成員/權限/席次）
  const departments = [
    {
      name: '行銷部',
      seats: 10,
      used: 8,
      members: [
        { name: 'Alice', role: '管理員', email: 'alice@corp.com' },
        { name: 'Bob', role: '成員', email: 'bob@corp.com' },
      ],
    },
    {
      name: '客服部',
      seats: 8,
      used: 6,
      members: [
        { name: 'Clair', role: '管理員', email: 'clair@corp.com' },
        { name: 'David', role: '成員', email: 'david@corp.com' },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">帳戶分配</h2>

      {departments.map((d) => (
        <section key={d.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">{d.name}</h3>
            <div className="text-sm text-gray-600">席次 {d.used}/{d.seats}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">姓名</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">角色</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.members.map((m) => (
                  <tr key={`${d.name}-${m.email}`}>
                    <td className="px-4 py-2 text-gray-800">{m.name}</td>
                    <td className="px-4 py-2 text-gray-800">{m.role}</td>
                    <td className="px-4 py-2 text-gray-800">{m.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};

export default BusinessAccounts;



import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ShopHome: React.FC = () => {
  const { clientSid } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-4">
      {/* Banner 主視覺：標題 + 副標 + 立即探索（導向商品商城） */}
      <div className="mt-2">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-lg font-bold mb-2">歡迎來到 {clientSid}</h2>
          <p className="text-sm opacity-90 mb-4">探索更多精彩商品與優惠</p>
          <button
            type="button"
            onClick={() => clientSid && navigate(`/shop/${clientSid}/products`)}
            className="bg-white text-purple-600 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/95 active:scale-[0.98] transition-all shadow-sm"
          >
            立即探索
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopHome;

import React from 'react';
import type { FormField, DynamicFormData } from '../config/api';
import DynamicFormField from './DynamicFormField';
import { sortFormFields } from '../utils/formUtils';

interface ParticipantFormCardProps {
  participantIndex: number;
  participantName: string;
  isPrimaryContact: boolean;
  formFields: FormField[];
  formData: DynamicFormData;
  errors: Record<string, string>;
  onChange: (fieldId: string | number, value: any) => void;
}

/**
 * 參加者表單卡片組件
 * 用於顯示單個參加者的完整表單
 */
const ParticipantFormCard: React.FC<ParticipantFormCardProps> = ({
  participantIndex,
  participantName,
  isPrimaryContact,
  formFields,
  formData,
  errors,
  onChange
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
      isPrimaryContact ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
    }`}>
      {/* 標題區 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">👤</span>
        <h3 className="text-lg font-semibold text-gray-900">
          參加者 {participantIndex + 1}
          {participantName && <span className="text-gray-600 ml-2">({participantName})</span>}
        </h3>
      </div>

      {/* 提示文字 */}
      {isPrimaryContact && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
          <span className="font-medium">💡 提示：</span> 此參加者將收到活動通知和確認信
        </div>
      )}

      {/* 動態表單欄位 */}
      <div className="space-y-4">
        {sortFormFields(formFields).map((field) => (
          <DynamicFormField
            key={String(field.id)}
            field={field}
            value={formData[String(field.id)]}
            onChange={onChange}
            error={errors[String(field.id)]}
            formData={formData}
          />
        ))}
      </div>
    </div>
  );
};

export default ParticipantFormCard;


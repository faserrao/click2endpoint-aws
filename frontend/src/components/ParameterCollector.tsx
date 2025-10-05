import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { parameterSchemas, type ParameterField } from '../data/parameterSchemas';

interface ParameterCollectorProps {
  endpointPath: string;
  onParametersChange: (parameters: any) => void;
  wizardAnswers?: Record<string, string>;
}

export const ParameterCollector: React.FC<ParameterCollectorProps> = ({
  endpointPath,
  onParametersChange,
  wizardAnswers = {}
}) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [oneOfSelections, setOneOfSelections] = useState<Record<string, string>>({});

  const rawSchema = parameterSchemas[endpointPath] || [];

  // Filter schema based on template content
  const schema = rawSchema.filter(field => {
    const { templateContent } = wizardAnswers;

    // If template contains address list, hide address-related fields
    if (templateContent === 'addressList') {
      // Hide addressListId and recipientAddressSource fields
      if (field.name === 'addressListId' || field.name === 'recipientAddressSource') {
        return false;
      }
    }

    // If template contains document, hide document source field
    if (templateContent === 'document' && field.name === 'documentSourceIdentifier') {
      return false;
    }

    return true;
  });

  useEffect(() => {
    // Initialize form with default values
    const initData: any = {};
    schema.forEach(field => {
      if (field.defaultValue !== undefined) {
        initData[field.name] = field.defaultValue;
      } else if (field.type === 'array') {
        initData[field.name] = [createEmptyObject(field.fields || [])];
      } else if (field.type === 'object') {
        initData[field.name] = createEmptyObject(field.fields || []);
      }
    });
    setFormData(initData);
  }, [endpointPath]);

  const createEmptyObject = (fields: ParameterField[]): any => {
    const obj: any = {};
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        obj[field.name] = field.defaultValue;
      } else if (field.type === 'object' && field.fields) {
        // Recursively create empty objects for nested structures
        obj[field.name] = createEmptyObject(field.fields);
      } else if (field.type === 'array') {
        obj[field.name] = [];
      } else {
        obj[field.name] = '';
      }
    });
    return obj;
  };

  const validateField = (field: ParameterField, value: any): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      if (field.validation.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return `${field.label} format is invalid`;
        }
      }
      if (field.validation.minLength && value.length < field.validation.minLength) {
        return `${field.label} must be at least ${field.validation.minLength} characters`;
      }
      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        return `${field.label} must be no more than ${field.validation.maxLength} characters`;
      }
      if (field.type === 'number') {
        const numValue = Number(value);
        if (field.validation.min !== undefined && numValue < field.validation.min) {
          return `${field.label} must be at least ${field.validation.min}`;
        }
        if (field.validation.max !== undefined && numValue > field.validation.max) {
          return `${field.label} must be no more than ${field.validation.max}`;
        }
      }
    }

    return null;
  };

  const handleFieldChange = (path: string[], value: any) => {
    console.log('handleFieldChange called with path:', path, 'value:', value);
    
    const newData = { ...formData };
    let current = newData;
    
    // Navigate to the parent object
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        console.warn(`Path segment ${path[i]} is undefined, creating empty object`);
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    
    // Set the value
    const fieldName = path[path.length - 1];
    current[fieldName] = value;
    
    console.log('Updated formData:', newData);
    setFormData(newData);
    onParametersChange(newData);
  };

  const handleArrayAdd = (fieldName: string, fields: ParameterField[], arrayField?: ParameterField) => {
    let newItem: any = {};
    
    // Check if the array items are oneOf types
    if (fields.length === 1 && fields[0].type === 'oneOf' && fields[0].oneOfOptions?.length) {
      // For oneOf array items, initialize with the first option
      const oneOfField = fields[0];
      const firstOption = oneOfField.oneOfOptions[0];
      
      // Initialize with the structure from the first option
      firstOption.fields.forEach(field => {
        if (field.type === 'object' && field.fields) {
          newItem[field.name] = createEmptyObject(field.fields);
        } else {
          newItem[field.name] = field.defaultValue || '';
        }
      });
      
      // Track the oneOf selection for this array item
      const arrayLength = (formData[fieldName] || []).length;
      const arrayItemId = `${fieldName}.${arrayLength}`;
      setOneOfSelections({
        ...oneOfSelections,
        [arrayItemId]: firstOption.value
      });
    } else {
      newItem = createEmptyObject(fields);
    }
    
    const updatedData = {
      ...formData,
      [fieldName]: [...(formData[fieldName] || []), newItem]
    };
    setFormData(updatedData);
    onParametersChange(updatedData);
  };

  const handleArrayRemove = (fieldName: string, index: number) => {
    const newArray = [...(formData[fieldName] || [])];
    newArray.splice(index, 1);
    setFormData({
      ...formData,
      [fieldName]: newArray
    });
  };

  const toggleSection = (name: string) => {
    setExpandedSections({
      ...expandedSections,
      [name]: !expandedSections[name]
    });
  };

  const renderField = (field: ParameterField, path: string[] = [], index?: number): JSX.Element => {
    const fieldPath = index !== undefined ? [...path, index.toString(), field.name] : [...path, field.name];
    const fieldId = fieldPath.join('.');
    let value = formData;
    
    // Navigate to the correct value in the formData
    for (let i = 0; i < fieldPath.length; i++) {
      const p = fieldPath[i];
      value = value?.[p];
      if (value === undefined && i < fieldPath.length - 1) {
        // If we hit undefined before reaching the end, something is wrong
        console.warn(`Value undefined at path: ${fieldPath.slice(0, i + 1).join('.')}`);
        break;
      }
    }

    const error = errors[fieldId];

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={fieldId} className="mb-4">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              id={fieldId}
              type={field.type}
              name={`api-param-${fieldId}`}
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
              placeholder={field.placeholder}
              autoComplete="new-password"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              className={`w-full px-3 py-2 bg-[#2A2A2A] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ADB5] ${
                error ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {field.description && (
              <p className="text-xs text-gray-400 mt-1">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={fieldId} className="mb-4">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <select
              id={fieldId}
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              className={`w-full px-3 py-2 bg-[#2A2A2A] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00ADB5] ${
                error ? 'border-red-500' : 'border-gray-600'
              }`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.description && (
              <p className="text-xs text-gray-400 mt-1">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        );

      case 'file':
        return (
          <div key={fieldId} className="mb-4">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              id={fieldId}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFieldChange(fieldPath, file.name);
                }
              }}
              className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#00ADB5] file:text-white hover:file:bg-[#00BFC9]"
            />
            {field.description && (
              <p className="text-xs text-gray-400 mt-1">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        );

      case 'oneOf':
        const selectedOption = oneOfSelections[fieldId] || '';
        const selectedOneOfOption = field.oneOfOptions?.find(opt => opt.value === selectedOption);
        
        return (
          <div key={fieldId} className="mb-4 border border-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-200 mb-3">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </h4>
            {field.description && (
              <p className="text-sm text-gray-400 mb-3">{field.description}</p>
            )}
            
            <div className="space-y-2 mb-4">
              {field.oneOfOptions?.map(option => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={fieldId}
                    value={option.value}
                    checked={selectedOption === option.value}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setOneOfSelections({
                        ...oneOfSelections,
                        [fieldId]: newValue
                      });
                      
                      // For oneOf fields, we need to structure the data properly
                      const newData = { ...formData };
                      let current = newData;
                      
                      // Navigate to the parent of the oneOf field
                      for (let i = 0; i < fieldPath.length - 1; i++) {
                        current = current[fieldPath[i]];
                      }
                      
                      // Clear the oneOf field and set it to an empty object
                      const fieldName = fieldPath[fieldPath.length - 1];
                      current[fieldName] = {};
                      
                      // Initialize the selected option's fields with proper structure
                      const newOption = field.oneOfOptions?.find(opt => opt.value === newValue);
                      if (newOption) {
                        newOption.fields.forEach(f => {
                          if (f.type === 'object' && f.fields) {
                            current[fieldName][f.name] = createEmptyObject(f.fields);
                          } else if (f.type === 'array') {
                            current[fieldName][f.name] = [];
                          } else {
                            current[fieldName][f.name] = f.defaultValue || '';
                          }
                        });
                      }
                      
                      console.log('Updated formData after oneOf selection:', newData);
                      console.log('PaymentDetails:', current[fieldName]);
                      
                      setFormData(newData);
                      onParametersChange(newData);
                    }}
                    className="w-4 h-4 text-[#00ADB5] bg-[#2A2A2A] border-gray-600 focus:ring-[#00ADB5] focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
            
            {selectedOption && selectedOneOfOption && (
              <div className="mt-4 pl-6 border-l-2 border-[#00ADB5] space-y-4">
                {selectedOneOfOption.fields.map(subField => {
                  // For oneOf fields, the path should include the oneOf field itself
                  // fieldPath already contains the path to the oneOf field (e.g., ['paymentDetails'])
                  return renderField(subField, fieldPath);
                })}
              </div>
            )}
          </div>
        );

      case 'object':
        // Auto-expand objects within oneOf selections
        const isWithinOneOf = path.some(p => p === 'paymentDetails' || p === 'documentSourceIdentifier' || p === 'recipientAddressSource');
        const isExpanded = isWithinOneOf ? true : (expandedSections[fieldId] !== false);
        
        return (
          <div key={fieldId} className="mb-4 border border-gray-700 rounded-lg p-4">
            <button
              type="button"
              onClick={() => toggleSection(fieldId)}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <h4 className="text-lg font-medium text-gray-200">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </h4>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {field.description && (
              <p className="text-sm text-gray-400 mb-2">{field.description}</p>
            )}
            {isExpanded && (
              <div className="mt-4 space-y-4">
                {field.fields?.map(subField => renderField(subField, fieldPath))}
              </div>
            )}
          </div>
        );

      case 'array':
        const arrayValue = value || [];
        return (
          <div key={fieldId} className="mb-4 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-200">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </h4>
              <button
                type="button"
                onClick={() => handleArrayAdd(field.name, field.fields || [], field)}
                className="flex items-center gap-2 px-3 py-1 bg-[#00ADB5] hover:bg-[#00BFC9] rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add {field.label.slice(0, -1)}
              </button>
            </div>
            {field.description && (
              <p className="text-sm text-gray-400 mb-2">{field.description}</p>
            )}
            <div className="space-y-4">
              {arrayValue.map((item: any, idx: number) => (
                <div key={idx} className="bg-[#2A2A2A] p-4 rounded-lg relative">
                  <button
                    type="button"
                    onClick={() => handleArrayRemove(field.name, idx)}
                    className="absolute top-2 right-2 p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <h5 className="text-sm font-medium text-gray-300 mb-3">
                    {field.label.slice(0, -1)} #{idx + 1}
                  </h5>
                  <div className="space-y-3">
                    {field.fields?.map(subField => renderField(subField, [...path, field.name], idx))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div key={fieldId} />;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">Endpoint Parameters</h3>
      {schema.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No parameters required for this endpoint
        </p>
      ) : (
        <form 
          autoComplete="off" 
          onSubmit={(e) => e.preventDefault()}
          data-1p-ignore="true"
          data-lpignore="true"
          className="space-y-6"
        >
          {schema.map(field => renderField(field))}
        </form>
      )}
    </div>
  );
};
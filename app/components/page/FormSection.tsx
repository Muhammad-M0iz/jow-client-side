'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import './FormSection.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

const SUPPORTED_TYPES = [
  'text', 'textarea', 'number', 'email', 'select', 'upload',
  'date', 'time', 'datetime', 'boolean', 'radio', 'phone',
  'multiselect', 'url', 'cnic', 'repeater', 'section', 'statement',
] as const;

type SupportedFieldType = (typeof SUPPORTED_TYPES)[number];
type RepeaterRowValue = Record<string, string>;
type FieldValue = string | string[] | boolean | RepeaterRowValue[] | Record<string, string>;
type FormValues = Record<string, FieldValue>;
type FileValues = Record<string, File[]>;

type NormalizedOption = { label: string; value: string; };

export type FormFieldDefinition = {
  id: string;
  type?: string | null;
  label?: string | null;
  description?: string | null;
  placeholder?: string | null;
  required?: boolean | null;
  options?: Array<string | { label?: string | null; value?: string | null }> | null;
  validation?: {
    options?: string[];
    allowedTypes?: string[];
    pattern?: string;
  } | null;
  childFields?: FormFieldDefinition[] | null;
};

export type FormSectionData = {
  id: number | string;
  documentId?: string | null;
  name?: string | null;
  slug?: string | null;
  fields: FormFieldDefinition[];
};

export type FormSectionProps = {
  form: FormSectionData;
  direction?: 'ltr' | 'rtl';
};

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

// --- Helpers ---
const normalizeFieldType = (value?: string | null): SupportedFieldType => {
  if (!value) return 'text';
  const lowered = value.toLowerCase();
  if (SUPPORTED_TYPES.includes(lowered as SupportedFieldType)) return lowered as SupportedFieldType;
  if (lowered === 'datetime-local') return 'datetime';
  if (lowered === 'checkbox') return 'boolean';
  return 'text';
};

const normalizeOptions = (field: FormFieldDefinition): NormalizedOption[] => {
  const rawOptions = field.options ?? field.validation?.options ?? [];
  return rawOptions.map((option) => {
    if (typeof option === 'string' && option.trim()) return { label: option.trim(), value: option.trim() };
    if (option && typeof option === 'object' && (option.value || option.label)) {
      const val = option.value ?? option.label ?? '';
      return { label: option.label ?? val, value: val };
    }
    return null;
  }).filter((e): e is NormalizedOption => Boolean(e));
};

const buildInitialValues = (allFields: FormFieldDefinition[]): FormValues => {
  return allFields.reduce<FormValues>((acc, field) => {
    if (!field.id) return acc;
    const type = normalizeFieldType(field.type);
    if (type === 'section') return acc; // Skip containers
    
    if (type === 'repeater') {
      const childFields = field.childFields || [];
      const emptyRow: RepeaterRowValue = {};
      childFields.forEach(child => { if (child.id) emptyRow[child.id] = ''; });
      acc[field.id] = [emptyRow];
    } else if (type === 'multiselect') {
      acc[field.id] = [];
    } else if (type === 'boolean') {
      acc[field.id] = false;
    } else if (type === 'statement') {
      acc[field.id] = {};
    } else {
      acc[field.id] = '';
    }
    return acc;
  }, {});
};

const FormSection = ({ form, direction = 'ltr' }: FormSectionProps) => {
  // 1. Sections Logic
  const sections = useMemo(() => form.fields || [], [form.fields]);
  
  // 2. Flatten all fields for initial state
  const allFlatFields = useMemo(() => {
    return sections.flatMap(section => section.childFields || []).filter(field => !!field.id);
  }, [sections]);

  const initialValues = useMemo(() => buildInitialValues(allFlatFields), [allFlatFields]);

  // 3. State
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [fileValues, setFileValues] = useState<FileValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialValues);
    setFileValues({});
    setErrors({});
    setStatus('idle');
    setMessage(null);
    setCurrentStep(0);
  }, [initialValues]);

  // --- Handlers ---
  const clearError = (fieldId: string) => {
    setErrors(prev => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleTextChange = (fieldId: string, value: FieldValue) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    clearError(fieldId);
  };

  const handleFileChange = (fieldId: string, fileList: FileList | null) => {
    setFileValues(prev => {
      if (!fileList?.length) {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      }
      return { ...prev, [fieldId]: Array.from(fileList) };
    });
    clearError(fieldId);
  };

  // --- Validation Core ---
  const validateFields = (fieldsToValidate: FormFieldDefinition[]) => {
    const nextErrors: Record<string, string> = {};

    fieldsToValidate.forEach((field) => {
      const fieldId = field.id;
      const type = normalizeFieldType(field.type);
      const value = values[fieldId];
      const fileList = fileValues[fieldId];
      const label = field.label ?? field.placeholder ?? field.id;
      
      // Required Check
      if (field.required) {
        let isMissing = false;
        if (type === 'upload' && !fileList?.length) isMissing = true;
        else if (type === 'multiselect' && (!Array.isArray(value) || value.length === 0)) isMissing = true;
        else if (type === 'boolean' && !value) isMissing = true;
        else if (type !== 'statement' && !value) isMissing = true;

        if (isMissing) {
          nextErrors[fieldId] = `${label} is required.`;
          return;
        }
      }

      // Skip empty optional fields
      if (!value && type !== 'boolean' && type !== 'statement') return;

      // Type Validation
      if (type === 'email' && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        nextErrors[fieldId] = 'Invalid email address.';
      }
      if (type === 'cnic' && typeof value === 'string' && !/^\d{5}-\d{7}-\d{1}$/.test(value)) {
        nextErrors[fieldId] = 'Invalid CNIC (Format: 12345-1234567-1).';
      }
      if (type === 'phone' && typeof value === 'string' && !/^\+?[\d\s-]+$/.test(value)) {
        nextErrors[fieldId] = 'Invalid phone number.';
      }

      // Statement Validation (Nested)
      if (type === 'statement') {
        const stmtData = (value as Record<string, string>) || {};
        (field.childFields || []).forEach(child => {
           const childVal = stmtData[child.id];
           const childLabel = child.label || child.id;
           
           if (child.required && !childVal) {
             nextErrors[fieldId] = `${childLabel} is required.`; // Mark parent statement as error
           }
           // Add inner pattern checks here if needed
        });
      }
    });

    return nextErrors;
  };



  // Update handleNext to accept the event
  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // <--- CRITICAL: Prevents form submission
    setMessage(null);
    
    const currentSectionFields = sections[currentStep]?.childFields || [];
    const stepErrors = validateFields(currentSectionFields);
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const firstErrorId = Object.keys(stepErrors)[0];
      document.getElementById(firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, sections.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setMessage(null);
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate ALL fields on final submit
    const allErrors = validateFields(allFlatFields);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStatus('error');
      setMessage('Please fix the errors before submitting.');
      return;
    }

    const documentId = form.documentId ?? String(form.id);
    const formData = new FormData();

    // Append Logic
    Object.entries(values).forEach(([fieldId, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object') {
        formData.append(fieldId, JSON.stringify(value));
      } else {
        formData.append(fieldId, String(value));
      }
    });

    Object.entries(fileValues).forEach(([fieldId, files]) => {
      files.forEach(file => formData.append(fieldId, file));
    });

    setStatus('submitting');

    try {
      const response = await fetch(`${API_BASE_URL}/api/form-builder/forms/${documentId}/submit`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Submission failed');

      setStatus('success');
      setMessage('Thanks! Your response has been recorded.');
      setValues(initialValues);
      setFileValues({});
      setErrors({});
      setCurrentStep(0);
    } catch (error) {
      setStatus('error');
      setMessage('Unable to submit the form right now. Please try again.');
    }
  };

  // --- Renderers (Specific Types) ---
  const renderStatementField = (field: FormFieldDefinition) => {
    const fieldId = field.id;
    const template = field.placeholder || '';
    const value = (values[fieldId] as Record<string, string>) || {};
    const childFields = field.childFields || [];
    const errorMessage = errors[fieldId];

    const handleStatementChange = (key: string, newVal: string) => {
      const updated = { ...value, [key]: newVal };
      handleTextChange(fieldId, updated);
    };

    const parts = template.split(/(\[.*?\])/g);

    return (
      <div className="form-statement-container">
        <div className="form-statement-text">
          {parts.map((part, index) => {
            const match = part.match(/^\[(.*?)\]$/);
            if (match) {
              const variableName = match[1];
              const childDef = childFields.find(c => c.label === variableName || c.id === variableName);
              const inputValue = value[variableName] || '';

              if (childDef) {
                 // Render specific input based on child def
                 if (normalizeFieldType(childDef.type) === 'date') {
                    return <input key={index} type="date" className="form-statement-inline-input" value={inputValue} onChange={e => handleStatementChange(variableName, e.target.value)} />
                 }
                 // Add other types as needed
              }
              
              return (
                <input
                  key={index}
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleStatementChange(variableName, e.target.value)}
                  placeholder={variableName.replace(/_/g, ' ')}
                  className="form-statement-inline-input"
                  aria-label={variableName}
                />
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>
        {errorMessage && <p className="form-field-error">{errorMessage}</p>}
      </div>
    );
  };

  const renderRepeaterField = (field: FormFieldDefinition) => {
    const fieldId = field.id;
    const value = values[fieldId];
    // Ensure rows is always an array
    const rows = Array.isArray(value) ? (value as RepeaterRowValue[]) : [];
    const childFields = field.childFields || [];
    const errorMessage = errors[fieldId];

    const addRow = () => {
      const newRow: RepeaterRowValue = {};
      childFields.forEach((child) => {
        if (child.id) newRow[child.id] = '';
      });
      setValues((prev) => ({
        ...prev,
        [fieldId]: [...rows, newRow],
      }));
      clearError(fieldId);
    };

    const removeRow = (rowIndex: number) => {
      // Prevent removing the last row if you want to enforce at least one
      if (rows.length <= 1) return;
      
      setValues((prev) => ({
        ...prev,
        [fieldId]: rows.filter((_, i) => i !== rowIndex),
      }));
      clearError(fieldId);
    };

    const updateRow = (rowIndex: number, key: string, val: string) => {
      setValues((prev) => {
        const currentRows = (prev[fieldId] as RepeaterRowValue[]) || [];
        const newRows = [...currentRows];
        if (!newRows[rowIndex]) newRows[rowIndex] = {};
        newRows[rowIndex] = { ...newRows[rowIndex], [key]: val };
        return { ...prev, [fieldId]: newRows };
      });
      clearError(fieldId);
    };

    return (
      <div className="form-field repeater-wrapper" key={field.id}>
        {/* Main Label */}
        <label className="repeater-main-label">
          {field.label || field.id} {field.required && <span className="required-star">*</span>}
        </label>
        <div className="repeater-container">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="repeater-row">
              {/* Row Header */}
              <div className="repeater-row-header">
                <span className="repeater-entry-title">Entry #{rowIndex + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    className="repeater-remove-icon-btn"
                    onClick={() => removeRow(rowIndex)}
                    title="Remove Entry"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
              </div>

              {/* Grid for Inputs */}
              <div className="repeater-grid">
                {childFields.map((child) => {
                  if (!child.id) return null;
                  const childValue = row[child.id] || '';
                  const childOptions = normalizeOptions(child);

                  return (
                    <div key={child.id} className="repeater-child-field">
                      <label className="repeater-child-label">
                        {child.label || child.id}
                        {child.required && <span className="required-star">*</span>}
                      </label>
                      
                      {child.type === 'select' ? (
                        <select
                          className="form-select"
                          value={childValue}
                          onChange={(e) => updateRow(rowIndex, child.id, e.target.value)}
                        >
                          <option value="">Select...</option>
                          {childOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : child.type === 'textarea' ? (
                        <textarea
                          className="form-textarea"
                          value={childValue}
                          placeholder={child.placeholder || ''}
                          onChange={(e) => updateRow(rowIndex, child.id, e.target.value)}
                          rows={2}
                        />
                      ) : (
                        <input
                          className="form-input"
                          type={child.type === 'number' ? 'number' : 'text'}
                          value={childValue}
                          placeholder={child.placeholder || ''}
                          onChange={(e) => updateRow(rowIndex, child.id, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add Button */}
          <button type="button" className="repeater-add-btn" onClick={addRow}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Another {field.label || 'Entry'}
          </button>
        </div>
        
        {errorMessage && <p className="form-field-error">{errorMessage}</p>}
      </div>
    );
  };

  const renderField = (field: FormFieldDefinition) => {
    const type = normalizeFieldType(field.type);
    const errorMessage = errors[field.id];
    const value = values[field.id];

    if (type === 'statement') return renderStatementField(field);
    if (type === 'repeater') return renderRepeaterField(field);

    // Standard Render Logic
    return (
      <div key={field.id} className={`form-field ${errorMessage ? 'has-error' : ''}`}>
        {type !== 'boolean' && (
          <label htmlFor={field.id}>
            {field.label || field.id} {field.required && <span className="required-star">*</span>}
          </label>
        )}
        
        {type === 'textarea' ? (
           <textarea 
             id={field.id} 
             value={value as string || ''} 
             onChange={e => handleTextChange(field.id, e.target.value)} 
             placeholder={field.placeholder || ''}
             className="form-textarea"
           />
        ) : type === 'boolean' ? (
           <label className="checkbox-label">
             <input type="checkbox" checked={!!value} onChange={e => handleTextChange(field.id, e.target.checked)} />
             {field.label}
           </label>
        ) : type === 'select' ? (
           <select 
             id={field.id} 
             value={value as string || ''} 
             onChange={e => handleTextChange(field.id, e.target.value)}
             className="form-select"
           >
             <option value="">Select...</option>
             {normalizeOptions(field).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
           </select>
        ) : type === 'upload' ? (
           <input type="file" onChange={e => handleFileChange(field.id, e.target.files)} className="form-input" />
        ) : (
           <input 
             type={type === 'cnic' ? 'text' : type} 
             id={field.id} 
             value={value as string || ''} 
             onChange={e => handleTextChange(field.id, e.target.value)} 
             placeholder={field.placeholder || ''}
             className="form-input"
           />
        )}
        
        {errorMessage && <p className="form-field-error">{errorMessage}</p>}
      </div>
    );
  };

  // --- Main Render ---
  if (!sections.length) return null;

  const activeSection = sections[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === sections.length - 1;

  return (
    <section className="form-wizard-section" dir={direction}>
      <div className="form-wizard-card">
        
        <div className="form-header">
           <h1 className="form-title">{form.name}</h1>
           <p className="form-description">Comprehensive admission form for Jamia Urwaa.</p>
        </div>

        {/* --- UPDATED STEPPER --- */}
        <div className="form-stepper">
           {sections.map((section, index) => {
             const isCompleted = index < currentStep;
             const isCurrent = index === currentStep;
             
             return (
               <div 
                 key={section.id} 
                 className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
               >
                  <div className="step-indicator">
                    <div className="step-circle">
                      {isCompleted ? (
                        /* Checkmark icon for completed steps */
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="step-label">{section.label}</span>
                  </div>
                  {/* Connector Line (except for the last item) */}
                  {index < sections.length - 1 && (
                    <div className={`step-connector ${isCompleted ? 'active' : ''}`} />
                  )}
               </div>
             );
           })}
        </div>

        <form className="form-step-content" onSubmit={handleSubmit} noValidate onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLastStep && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}>
           <h2 className="step-title">{activeSection.label}</h2>
           {activeSection.description && <p className="step-desc">{activeSection.description}</p>}
           
           <div className="step-fields-grid">
              {(activeSection.childFields || []).map(field => renderField(field))}
           </div>

           {message && (
             <div className={`form-message ${status}`}>{message}</div>
           )}
           <div className="form-footer">
              <button 
                type="button" 
                className="btn-prev" 
                onClick={handlePrev} 
                disabled={isFirstStep}
              >
                PREVIOUS
              </button>

              {/* Render strictly based on state */}
              {isLastStep ? (
                <button 
                  type="submit" 
                  className="btn-next btn-submit"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? 'SUBMITTING...' : 'SUBMIT'}
                </button>
              ) : (
                <button 
                  type="button" // Explicitly type button
                  className="btn-next" 
                  onClick={handleNext} // Pass the function
                >
                  NEXT
                </button>
              )}
           </div>
        </form>

      </div>
    </section>
  );

};

export default FormSection;
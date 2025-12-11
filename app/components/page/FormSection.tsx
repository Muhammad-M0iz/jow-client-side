'use client';

import { useEffect, useMemo, useState, useRef, type ChangeEvent, type FormEvent } from 'react';
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

  // 3. State (added currentPage for section-based pagination)
  const [currentPage, setCurrentPage] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [fileValues, setFileValues] = useState<FileValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  // 4. Ref for scrolling
  const formTopRef = useRef<HTMLElement>(null);

  const scrollToFormTop = () => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    setValues(initialValues);
    setFileValues({});
    setErrors({});
    setStatus('idle');
    setMessage(null);
    setCurrentPage(0);
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
        if (type === 'upload') {
          if (!fileList?.length) isMissing = true;
        } else if (type === 'multiselect') {
          if (!Array.isArray(value) || value.length === 0) isMissing = true;
        } else if (type === 'boolean') {
          if (!value) isMissing = true;
        } else if (type === 'statement') {
          // Statement validation is handled in the specific block below
          isMissing = false;
        } else {
          if (!value) isMissing = true;
        }

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

  const handleNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault(); // Prevent any form submission
    setMessage(null);
    
    // Validate current page fields before moving to next
    const currentSectionFields = sections[currentPage]?.childFields || [];
    const pageErrors = validateFields(currentSectionFields);
    
    if (Object.keys(pageErrors).length > 0) {
      setErrors(pageErrors);
      const firstErrorId = Object.keys(pageErrors)[0];
      document.getElementById(firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    // Scroll to the top of the form section
    scrollToFormTop();
    
    setCurrentPage(prev => Math.min(prev + 1, sections.length - 1));
  };

  const handlePrev = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault(); // Prevent any form submission
    setMessage(null);
    
    // Scroll to the top of the form section
    scrollToFormTop();
    
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate ALL fields on final submit
    const allErrors = validateFields(allFlatFields);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStatus('error');
      setMessage('برائے مہربانی غلطیاں ٹھیک کریں۔ / Please fix the errors before submitting.');
      
      // Find which page has the first error and navigate to it
      const firstErrorId = Object.keys(allErrors)[0];
      const errorPageIndex = sections.findIndex(section => 
        section.childFields?.some(field => field.id === firstErrorId)
      );
      if (errorPageIndex !== -1 && errorPageIndex !== currentPage) {
        setCurrentPage(errorPageIndex);
      }
      setTimeout(() => {
        document.getElementById(firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
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

      const result = await response.json();

      if (!response.ok) {
        // Handle backend validation errors
        if (result?.error?.message) {
          setStatus('error');
          setMessage(result.error.message);
        } else {
          throw new Error('Submission failed');
        }
        
        // Scroll to form top to show error message
        setTimeout(() => {
          scrollToFormTop();
        }, 100);
        return;
      }

      setStatus('success');
      setMessage('شکریہ! آپ کا جواب محفوظ ہو گیا ہے۔ / Thanks! Your response has been recorded.');
      setValues(initialValues);
      setFileValues({});
      setErrors({});
      
      // Scroll to form top to show success message
      setTimeout(() => {
        scrollToFormTop();
      }, 100);
    } catch {
      setStatus('error');
      setMessage('فارم جمع نہیں ہو سکا، دوبارہ کوشش کریں۔ / Unable to submit the form right now. Please try again.');
      
      // Scroll to form top to show error message
      setTimeout(() => {
        scrollToFormTop();
      }, 100);
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
      <div className="form-statement-container" key={field.id}>
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
                   return <input key={`${field.id}-stmt-${index}`} type="date" className="form-statement-inline-input" value={inputValue} onChange={e => handleStatementChange(variableName, e.target.value)} />
                 }
                 // Add other types as needed
              }
              
              return (
                <input
                  key={`${field.id}-stmt-${index}`}
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleStatementChange(variableName, e.target.value)}
                  placeholder={variableName.replace(/_/g, ' ')}
                  className="form-statement-inline-input"
                  aria-label={variableName}
                />
              );
            }
            return <span key={`${field.id}-stmt-span-${index}`}>{part}</span>;
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

  // CNIC Character Boxes Renderer
  const renderCNICField = (field: FormFieldDefinition) => {
    const value = (values[field.id] as string) || '';
    const errorMessage = errors[field.id];
    
    // Parse CNIC format: 12345-1234567-1
    const parts = value.split('-');
    const part1 = (parts[0] || '').padEnd(5, ' ').substring(0, 5).split('');
    const part2 = (parts[1] || '').padEnd(7, ' ').substring(0, 7).split('');
    const part3 = (parts[2] || '').padEnd(1, ' ').substring(0, 1).split('');
    
    const handleCNICChange = (partIndex: number, charIndex: number, newChar: string) => {
      // Only allow digits
      if (newChar && !/^\d$/.test(newChar)) return;
      
      const allParts = [part1, part2, part3];
      allParts[partIndex][charIndex] = newChar;
      
      const newValue = `${allParts[0].join('').trim()}-${allParts[1].join('').trim()}-${allParts[2].join('').trim()}`;
      handleTextChange(field.id, newValue);
      
      // Auto-focus next input
      if (newChar && charIndex < allParts[partIndex].length - 1) {
        const nextInput = document.querySelector(
          `input[data-cnic-field="${field.id}"][data-part="${partIndex}"][data-index="${charIndex + 1}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      } else if (newChar && charIndex === allParts[partIndex].length - 1 && partIndex < 2) {
        const nextInput = document.querySelector(
          `input[data-cnic-field="${field.id}"][data-part="${partIndex + 1}"][data-index="0"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    };
    
    const handleCNICKeyDown = (partIndex: number, charIndex: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      const allParts = [part1, part2, part3];
      const currentValue = (e.target as HTMLInputElement).value;
      
      // Backspace: Clear current and move to previous
      if (e.key === 'Backspace') {
        if (!currentValue || currentValue === ' ') {
          // Move to previous box
          e.preventDefault();
          
          if (charIndex > 0) {
            const prevInput = document.querySelector(
              `input[data-cnic-field="${field.id}"][data-part="${partIndex}"][data-index="${charIndex - 1}"]`
            ) as HTMLInputElement;
            prevInput?.focus();
            // Clear the previous box
            allParts[partIndex][charIndex - 1] = ' ';
            const newValue = `${allParts[0].join('').trim()}-${allParts[1].join('').trim()}-${allParts[2].join('').trim()}`;
            handleTextChange(field.id, newValue);
          } else if (partIndex > 0) {
            const prevPartLength = allParts[partIndex - 1].length;
            const prevInput = document.querySelector(
              `input[data-cnic-field="${field.id}"][data-part="${partIndex - 1}"][data-index="${prevPartLength - 1}"]`
            ) as HTMLInputElement;
            prevInput?.focus();
            // Clear the previous box
            allParts[partIndex - 1][prevPartLength - 1] = ' ';
            const newValue = `${allParts[0].join('').trim()}-${allParts[1].join('').trim()}-${allParts[2].join('').trim()}`;
            handleTextChange(field.id, newValue);
          }
        }
      }
      
      // Arrow Left: Move to previous box
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (charIndex > 0) {
          const prevInput = document.querySelector(
            `input[data-cnic-field="${field.id}"][data-part="${partIndex}"][data-index="${charIndex - 1}"]`
          ) as HTMLInputElement;
          prevInput?.focus();
        } else if (partIndex > 0) {
          const prevPartLength = allParts[partIndex - 1].length;
          const prevInput = document.querySelector(
            `input[data-cnic-field="${field.id}"][data-part="${partIndex - 1}"][data-index="${prevPartLength - 1}"]`
          ) as HTMLInputElement;
          prevInput?.focus();
        }
      }
      
      // Arrow Right: Move to next box
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (charIndex < allParts[partIndex].length - 1) {
          const nextInput = document.querySelector(
            `input[data-cnic-field="${field.id}"][data-part="${partIndex}"][data-index="${charIndex + 1}"]`
          ) as HTMLInputElement;
          nextInput?.focus();
        } else if (partIndex < 2) {
          const nextInput = document.querySelector(
            `input[data-cnic-field="${field.id}"][data-part="${partIndex + 1}"][data-index="0"]`
          ) as HTMLInputElement;
          nextInput?.focus();
        }
      }
    };
    
    return (
      <div key={field.id} className="form-field">
        <label>
          {field.label || field.id} {field.required && <span className="required-star">*</span>}
        </label>
        <div className="cnic-input-container">
          <div className="cnic-boxes-group">
            {part1.map((char, idx) => (
              <input
                key={`p1-${idx}`}
                type="text"
                maxLength={1}
                value={char.trim()}
                onChange={e => handleCNICChange(0, idx, e.target.value)}
                onKeyDown={e => handleCNICKeyDown(0, idx, e)}
                className="cnic-char-box"
                data-cnic-field={field.id}
                data-part="0"
                data-index={idx}
              />
            ))}
          </div>
          <span className="cnic-separator">-</span>
          <div className="cnic-boxes-group">
            {part2.map((char, idx) => (
              <input
                key={`p2-${idx}`}
                type="text"
                maxLength={1}
                value={char.trim()}
                onChange={e => handleCNICChange(1, idx, e.target.value)}
                onKeyDown={e => handleCNICKeyDown(1, idx, e)}
                className="cnic-char-box"
                data-cnic-field={field.id}
                data-part="1"
                data-index={idx}
              />
            ))}
          </div>
          <span className="cnic-separator">-</span>
          <div className="cnic-boxes-group">
            {part3.map((char, idx) => (
              <input
                key={`p3-${idx}`}
                type="text"
                maxLength={1}
                value={char.trim()}
                onChange={e => handleCNICChange(2, idx, e.target.value)}
                onKeyDown={e => handleCNICKeyDown(2, idx, e)}
                className="cnic-char-box"
                data-cnic-field={field.id}
                data-part="2"
                data-index={idx}
              />
            ))}
          </div>
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
    if (type === 'cnic') return renderCNICField(field);

    // Standard Render Logic
    return (
      <div key={field.id} className={`form-field ${type === 'textarea' ? 'textarea-field' : ''} ${errorMessage ? 'has-error' : ''}`}>
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
           <div className="single-checkbox-container">
             <input 
               type="checkbox" 
               id={field.id}
               checked={!!value} 
               onChange={e => handleTextChange(field.id, e.target.checked)} 
             />
             <label htmlFor={field.id}>{field.label}</label>
           </div>
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
        ) : type === 'radio' ? (
           <div className="radio-group">
             {normalizeOptions(field).map((opt) => (
               <label key={opt.value} className="radio-label">
                 <input
                   type="radio"
                   name={field.id}
                   value={opt.value}
                   checked={value === opt.value}
                   onChange={(e) => handleTextChange(field.id, e.target.value)}
                 />
                 {opt.label}
               </label>
             ))}
           </div>
        ) : type === 'multiselect' ? (
           <div className="checkbox-group">
             {normalizeOptions(field).map((opt) => (
               <label key={opt.value} className="checkbox-label">
                 <input
                   type="checkbox"
                   checked={(value as string[] || []).includes(opt.value)}
                   onChange={(e) => {
                     const currentValues = (Array.isArray(value) ? value : []) as string[];
                     
                     if (e.target.checked) {
                       handleTextChange(field.id, [...currentValues, opt.value]);
                     } else {
                       handleTextChange(field.id, currentValues.filter((v) => v !== opt.value));
                     }
                   }}
                 />
                 <span className="checkbox-text">{opt.label}</span>
               </label>
             ))}
           </div>
        ) : type === 'upload' ? (
           <input type="file" onChange={e => handleFileChange(field.id, e.target.files)} className="form-input" />
        ) : (
           <input 
             type={type} 
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

  // --- Main Render - Paginated Paper Form ---
  if (!sections.length) return null;

  const currentSection = sections[currentPage];
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === sections.length - 1;
  const totalPages = sections.length;

  return (
    <section className="form-wizard-section" dir={direction} ref={formTopRef}>
      <div className="form-wizard-card">
        
        <div className="form-header">
           <h1 className="form-title">{form.name}</h1>
           {form.slug && <p className="form-description">{form.slug}</p>}
        </div>

        {/* Page indicator */}
        <div className="page-indicator">
          <span className="page-number">صفحہ {currentPage + 1} از {totalPages} / Page {currentPage + 1} of {totalPages}</span>
          <div className="page-dots">
            {sections.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`page-dot ${index === currentPage ? 'active' : ''} ${index < currentPage ? 'completed' : ''}`}
                onClick={(e) => {
                  e.preventDefault(); // Prevent any form submission
                  setCurrentPage(index);
                  scrollToFormTop();
                }}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <form 
          className="form-step-content" 
          onSubmit={handleSubmit} 
          noValidate
          onKeyDown={(e) => {
            // Prevent Enter key from submitting the form
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'submit') {
              e.preventDefault();
            }
          }}
        >
           {/* Render only current section */}
           <div className="form-section-block">
             <h2 className="step-title">{currentSection.label}</h2>
             {currentSection.description && <p className="step-desc">{currentSection.description}</p>}
             
             <div className="step-fields-grid">
                {(currentSection.childFields || []).map(field => renderField(field))}
             </div>
           </div>

           {message && (
             <div className={`form-message ${status}`}>{message}</div>
           )}
           
           <div className="form-footer">
              <button 
                type="button" 
                className="btn-prev" 
                onClick={handlePrev} 
                disabled={isFirstPage}
              >
                ← پچھلا / PREVIOUS
              </button>

              {isLastPage ? (
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? 'جمع کروائیں...' : 'جمع کروائیں / SUBMIT'}
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn-next" 
                  onClick={handleNext}
                >
                  اگلا / NEXT →
                </button>
              )}
           </div>
        </form>

      </div>
    </section>
  );

};

export default FormSection;
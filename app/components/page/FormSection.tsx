'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import './FormSection.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

const SUPPORTED_TYPES = [
  'text',
  'textarea',
  'number',
  'email',
  'select',
  'upload',
  'date',
  'time',
  'datetime',
  'boolean',
  'radio',
  'phone',
  'multiselect',
  'url',
  'cnic',
  'repeater',
  'section', // Added section type
] as const;

type SupportedFieldType = (typeof SUPPORTED_TYPES)[number];

type RepeaterRowValue = Record<string, string>;
type FieldValue = string | string[] | boolean | RepeaterRowValue[];
type FormValues = Record<string, FieldValue>;
type FileValues = Record<string, File[]>;

type NormalizedOption = {
  label: string;
  value: string;
};

export type FormFieldDefinition = {
  id: string;
  type?: string | null;
  label?: string | null;
  description?: string | null; // Added description for sections
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
  fields: FormFieldDefinition[]; // These are now Section objects
};

export type FormSectionProps = {
  form: FormSectionData;
  direction?: 'ltr' | 'rtl';
};

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

const normalizeFieldType = (value?: string | null): SupportedFieldType => {
  if (!value) return 'text';
  const lowered = value.toLowerCase();
  if (SUPPORTED_TYPES.includes(lowered as SupportedFieldType)) {
    return lowered as SupportedFieldType;
  }
  if (lowered === 'datetime-local') return 'datetime';
  if (lowered === 'checkbox') return 'boolean';
  return 'text';
};

const normalizeOptions = (field: FormFieldDefinition): NormalizedOption[] => {
  const rawOptions = field.options ?? field.validation?.options ?? [];
  return rawOptions
    .map((option) => {
      if (typeof option === 'string') {
        const trimmed = option.trim();
        if (!trimmed) {
          return null;
        }
        return { label: trimmed, value: trimmed } satisfies NormalizedOption;
      }
      if (option && typeof option === 'object') {
        const resolvedValue = option.value ?? option.label ?? '';
        if (!resolvedValue) {
          return null;
        }
        return {
          label: option.label ?? option.value ?? resolvedValue,
          value: resolvedValue,
        } satisfies NormalizedOption;
      }
      return null;
    })
    .filter((entry): entry is NormalizedOption => Boolean(entry));
};

const buildInitialValues = (allFields: FormFieldDefinition[]): FormValues => {
  return allFields.reduce<FormValues>((acc, field) => {
    if (!field.id) return acc;
    const type = normalizeFieldType(field.type);
    
    // Skip sections in value map, only map inputs
    if (type === 'section') return acc;

    if (type === 'repeater') {
      const childFields = field.childFields || [];
      const emptyRow: RepeaterRowValue = {};
      childFields.forEach((child) => {
        if (child.id) emptyRow[child.id] = '';
      });
      acc[field.id] = [emptyRow];
    } else if (type === 'multiselect') {
      acc[field.id] = [];
    } else if (type === 'boolean') {
      acc[field.id] = false;
    } else {
      acc[field.id] = '';
    }
    return acc;
  }, {});
};

const getAcceptValue = (field: FormFieldDefinition) => {
  const allowed = field.validation?.allowedTypes;
  if (!allowed?.length) return undefined;
  const acceptList = allowed.map((candidate) => {
    if (!candidate) return null;
    return candidate.includes('/') ? candidate : `${candidate}/*`;
  });
  return acceptList.filter(Boolean).join(', ') || undefined;
};

const FormSection = ({ form, direction = 'ltr' }: FormSectionProps) => {
  // 1. We keep 'sections' for rendering the layout
  const sections = useMemo(() => form.fields || [], [form.fields]);

  // 2. We flatten all fields inside sections to handle state and validation easily
  const flatFields = useMemo(() => {
    return sections.flatMap(section => section.childFields || []).filter(field => !!field.id);
  }, [sections]);

  const initialValues = useMemo(() => buildInitialValues(flatFields), [flatFields]);
  
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
  }, [initialValues]);

  if (!sections.length) {
    return null;
  }

  const clearError = (fieldId: string) => {
    setErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleTextChange = (fieldId: string, value: string | string[] | boolean) => {
    setValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    clearError(fieldId);
  };

  const handleFileChange = (fieldId: string, fileList: FileList | null) => {
    setFileValues((prev) => {
      if (!fileList?.length) {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      }
      return {
        ...prev,
        [fieldId]: Array.from(fileList),
      };
    });
    clearError(fieldId);
  };

  const getFieldErrorLabel = (field: FormFieldDefinition) => field.label ?? field.placeholder ?? field.id;

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    // Validate using the flattened list of actual inputs
    flatFields.forEach((field) => {
      const fieldId = field.id;
      const type = normalizeFieldType(field.type);
      const value = values[fieldId];
      const fileList = fileValues[fieldId];
      const label = getFieldErrorLabel(field);
      const options = normalizeOptions(field);

      const requiredMessage = `${label} is required.`;

      if (field.required) {
        if (type === 'upload') {
          if (!fileList?.length) {
            nextErrors[fieldId] = requiredMessage;
            return;
          }
        } else if (type === 'multiselect') {
          if (!Array.isArray(value) || value.length === 0) {
            nextErrors[fieldId] = requiredMessage;
            return;
          }
        } else if (type === 'boolean') {
          if (!value) {
            nextErrors[fieldId] = requiredMessage;
            return;
          }
        } else if (!value) {
          nextErrors[fieldId] = requiredMessage;
          return;
        }
      }

      if (!value && type !== 'boolean') {
        return;
      }

      switch (type) {
        case 'email':
          if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            nextErrors[fieldId] = 'Please enter a valid email address.';
          }
          break;
        case 'phone':
          if (typeof value === 'string' && !/^\+?[\d\s-]+$/.test(value)) {
            nextErrors[fieldId] = 'Please enter a valid phone number.';
          }
          break;
        case 'cnic':
          // Pakistani CNIC format: 12345-1234567-1
          if (typeof value === 'string' && !/^\d{5}-\d{7}-\d{1}$/.test(value)) {
            nextErrors[fieldId] = 'Please enter a valid CNIC (format: 12345-1234567-1).';
          }
          break;
        case 'number':
          if (typeof value === 'string' && Number.isNaN(Number(value))) {
            nextErrors[fieldId] = 'Please enter a numeric value.';
          }
          break;
        case 'url':
          if (typeof value === 'string') {
            try {
              // eslint-disable-next-line no-new
              new URL(value);
            } catch {
              nextErrors[fieldId] = 'Please enter a valid URL.';
            }
          }
          break;
        case 'select':
        case 'radio': {
          const allowed = new Set(options.map((option) => option.value));
          if (typeof value === 'string' && value && allowed.size && !allowed.has(value)) {
            nextErrors[fieldId] = 'Please select a valid option.';
          }
          break;
        }
        case 'multiselect': {
          const allowed = new Set(options.map((option) => option.value));
          if (Array.isArray(value) && value.length && allowed.size) {
            const stringValues = value.filter((v): v is string => typeof v === 'string');
            const invalid = stringValues.some((entry) => !allowed.has(entry));
            if (invalid) {
              nextErrors[fieldId] = 'One or more selections are invalid.';
            }
          }
          break;
        }
        case 'repeater': {
          if (Array.isArray(value)) {
            const rows = value as RepeaterRowValue[];
            const childFields = field.childFields || [];
            
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
              const row = rows[rowIndex];
              for (const childField of childFields) {
                if (!childField.id) continue;
                const childValue = row[childField.id] || '';
                const childLabel = `${childField.label || childField.id} (Row ${rowIndex + 1})`;

                if (childField.required && !childValue) {
                  nextErrors[fieldId] = `${childLabel} is required.`;
                  return;
                }
              }
            }
          }
          break;
        }
        default:
          break;
      }
    });

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setStatus('error');
      setMessage('Please fix the highlighted fields and try again.');
      return;
    }

    const documentId = form.documentId ?? String(form.id);
    if (!documentId) {
      setStatus('error');
      setMessage('Missing form identifier.');
      return;
    }

    const formData = new FormData();

    Object.entries(values).forEach(([fieldId, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        formData.append(fieldId, JSON.stringify(value));
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (typeof entry === 'string' && entry !== '') {
            formData.append(fieldId, entry);
          }
        });
        return;
      }

      if (typeof value === 'boolean') {
        formData.append(fieldId, value ? 'true' : 'false');
        return;
      }

      if (value !== '') {
        formData.append(fieldId, value);
      }
    });

    Object.entries(fileValues).forEach(([fieldId, files]) => {
      files.forEach((file) => {
        formData.append(fieldId, file);
      });
    });

    setStatus('submitting');

    try {
      const response = await fetch(`${API_BASE_URL}/api/form-builder/forms/${documentId}/submit`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Unable to submit the form right now.';
        try {
          const payload = await response.json();
          errorMessage = payload?.error?.message ?? payload?.message ?? errorMessage;
        } catch {
          // ignore
        }
        throw new Error(errorMessage);
      }

      setStatus('success');
      setMessage('Thanks! Your response has been recorded.');
      setValues(initialValues);
      setFileValues({});
      setErrors({});
    } catch (error) {
      const fallback = error instanceof Error ? error.message : 'Unable to submit the form right now.';
      setStatus('error');
      setMessage(fallback);
    }
  };

  // --- Render Helpers (Text, Select, Radio, etc.) same as before ---
  const renderTextInput = (field: FormFieldDefinition, typeAttribute: string) => {
    const fieldId = field.id;
    const value = values[fieldId];
    const errorMessage = errors[fieldId];
    const describedBy = errorMessage ? `${fieldId}-error` : undefined;

    if (typeAttribute === 'textarea') {
      return (
        <textarea
          id={fieldId}
          name={fieldId}
          placeholder={field.placeholder ?? ''}
          value={typeof value === 'string' ? value : ''}
          required={Boolean(field.required)}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={describedBy}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => handleTextChange(fieldId, event.target.value)}
        />
      );
    }

    return (
      <input
        id={fieldId}
        name={fieldId}
        type={typeAttribute}
        placeholder={field.placeholder ?? ''}
        value={typeof value === 'string' ? value : ''}
        required={Boolean(field.required)}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={describedBy}
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleTextChange(fieldId, event.target.value)}
      />
    );
  };

  const renderSelectField = (field: FormFieldDefinition, multiple = false) => {
    const fieldId = field.id;
    const value = values[fieldId];
    const errorMessage = errors[fieldId];
    const describedBy = errorMessage ? `${fieldId}-error` : undefined;
    const options = normalizeOptions(field);

    const selectValue = multiple
      ? (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [])
      : (typeof value === 'string' ? value : '');

    return (
      <select
        id={fieldId}
        name={fieldId}
        multiple={multiple}
        value={selectValue}
        required={Boolean(field.required)}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={describedBy}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          if (multiple) {
            const selections = Array.from(event.target.selectedOptions, (option) => option.value);
            handleTextChange(fieldId, selections);
            return;
          }
          handleTextChange(fieldId, event.target.value);
        }}
      >
        {multiple ? null : (
          <option value="">{field.placeholder ?? 'Select an option'}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };

  const renderRadioField = (field: FormFieldDefinition) => {
    const fieldId = field.id;
    const value = values[fieldId];
    const errorMessage = errors[fieldId];
    const describedBy = errorMessage ? `${fieldId}-error` : undefined;
    const options = normalizeOptions(field);

    return (
      <div className="form-radio-group" role="radiogroup" aria-describedby={describedBy}>
        {options.map((option) => {
          const optionId = `${fieldId}-${option.value}`;
          return (
            <label key={option.value} htmlFor={optionId} className="form-radio-option">
              <input
                type="radio"
                id={optionId}
                name={fieldId}
                value={option.value}
                checked={value === option.value}
                required={Boolean(field.required)}
                onChange={(event: ChangeEvent<HTMLInputElement>) => handleTextChange(fieldId, event.target.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderBooleanField = (field: FormFieldDefinition) => {
    const fieldId = field.id;
    const value = values[fieldId];
    const errorMessage = errors[fieldId];
    const describedBy = errorMessage ? `${fieldId}-error` : undefined;

    return (
      <label className="form-checkbox" htmlFor={fieldId}>
        <input
          id={fieldId}
          name={fieldId}
          type="checkbox"
          checked={Boolean(value)}
          required={Boolean(field.required)}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={describedBy}
          onChange={(event: ChangeEvent<HTMLInputElement>) => handleTextChange(fieldId, event.target.checked)}
        />
        <span>{field.label ?? field.placeholder ?? fieldId}</span>
      </label>
    );
  };

  const renderUploadField = (field: FormFieldDefinition) => {
    const fieldId = field.id;
    const errorMessage = errors[fieldId];
    const describedBy = errorMessage ? `${fieldId}-error` : undefined;

    return (
      <input
        id={fieldId}
        name={fieldId}
        type="file"
        required={Boolean(field.required)}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={describedBy}
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleFileChange(fieldId, event.target.files)}
        accept={getAcceptValue(field)}
      />
    );
  };

  const renderRepeaterField = (field: FormFieldDefinition) => {
    const fieldId = field.id;
    const value = values[fieldId];
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
      if (rows.length <= 1) return;
      setValues((prev) => ({
        ...prev,
        [fieldId]: rows.filter((_, i) => i !== rowIndex),
      }));
      clearError(fieldId);
    };

    const updateRowField = (rowIndex: number, childFieldId: string, newValue: string) => {
      setValues((prev) => {
        const updatedRows = [...rows];
        updatedRows[rowIndex] = {
          ...updatedRows[rowIndex],
          [childFieldId]: newValue,
        };
        return {
          ...prev,
          [fieldId]: updatedRows,
        };
      });
      clearError(fieldId);
    };

    const getChildInputType = (childType?: string | null): string => {
        switch (childType) {
          case 'email': return 'email';
          case 'phone': return 'tel';
          case 'number': return 'number';
          case 'date': return 'date';
          default: return 'text';
        }
      };
  
      return (
        <div className="repeater-field">
          <div className="repeater-rows">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="repeater-row">
                <div className="repeater-row-number">{rowIndex + 1}</div>
                <div className="repeater-row-fields">
                  {childFields.map((childField) => {
                    if (!childField.id) return null;
                    const childValue = row[childField.id] || '';
                    const childOptions = normalizeOptions(childField);
  
                    return (
                      <div key={childField.id} className="repeater-child-field">
                        <label>
                          {childField.label || childField.id}
                          {childField.required ? <span className="required-indicator">*</span> : null}
                        </label>
                        {childField.type === 'select' ? (
                          <select
                            value={childValue}
                            onChange={(e) => updateRowField(rowIndex, childField.id, e.target.value)}
                          >
                            <option value="">Select...</option>
                            {childOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : childField.type === 'textarea' ? (
                          <textarea
                            value={childValue}
                            placeholder={childField.placeholder || ''}
                            onChange={(e) => updateRowField(rowIndex, childField.id, e.target.value)}
                            rows={3}
                          />
                        ) : (
                          <input
                            type={getChildInputType(childField.type)}
                            value={childValue}
                            placeholder={childField.placeholder || ''}
                            onChange={(e) => updateRowField(rowIndex, childField.id, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="repeater-remove-btn"
                  onClick={() => removeRow(rowIndex)}
                  disabled={rows.length <= 1}
                  title="Remove row"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="repeater-add-btn" onClick={addRow}>
            + Add {field.label || 'Entry'}
          </button>
          {errorMessage ? (
            <p className="form-field-error">{errorMessage}</p>
          ) : null}
        </div>
      );
    };

  const renderField = (field: FormFieldDefinition) => {
    const type = normalizeFieldType(field.type);
    const errorMessage = errors[field.id];
    const describedBy = errorMessage ? `${field.id}-error` : undefined;

    return (
      <div key={field.id} className={`form-field ${errorMessage ? 'has-error' : ''}`}>
        {type !== 'boolean' ? (
          <label htmlFor={field.id}>
            <span>{field.label ?? field.placeholder ?? field.id}</span>
            {field.required ? <span className="required-indicator" aria-hidden="true">*</span> : null}
          </label>
        ) : null}

        {(() => {
          switch (type) {
            case 'textarea': return renderTextInput(field, 'textarea');
            case 'email': return renderTextInput(field, 'email');
            case 'phone': return renderTextInput(field, 'tel');
            case 'number': return renderTextInput(field, 'number');
            case 'date': return renderTextInput(field, 'date');
            case 'time': return renderTextInput(field, 'time');
            case 'datetime': return renderTextInput(field, 'datetime-local');
            case 'url': return renderTextInput(field, 'url');
            case 'cnic': return renderTextInput(field, 'text');
            case 'select': return renderSelectField(field);
            case 'multiselect': return renderSelectField(field, true);
            case 'radio': return renderRadioField(field);
            case 'boolean': return renderBooleanField(field);
            case 'upload': return renderUploadField(field);
            case 'repeater': return renderRepeaterField(field);
            default: return renderTextInput(field, 'text');
          }
        })()}

        {errorMessage ? (
          <p id={describedBy} className="form-field-error">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  };

  // --- Main Render: Iterate over SECTIONS now ---
  return (
    <section className="form-section" dir={direction} aria-live="polite">
      <div className="form-card">
        <div className="form-section-header">
          <div>
            <h2 className="form-section-title">{form.name ?? 'Form'}</h2>
            {form.slug ? <p className="form-section-slug">/{form.slug}</p> : null}
          </div>
          <div className={`form-status ${status}`} aria-live="polite">
            {status === 'submitting' ? 'Submitting…' : status === 'success' ? 'Ready' : null}
          </div>
        </div>
        
        <form className="form-fields" onSubmit={handleSubmit} noValidate>
          {sections.map((section) => (
            <div key={section.id} className="form-section-group">
                <div className="form-section-group-header">
                    <h3 className="form-section-group-title">{section.label}</h3>
                    {section.description && (
                        <p className="form-section-group-desc">{section.description}</p>
                    )}
                </div>
                
                <div className="form-section-group-fields">
                    {/* Render fields inside the section */}
                    {(section.childFields || []).map((field) => renderField(field))}
                </div>
            </div>
          ))}

          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Submitting…' : 'Submit form'}
            </button>
          </div>
          {message ? (
            <div className={`form-message ${status === 'success' ? 'success' : 'error'}`} role="status">
              {message}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
};

export default FormSection;
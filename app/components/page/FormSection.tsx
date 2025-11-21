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
] as const;

type SupportedFieldType = (typeof SUPPORTED_TYPES)[number];

type FieldValue = string | string[] | boolean;
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
  placeholder?: string | null;
  required?: boolean | null;
  options?: Array<string | { label?: string | null; value?: string | null }> | null;
  validation?: {
    options?: string[];
    allowedTypes?: string[];
    pattern?: string;
  } | null;
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

const buildInitialValues = (fields: FormFieldDefinition[]): FormValues => {
  return fields.reduce<FormValues>((acc, field) => {
    if (!field.id) return acc;
    const type = normalizeFieldType(field.type);
    if (type === 'multiselect') {
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
  const fields = useMemo(() => form.fields.filter((field) => !!field.id), [form.fields]);
  const initialValues = useMemo(() => buildInitialValues(fields), [fields]);
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

  if (!fields.length) {
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

    fields.forEach((field) => {
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
            const invalid = value.some((entry) => !allowed.has(entry));
            if (invalid) {
              nextErrors[fieldId] = 'One or more selections are invalid.';
            }
          }
          break;
        }
        default:
          break;
      }

      if (field.validation?.pattern && typeof value === 'string') {
        try {
          const regexp = new RegExp(field.validation.pattern);
          if (!regexp.test(value)) {
            nextErrors[fieldId] = 'Value does not match the expected format.';
          }
        } catch {
          // Ignore invalid patterns
        }
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
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry !== undefined && entry !== null && entry !== '') {
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
          // ignore json parse errors
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

    return (
      <select
        id={fieldId}
        name={fieldId}
        multiple={multiple}
        value={multiple && Array.isArray(value) ? value : !multiple && typeof value === 'string' ? value : multiple ? [] : ''}
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
            case 'textarea':
              return renderTextInput(field, 'textarea');
            case 'email':
              return renderTextInput(field, 'email');
            case 'phone':
              return renderTextInput(field, 'tel');
            case 'number':
              return renderTextInput(field, 'number');
            case 'date':
              return renderTextInput(field, 'date');
            case 'time':
              return renderTextInput(field, 'time');
            case 'datetime':
              return renderTextInput(field, 'datetime-local');
            case 'url':
              return renderTextInput(field, 'url');
            case 'select':
              return renderSelectField(field);
            case 'multiselect':
              return renderSelectField(field, true);
            case 'radio':
              return renderRadioField(field);
            case 'boolean':
              return renderBooleanField(field);
            case 'upload':
              return renderUploadField(field);
            default:
              return renderTextInput(field, 'text');
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
          {fields.map((field) => renderField(field))}
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

import './TableSection.css';

export type TableColumn = {
  type?: string | null;
  label?: string | null;
  required?: boolean | null;
};

export type TableSectionData = {
  id: number | string;
  title?: string | null;
  Table?: {
    rows?: string[][] | null;
    columns?: TableColumn[] | null;
  } | null;
};

type TableSectionProps = {
  section: TableSectionData;
  direction?: 'ltr' | 'rtl';
};

export default function TableSection({ section, direction = 'ltr' }: TableSectionProps) {
  const { title, Table: tableData } = section;
  const rows = tableData?.rows || [];
  const columns = tableData?.columns || [];

  if (!rows.length || !columns.length) {
    return null;
  }

  return (
    <section className="table-section" dir={direction}>
      {title && <h2 className="table-section-title">{title}</h2>}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>
                  {column.label || `Column ${index + 1}`}
                  {column.required && <span className="required-indicator">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

'use client';

import React from 'react';

export interface TableColumn<T = Record<string, any>> {
  key: string;
  title: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  className?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export default function Table<T = any>({
  data,
  columns,
  className = '',
  onRowClick,
  loading = false,
  emptyMessage = 'No data available'
}: TableProps<T>) {
  const baseClasses = 'w-full overflow-hidden rounded-lg border transition-all duration-300';
  
  const tableClasses = `
    ${baseClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  if (loading) {
    return (
      <div className={tableClasses} style={{
        backgroundColor: 'var(--soft-graphite)',
        borderColor: 'var(--border-primary)',
        borderRadius: 'var(--radius-card)'
      }}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{
            borderColor: 'var(--dusty-gold)',
            borderTopColor: 'var(--dusty-gold)',
            borderWidth: '2px',
            borderStyle: 'solid'
          }}></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={tableClasses} style={{
        backgroundColor: 'var(--soft-graphite)',
        borderColor: 'var(--border-primary)',
        borderRadius: 'var(--radius-card)'
      }}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-lg font-medium mb-2" style={{
              color: 'var(--muted-gray)',
              fontSize: 'var(--text-h2)',
              fontWeight: 'var(--font-weight-h2)'
            }}>No Data</div>
            <p className="text-sm" style={{
              color: 'var(--muted-gray)',
              fontSize: 'var(--text-body)'
            }}>{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={tableClasses} style={{
      backgroundColor: 'var(--soft-graphite)',
      borderColor: 'var(--border-primary)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden'
    }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{
              borderBottom: '0.8px solid var(--border-primary)'
            }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left font-medium"
                  style={{
                    width: column.width,
                    fontSize: 'var(--text-body)',
                    fontWeight: 'var(--font-weight-h2)',
                    color: 'var(--warm-off-white)',
                    backgroundColor: 'var(--soft-graphite)',
                    borderBottom: '0.8px solid var(--border-primary)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && (
                      <div className="w-3 h-3 rounded border border-[var(--border-primary)] flex items-center justify-center" style={{
                        borderColor: 'var(--border-primary)'
                      }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{
                          color: 'var(--dusty-gold)'
                        }}>
                          <path d="M4 4l4 4m0 0l-4-4m0 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className={`border-b transition-colors duration-200 ${
                  onRowClick ? 'hover:bg-[rgba(184,155,94,0.05)] cursor-pointer' : ''
                }`}
                style={{
                  borderBottomColor: 'var(--border-primary)',
                  transition: 'var(--transition-fast)'
                }}
                onClick={() => handleRowClick(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 ${column.className || ''}`}
                    style={{
                      fontSize: 'var(--text-body)',
                      color: 'var(--warm-off-white)',
                      borderBottomColor: 'var(--border-primary)'
                    }}
                  >
                    {column.render ? column.render(row[column.key] as any, row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
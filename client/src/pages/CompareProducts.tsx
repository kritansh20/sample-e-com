import React, { useState } from 'react';
import styled from 'styled-components';

interface CompareProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  stock: number;
  category: string;
}

const SAMPLES: Record<string, CompareProduct> = {
  A: {
    id: 'A',
    name: 'Product A - Classic Watch',
    price: 199.0,
    rating: 4.5,
    stock: 20,
    category: 'Accessories',
  },
  B: {
    id: 'B',
    name: 'Product B - Smart Watch',
    price: 249.0,
    rating: 4.2,
    stock: 12,
    category: 'Electronics',
  },
  C: {
    id: 'C',
    name: 'Product C - Fitness Band',
    price: 89.5,
    rating: 4.0,
    stock: 35,
    category: 'Electronics',
  },
};

const Page = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 20px;
  color: #222;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  th,
  td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    background: #f6f8fa;
    font-weight: 600;
    color: #333;
  }
`;

const Empty = styled.div`
  padding: 40px;
  background: white;
  border-radius: 8px;
  text-align: center;
  color: #888;
`;

export default function CompareProducts() {
  const [selected, setSelected] = useState<CompareProduct[]>([]);

  const addSample = (key: 'A' | 'B' | 'C') => {
    const p = SAMPLES[key];
    if (selected.some((s) => s.id === p.id)) return;
    setSelected((prev) => [...prev, p]);
  };

  const remove = (id: string) => {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAll = () => setSelected([]);

  return (
    <Page data-testid="compare-page">
      <Title>Compare Products</Title>
      <Controls>
        <button
          className="btn-primary"
          data-testid="compare-add-a"
          onClick={() => addSample('A')}
        >
          Add Product A
        </button>
        <button
          className="btn-primary"
          data-testid="compare-add-b"
          onClick={() => addSample('B')}
        >
          Add Product B
        </button>
        <button
          className="btn-primary"
          data-testid="compare-add-c"
          onClick={() => addSample('C')}
        >
          Add Product C
        </button>
        <button
          className="btn-danger"
          data-testid="compare-clear-button"
          onClick={clearAll}
          disabled={selected.length === 0}
        >
          Clear
        </button>
      </Controls>

      <div data-testid="compare-count">Selected: {selected.length}</div>

      {selected.length === 0 ? (
        <Empty>
          No products selected. Add one to start comparing.
        </Empty>
      ) : (
        <Table data-testid="compare-table">
          <thead>
            <tr>
              <th>Attribute</th>
              {selected.map((p) => (
                <th key={p.id} data-testid="compare-column-head">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr data-testid="compare-row-price">
              <td>Price</td>
              {selected.map((p) => (
                <td key={p.id} data-testid="compare-cell-price">
                  ${p.price.toFixed(2)}
                </td>
              ))}
            </tr>
            <tr data-testid="compare-row-rating">
              <td>Rating</td>
              {selected.map((p) => (
                <td key={p.id} data-testid="compare-cell-rating">
                  {p.rating.toFixed(1)}
                </td>
              ))}
            </tr>
            <tr data-testid="compare-row-stock">
              <td>Stock</td>
              {selected.map((p) => (
                <td key={p.id} data-testid="compare-cell-stock">
                  {p.stock}
                </td>
              ))}
            </tr>
            <tr data-testid="compare-row-category">
              <td>Category</td>
              {selected.map((p) => (
                <td key={p.id} data-testid="compare-cell-category">
                  {p.category}
                </td>
              ))}
            </tr>
            <tr>
              <td></td>
              {selected.map((p) => (
                <td key={p.id}>
                  <button
                    className="btn-outline"
                    data-testid="compare-remove-button"
                    onClick={() => remove(p.id)}
                  >
                    Remove
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </Table>
      )}
    </Page>
  );
}

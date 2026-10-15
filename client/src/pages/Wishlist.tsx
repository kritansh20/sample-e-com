import React, { useState } from 'react';
import styled from 'styled-components';

interface WishlistItem {
  id: number;
  name: string;
  price: number;
}

const SAMPLE_ITEMS: WishlistItem[] = [
  { id: 101, name: 'Blue Cotton Shirt', price: 29.99 },
  { id: 102, name: 'Leather Wallet', price: 49.5 },
  { id: 103, name: 'Running Shoes', price: 89.0 },
  { id: 104, name: 'Wireless Headphones', price: 129.99 },
  { id: 105, name: 'Stainless Water Bottle', price: 19.75 },
];

const Page = styled.div`
  max-width: 900px;
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
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
`;

const Empty = styled.div`
  padding: 40px;
  background: white;
  border-radius: 8px;
  text-align: center;
  color: #888;
`;

const Counter = styled.div`
  font-weight: 500;
  margin-bottom: 12px;
  color: #555;
`;

export default function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [nextIdx, setNextIdx] = useState(0);

  const addSample = () => {
    const candidate = SAMPLE_ITEMS[nextIdx % SAMPLE_ITEMS.length];
    if (items.some((i) => i.id === candidate.id)) {
      setNextIdx((n) => n + 1);
      return;
    }
    setItems((prev) => [...prev, candidate]);
    setNextIdx((n) => n + 1);
  };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearAll = () => setItems([]);

  return (
    <Page data-testid="wishlist-page">
      <Title>My Wishlist</Title>
      <Controls>
        <button
          className="btn-primary"
          data-testid="wishlist-add-sample"
          onClick={addSample}
        >
          Add Sample Item
        </button>
        <button
          className="btn-danger"
          data-testid="wishlist-clear-all"
          onClick={clearAll}
          disabled={items.length === 0}
        >
          Clear All
        </button>
      </Controls>
      <Counter data-testid="wishlist-count">
        Items: {items.length}
      </Counter>
      {items.length === 0 ? (
        <Empty>
          Your wishlist is empty. Add an item to get started.
        </Empty>
      ) : (
        <div data-testid="wishlist-list">
          {items.map((item) => (
            <ItemRow key={item.id} data-testid="wishlist-item">
              <div>
                <div data-testid="wishlist-item-name">{item.name}</div>
                <div data-testid="wishlist-item-price">
                  ${item.price.toFixed(2)}
                </div>
              </div>
              <button
                className="btn-outline"
                data-testid="wishlist-remove-button"
                onClick={() => remove(item.id)}
              >
                Remove
              </button>
            </ItemRow>
          ))}
        </div>
      )}
    </Page>
  );
}

import { findActiveCartItems } from "@/lib/domain/orders";

export default async function Page() {
  const items = await findActiveCartItems();

  return (
    <>
      <h1>Товары в корзине</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.productNameSnapshot} - {item.quantity} x {item.unitPriceSnapshot} ₽
          </li>
        ))}
      </ul>
    </>
  );
}

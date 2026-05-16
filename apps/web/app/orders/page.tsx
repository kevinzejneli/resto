export default function OrdersPage() {
  return (
    <>
      <h1>WhatsApp Orders</h1>
      <p>Inbound customer conversations turned into orders.</p>
      <div className="placeholder">
        Domain types live in <code>@resto/core</code> (
        <code>OrderingService</code>). Inbound webhook:{" "}
        <code>/api/webhooks/whatsapp</code>.
      </div>
    </>
  );
}

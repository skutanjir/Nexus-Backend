const fs = require('fs');

let checkoutPath = '../nexus-react/src/pages/shop/Checkout.tsx';
let checkoutStr = fs.readFileSync(checkoutPath, 'utf8');

checkoutStr = checkoutStr.replace(
  'items: cartItems',
  `items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price_at_purchase: item.price
        }))`
);

fs.writeFileSync(checkoutPath, checkoutStr);

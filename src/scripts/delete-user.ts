import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function deleteUser(userId: number) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'uteshop_db',
  });

  try {
    console.log(`🗑️  Starting deletion process for user ID: ${userId}`);

    // Start transaction
    await connection.beginTransaction();

    // 1. Delete product reviews
    await connection.query('DELETE FROM product_reviews WHERE userId = ?', [userId]);
    console.log('✅ Deleted product reviews');

    // 2. Delete product views
    await connection.query('DELETE FROM product_views WHERE userId = ?', [userId]);
    console.log('✅ Deleted product views');

    // 3. Delete wishlist
    await connection.query('DELETE FROM wishlists WHERE userId = ?', [userId]);
    console.log('✅ Deleted wishlist');

    // 4. Delete order tracking first
    await connection.query('DELETE FROM order_tracking WHERE orderId IN (SELECT orderId FROM orders WHERE userId = ?)', [userId]);
    console.log('✅ Deleted order tracking');

    // 5. Delete order details (if order is linked to user)
    await connection.query('DELETE FROM order_details WHERE orderId IN (SELECT orderId FROM orders WHERE userId = ?)', [userId]);
    console.log('✅ Deleted order details');

    // 6. Delete order vouchers
    await connection.query('DELETE FROM order_vouchers WHERE orderId IN (SELECT orderId FROM orders WHERE userId = ?)', [userId]);
    console.log('✅ Deleted order vouchers');

    // 7. Delete orders
    await connection.query('DELETE FROM orders WHERE userId = ?', [userId]);
    console.log('✅ Deleted orders');

    // 8. Delete cart items
    await connection.query('DELETE FROM cart_items WHERE cartId IN (SELECT cartId FROM carts WHERE userId = ?)', [userId]);
    console.log('✅ Deleted cart items');

    // 9. Delete carts
    await connection.query('DELETE FROM carts WHERE userId = ?', [userId]);
    console.log('✅ Deleted carts');

    // 10. Delete notifications
    await connection.query('DELETE FROM notifications WHERE userId = ?', [userId]);
    console.log('✅ Deleted notifications');

    // 11. Delete user notification preferences
    await connection.query('DELETE FROM user_notification_preferences WHERE userId = ?', [userId]);
    console.log('✅ Deleted user notification preferences');

    // 12. Delete voucher usage
    await connection.query('DELETE FROM voucher_usages WHERE userId = ?', [userId]);
    console.log('✅ Deleted voucher usage');

    // 13. Finally delete the user
    await connection.query('DELETE FROM user WHERE id = ?', [userId]);
    console.log('✅ Deleted user');

    // Commit transaction
    await connection.commit();
    console.log(`\n🎉 Successfully deleted user ID: ${userId}`);
  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('❌ Error deleting user:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Get userId from command line argument
const userId = parseInt(process.argv[2]);

if (!userId || isNaN(userId)) {
  console.error('❌ Please provide a valid user ID');
  console.log('Usage: npm run delete-user <userId>');
  process.exit(1);
}

deleteUser(userId)
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });


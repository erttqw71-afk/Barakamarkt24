import { 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, collections } from './firebaseConfig';
import { CartItem, Order, OrderItem, OrderStatus } from '../types';

class OrderService {
  private localOrdersCache: Order[] = [];

  // Create an order in Cloud Firestore (orders & orderItems collections)
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'> & { orderId?: string; status?: OrderStatus }): Promise<Order> {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = orderData.orderId || `ORD-${randomNum}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', year: 'numeric' })} - ${now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}`;

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderId: orderId,
      userId: orderData.userId || 'guest',
      status: orderData.status || 'pending',
      createdAt: formattedDate
    };

    try {
      const batch = writeBatch(db);

      // 1. Save to orders collection
      const orderDocRef = doc(collections.orders, orderId);
      batch.set(orderDocRef, {
        id: newOrder.id,
        orderId: newOrder.orderId,
        userId: newOrder.userId,
        customerName: newOrder.customerName || '',
        phone: newOrder.phone || '',
        address: newOrder.address || '',
        city: newOrder.city || '',
        subtotal: newOrder.subtotal,
        deliveryFee: newOrder.deliveryFee || 0,
        discount: newOrder.discount || 0,
        total: newOrder.total,
        status: newOrder.status,
        createdAt: newOrder.createdAt,
        timestamp: now.toISOString(),
        notes: newOrder.notes || '',
        items: newOrder.items
      });

      // 2. Save items to orderItems collection for detailed analytics
      for (const item of newOrder.items) {
        const itemId = `${orderId}_${item.product.id}`;
        const itemDocRef = doc(collections.orderItems, itemId);
        const orderItemRecord: OrderItem = {
          id: itemId,
          orderId: orderId,
          productId: item.product.id,
          productNameAr: item.product.nameAr,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          total: item.product.price * item.quantity
        };
        batch.set(itemDocRef, orderItemRecord);
      }

      await batch.commit();
    } catch (e) {
      console.warn('Firestore order creation failed, keeping locally:', e);
    }

    this.localOrdersCache.unshift(newOrder);
    return newOrder;
  }

  // Get orders from Firestore
  async getOrders(userId?: string): Promise<Order[]> {
    try {
      let q = collections.orders;
      if (userId && userId !== 'all') {
        q = query(collections.orders, where('userId', '==', userId)) as any;
      }
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreOrders = snapshot.docs.map(d => {
          const data = d.data() as any;
          return {
            ...data,
            id: d.id,
            orderId: data.orderId || d.id
          } as Order;
        });

        // Sort descending by timestamp or id
        firestoreOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        if (!userId || userId === 'all') {
          this.localOrdersCache = firestoreOrders;
        }
        return firestoreOrders;
      }
    } catch (e) {
      console.warn('Error fetching orders from Firestore:', e);
    }

    if (userId && userId !== 'all') {
      return this.localOrdersCache.filter(o => o.userId === userId);
    }
    return [...this.localOrdersCache];
  }

  // Get single order with order items
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const docRef = doc(collections.orders, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        return { 
          ...data, 
          id: snap.id, 
          orderId: data.orderId || snap.id 
        } as Order;
      }
    } catch (e) {
      console.warn('Error fetching single order:', e);
    }

    const local = this.localOrdersCache.find(o => o.id === id || o.orderId === id);
    return local ? { ...local } : null;
  }

  // Update order status in Firestore (Admin feature)
  async updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
    try {
      const docRef = doc(collections.orders, id);
      await updateDoc(docRef, { status });
    } catch (e) {
      console.warn('Error updating order status in Firestore:', e);
    }

    const order = this.localOrdersCache.find(o => o.id === id || o.orderId === id);
    if (order) {
      order.status = status;
      return true;
    }
    return false;
  }
}

export const orderService = new OrderService();

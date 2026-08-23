import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Sparkles, 
  Truck, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  CreditCard,
  Banknote,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { orderService } from '../services/orderService';
import { CartItem } from '../types';
import { OptimizedImage } from '../components/common/OptimizedImage';

export const CartScreen: React.FC = () => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    cartTotal, 
    cartCount, 
    navigateTo, 
    currentUser,
    showToast,
    currencySymbol
  } = useApp();

  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Customer order checkout fields
  const [customerName, setCustomerName] = useState<string>(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser?.phone || '');
  const [customerAddress, setCustomerAddress] = useState<string>(currentUser?.address || '');
  const [customerCity, setCustomerCity] = useState<string>(currentUser?.city || 'غرايفسفالد');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card' | 'bank_transfer'>('cash_on_delivery');

  // Delivery calculations
  const FREE_SHIPPING_THRESHOLD = 50;
  const deliveryFee = cartTotal >= FREE_SHIPPING_THRESHOLD || cartTotal === 0 ? 0 : 2.50;
  const finalTotal = cartTotal + deliveryFee;

  // Helper to determine max available stock per item
  const getItemStock = (item: CartItem): number => {
    if (item.product.stock !== undefined && item.product.stock !== null) return item.product.stock;
    if (item.product.stockCount !== undefined && item.product.stockCount !== null) return item.product.stockCount;
    return 999;
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      showToast('يرجى استكمال الاسم ورقم الهاتف والعنوان لتأكيد الطلب');
      return;
    }

    setIsCheckingOut(true);
    try {
      const order = await orderService.createOrder({
        userId: currentUser?.id || 'guest',
        customerName: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
        city: customerCity.trim(),
        items: [...cart],
        subtotal: cartTotal,
        deliveryFee,
        discount: 0,
        total: finalTotal,
        notes: customerNotes.trim() ? `${customerNotes.trim()} [طريقة الدفع: ${paymentMethod === 'cash_on_delivery' ? 'الدفع عند الاستلام' : paymentMethod === 'card' ? 'بطاقة بنكية' : 'تحويل بنكي'}]` : `[طريقة الدفع: ${paymentMethod === 'cash_on_delivery' ? 'الدفع عند الاستلام' : paymentMethod === 'card' ? 'بطاقة بنكية' : 'تحويل بنكي'}]`
      });

      setOrderSuccess(order.id);
      clearCart();
      showToast(`تم إرسال طلبك بنجاح رقم #${order.id}`);
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // 1. Order Success Screen
  if (orderSuccess) {
    return (
      <div className="p-6 text-center space-y-5 my-8 max-w-lg mx-auto" dir="rtl">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-stone-900">تم تأكيد طلبك بنجاح!</h2>
          <p className="text-xs text-stone-500">
            رقم الطلب الخاص بك: <span className="font-bold text-stone-900 font-mono text-sm bg-stone-100 px-2 py-0.5 rounded-md">#{orderSuccess}</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 text-right text-xs space-y-2.5 shadow-2xs">
          <div className="flex justify-between text-stone-600">
            <span>حالة الطلب:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              قيد المراجعة والتجهيز
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>العنوان المستهدف:</span>
            <span className="font-bold text-stone-800">{customerAddress} ({customerCity})</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>طريقة الدفع:</span>
            <span className="font-bold text-stone-800">
              {paymentMethod === 'cash_on_delivery' ? 'الدفع نقداً عند الاستلام' : 'بطاقة / تحويل'}
            </span>
          </div>
          <div className="flex justify-between text-stone-600 pt-2 border-t border-stone-100">
            <span>المجموع النهائي:</span>
            <span className="font-black text-emerald-800 text-sm font-sans">{currencySymbol || '€'}{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={() => {
              setOrderSuccess(null);
              navigateTo('orders');
            }}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm cursor-pointer shadow-md active:scale-98 transition-all"
          >
            الانتقال لصفحة طلباتي
          </button>
          <button
            onClick={() => {
              setOrderSuccess(null);
              navigateTo('home');
            }}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3.5 rounded-2xl text-xs sm:text-sm cursor-pointer active:scale-98 transition-all"
          >
            متابعة التسوق في المتجر
          </button>
        </div>
      </div>
    );
  }

  // 2. Empty Cart Screen
  if (cart.length === 0) {
    return (
      <div className="p-8 text-center space-y-4 my-12 max-w-md mx-auto" dir="rtl">
        <div className="w-20 h-20 bg-stone-100 text-stone-400 rounded-3xl flex items-center justify-center mx-auto border border-stone-200/60 shadow-2xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-stone-900">سلة المشتريات فارغة</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            لم تقم بإضافة أي منتجات إلى سلتك بعد. تصفح تشكيلة المؤونة والخيرات السورية وأضف ما تحتاجه!
          </p>
        </div>
        <button
          onClick={() => navigateTo('products')}
          className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <span>تصفح المنتجات الآن</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 3. Active Cart Screen
  return (
    <div className="p-4 space-y-4 pb-32 max-w-3xl mx-auto" dir="rtl">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg text-stone-900">سلة المشتريات</h1>
          <p className="text-xs text-stone-500 font-medium">{cartCount} أصناف محددة في طلبك</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/60 hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>تفريغ السلة</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3">
        {cart.map((item) => {
          const maxStock = getItemStock(item);
          const isAtMaxStock = item.quantity >= maxStock;

          return (
            <div 
              key={item.product.id}
              className="bg-white p-3.5 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3 transition-all hover:border-stone-300"
            >
              {/* Product Image */}
              <div 
                onClick={() => navigateTo('product-detail', { productId: item.product.id })}
                className="w-18 h-18 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 cursor-pointer"
              >
                <OptimizedImage 
                  src={item.product.image} 
                  alt={item.product.nameAr || item.product.name}
                  className="w-full h-full object-cover" 
                  targetWidth={140}
                  quality={75}
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 
                  onClick={() => navigateTo('product-detail', { productId: item.product.id })}
                  className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1 cursor-pointer hover:text-emerald-800 transition-colors"
                >
                  {item.product.nameAr || item.product.name}
                </h3>
                
                <div className="flex items-center gap-2 text-[10px] text-stone-500">
                  <span>{item.product.unit || 'قطعة'}</span>
                  {item.product.weight && <span>• {item.product.weight}</span>}
                  {item.product.brand && <span>• {item.product.brand}</span>}
                </div>

                {/* Stock limit warning if reached */}
                {isAtMaxStock && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    <span>الحد الأقصى المتاح بالمخزن ({maxStock})</span>
                  </div>
                )}

                {/* Price Display */}
                <div className="text-xs font-black text-emerald-800 font-sans pt-0.5">
                  {currencySymbol || '€'}{(item.product.price * item.quantity).toFixed(2)}
                  <span className="text-[10px] text-stone-400 font-normal mr-1.5">
                    ({currencySymbol || '€'}{item.product.price.toFixed(2)} للقطعة)
                  </span>
                </div>
              </div>

              {/* Stepper & Delete */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                  title="حذف الصنف من السلة"
                  aria-label="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-200">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white text-stone-700 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-stone-100 shadow-2xs transition-colors"
                    aria-label="تقليل الكمية"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  
                  <span className="w-6 text-center font-black text-xs font-sans text-stone-900">
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={isAtMaxStock}
                    className="w-7 h-7 rounded-lg bg-white text-stone-700 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-stone-100 shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="زيادة الكمية"
                    title={isAtMaxStock ? `الحد الأقصى للمخزون هو ${maxStock}` : 'زيادة'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Free Delivery Banner Progress */}
      <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-3xl flex items-center gap-3 text-xs text-emerald-900 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
          <Truck className="w-4 h-4" />
        </div>
        <div className="flex-1">
          {cartTotal >= FREE_SHIPPING_THRESHOLD ? (
            <span className="font-bold block text-emerald-900">
              🎉 تهانينا! لقد حصلت على توصيل مجاني لطلبك.
            </span>
          ) : (
            <div className="space-y-1">
              <span>
                أضف منتجات بقيمة <strong className="font-sans font-bold text-emerald-800">{currencySymbol || '€'}{(FREE_SHIPPING_THRESHOLD - cartTotal).toFixed(2)}</strong> إضافية للحصول على توصيل مجاني!
              </span>
              <div className="w-full bg-emerald-200/70 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Calculations Summary */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-2.5 text-xs">
        <h4 className="font-black text-xs text-stone-900 border-b border-stone-100 pb-2 flex items-center justify-between">
          <span>ملخص الفاتورة والحساب</span>
          <span className="text-[11px] text-stone-400 font-normal">{cartCount} قطع</span>
        </h4>
        
        <div className="flex justify-between text-stone-600">
          <span>المجموع الفرعي:</span>
          <span className="font-sans font-bold text-stone-900">{currencySymbol || '€'}{cartTotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-stone-600">
          <span>رسوم الشحن والتوصيل:</span>
          <span className="font-sans font-bold">
            {deliveryFee === 0 ? (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">مجاني</span>
            ) : (
              <span>{currencySymbol || '€'}{deliveryFee.toFixed(2)}</span>
            )}
          </span>
        </div>

        <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-black text-stone-900">
          <span>المجموع الكلي النهائي:</span>
          <span className="text-emerald-800 font-sans text-base">{currencySymbol || '€'}{finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Form Modal / Collapsible Section (متابعة الطلب) */}
      {showCheckoutForm ? (
        <form onSubmit={handleCreateOrder} className="bg-white p-4 rounded-3xl border border-emerald-300 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-800" />
              <span>بيانات التوصيل ومتابعة الطلب</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowCheckoutForm(false)}
              className="text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
          </div>

          {/* Recipient Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>اسم المستلم الكامل:</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: أحمد الصالح"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
            />
          </div>

          {/* Recipient Phone */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              <span>رقم الهاتف / الواتساب:</span>
            </label>
            <input
              type="tel"
              required
              placeholder="مثال: +49 157 12345678"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
            />
          </div>

          {/* City and Address */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700">المدينة:</label>
              <input
                type="text"
                required
                placeholder="المدينة"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700">الشارع ورقم البناء:</label>
              <input
                type="text"
                required
                placeholder="الشارع، رقم المنزل"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-stone-700 block">طريقة الدفع المفضلة:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash_on_delivery', label: 'عند الاستلام', icon: Banknote },
                { id: 'card', label: 'بطاقة بنكية', icon: CreditCard },
                { id: 'bank_transfer', label: 'تحويل بنكي', icon: FileText },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-bold">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">ملاحظات إضافية للطلب (اختياري):</label>
            <textarea
              rows={2}
              placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-emerald-700 focus:outline-hidden resize-none"
            />
          </div>

          {/* Submit Order Button */}
          <button
            type="submit"
            disabled={isCheckingOut}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-98 transition-all disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>{isCheckingOut ? 'جاري إرسال الطلب وحفظه...' : `تأكيد وإتمام الطلب الآن • ${currencySymbol || '€'}${finalTotal.toFixed(2)}`}</span>
          </button>
        </form>
      ) : (
        /* Proceed to Checkout Trigger Button */
        <button
          onClick={() => setShowCheckoutForm(true)}
          className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-black py-4 px-4 rounded-2xl shadow-lg flex items-center justify-between text-xs sm:text-sm cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>متابعة الطلب والدفع</span>
          </div>
          <div className="flex items-center gap-1 font-sans">
            <span>{currencySymbol || '€'}{finalTotal.toFixed(2)}</span>
            <ChevronLeft className="w-4 h-4" />
          </div>
        </button>
      )}

    </div>
  );
};

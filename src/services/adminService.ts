import { 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, collections } from './firebaseConfig';
import { User, Coupon, Offer, AppNotification, Referral } from '../types';

export interface AppSettings {
  id?: string;
  storeNameAr: string;
  storeNameEn: string;
  contactEmail: string;
  contactPhone: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  currency: string;
  minOrderAmount: number;
  welcomeBonusPoints: number;
  referralBonusAmount: number;
  enableMaintenance: boolean;
  announcementText: string;
  allowGuestCheckout: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  storeNameAr: 'بركة ماركت 24',
  storeNameEn: 'Baraka Markt 24',
  contactEmail: 'support@barakamarkt24.de',
  contactPhone: '+49 176 12345678',
  deliveryFee: 4.99,
  freeDeliveryThreshold: 45.00,
  currency: '€',
  minOrderAmount: 15.00,
  welcomeBonusPoints: 100,
  referralBonusAmount: 5.00,
  enableMaintenance: false,
  announcementText: 'توصيل مجاني لطلبات أكثر من 45 يورو في غرايفسفالد وضواحيها!',
  allowGuestCheckout: true
};

class AdminService {
  // ==========================================
  // 1. Users Management (Firestore 'users')
  // ==========================================
  async getAllUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collections.users);
      if (!snap.empty) {
        return snap.docs.map(d => ({
          ...d.data(),
          id: d.id,
          role: d.data().role || 'customer'
        } as User));
      }
    } catch (e) {
      console.warn('Error getting users from Firestore:', e);
    }
    return [];
  }

  async updateUserRole(userId: string, role: 'customer' | 'admin'): Promise<boolean> {
    try {
      const userRef = doc(collections.users, userId);
      await updateDoc(userRef, { role });
      return true;
    } catch (e) {
      console.warn('Error updating user role:', e);
      return false;
    }
  }

  async deleteUserRecord(userId: string): Promise<boolean> {
    try {
      const userRef = doc(collections.users, userId);
      await deleteDoc(userRef);
      return true;
    } catch (e) {
      console.warn('Error deleting user:', e);
      return false;
    }
  }

  // ==========================================
  // 2. Coupons Management (Firestore 'coupons')
  // ==========================================
  async getAllCoupons(): Promise<Coupon[]> {
    try {
      const snap = await getDocs(collections.coupons);
      if (!snap.empty) {
        return snap.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as Coupon));
      }
    } catch (e) {
      console.warn('Error getting coupons:', e);
    }
    // Fallback seed coupons if empty
    return [
      {
        id: 'BARAKA10',
        code: 'BARAKA10',
        discountPercent: 10,
        minSpend: 25,
        validUntil: '2026-12-31',
        isActive: true,
        descriptionAr: 'خصم 10% على مشتريات المؤونة السورية أكثر من 25 يورو'
      },
      {
        id: 'RAMADAN20',
        code: 'RAMADAN20',
        discountPercent: 20,
        minSpend: 50,
        validUntil: '2026-12-31',
        isActive: true,
        descriptionAr: 'خصم 20% على طلبات التموين الكبيرة'
      }
    ];
  }

  async saveCoupon(coupon: Coupon): Promise<boolean> {
    try {
      const couponId = coupon.code.toUpperCase();
      const docRef = doc(collections.coupons, couponId);
      await setDoc(docRef, {
        ...coupon,
        id: couponId,
        code: couponId
      });
      return true;
    } catch (e) {
      console.warn('Error saving coupon:', e);
      return false;
    }
  }

  async deleteCoupon(couponId: string): Promise<boolean> {
    try {
      const docRef = doc(collections.coupons, couponId);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.warn('Error deleting coupon:', e);
      return false;
    }
  }

  async toggleCouponActive(couponId: string, currentActive: boolean): Promise<boolean> {
    try {
      const docRef = doc(collections.coupons, couponId);
      await updateDoc(docRef, { isActive: !currentActive });
      return true;
    } catch (e) {
      console.warn('Error toggling coupon status:', e);
      return false;
    }
  }

  // ==========================================
  // 3. Offers Management (Firestore 'offers')
  // ==========================================
  async getAllOffers(): Promise<Offer[]> {
    try {
      const snap = await getDocs(collections.offers);
      if (!snap.empty) {
        return snap.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as Offer));
      }
    } catch (e) {
      console.warn('Error getting offers:', e);
    }
    // Fallback seed offers
    return [
      {
        id: 'offer-1',
        titleAr: 'مؤونة رمضان وحلب المباركة',
        subtitleAr: 'خصم حتى 30% على الأجبان، الزعتر، والمكدوس الأصلي',
        image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=1200&q=80',
        discountTag: '30% خصم',
        active: true
      },
      {
        id: 'offer-2',
        titleAr: 'عروض الزيوت والسمن الحيواني',
        subtitleAr: 'زيت زيتون بكر ع عصرة أولى وسمنة حموية أصيلة',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80',
        discountTag: 'عرض خاص',
        active: true
      }
    ];
  }

  async saveOffer(offer: Offer): Promise<boolean> {
    try {
      const offerId = offer.id || `offer-${Date.now()}`;
      const docRef = doc(collections.offers, offerId);
      await setDoc(docRef, {
        ...offer,
        id: offerId
      });
      return true;
    } catch (e) {
      console.warn('Error saving offer:', e);
      return false;
    }
  }

  async deleteOffer(offerId: string): Promise<boolean> {
    try {
      const docRef = doc(collections.offers, offerId);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.warn('Error deleting offer:', e);
      return false;
    }
  }

  async toggleOfferActive(offerId: string, currentActive: boolean): Promise<boolean> {
    try {
      const docRef = doc(collections.offers, offerId);
      await updateDoc(docRef, { active: !currentActive });
      return true;
    } catch (e) {
      console.warn('Error toggling offer:', e);
      return false;
    }
  }

  // ==========================================
  // 4. Notifications Management (Firestore 'notifications')
  // ==========================================
  async getAllNotifications(): Promise<AppNotification[]> {
    try {
      const snap = await getDocs(collections.notifications);
      if (!snap.empty) {
        return snap.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as AppNotification));
      }
    } catch (e) {
      console.warn('Error getting notifications:', e);
    }
    return [
      {
        id: 'notif-1',
        userId: 'all',
        title: 'أهلاً بكم في بركة ماركت 24',
        message: 'تم إضافة تشكيلة جديدة من الأجبان الشامية وزيت الزيتون البكر.',
        read: false,
        createdAt: new Date().toLocaleDateString('ar-SY'),
        type: 'system'
      }
    ];
  }

  async sendBroadcastNotification(title: string, message: string, type: 'promo' | 'system' | 'order' = 'promo'): Promise<boolean> {
    try {
      const notifId = `notif-${Date.now()}`;
      const docRef = doc(collections.notifications, notifId);
      await setDoc(docRef, {
        id: notifId,
        userId: 'all',
        title,
        message,
        read: false,
        createdAt: new Date().toLocaleDateString('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }),
        type
      });
      return true;
    } catch (e) {
      console.warn('Error sending broadcast notification:', e);
      return false;
    }
  }

  async deleteNotification(notifId: string): Promise<boolean> {
    try {
      const docRef = doc(collections.notifications, notifId);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.warn('Error deleting notification:', e);
      return false;
    }
  }

  // ==========================================
  // 5. Referrals Management (Firestore 'referrals')
  // ==========================================
  async getAllReferrals(): Promise<Referral[]> {
    try {
      const snap = await getDocs(collections.referrals);
      if (!snap.empty) {
        return snap.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as Referral));
      }
    } catch (e) {
      console.warn('Error getting referrals:', e);
    }
    return [
      {
        id: 'ref-1',
        referrerUserId: 'user-ahmad',
        referredUserId: 'user-sami',
        code: 'AHMAD24',
        bonusApplied: true,
        status: 'completed',
        createdAt: '2026-08-15'
      },
      {
        id: 'ref-2',
        referrerUserId: 'user-nour',
        code: 'NOUR55',
        bonusApplied: false,
        status: 'pending',
        createdAt: '2026-08-20'
      }
    ];
  }

  // ==========================================
  // 6. App Settings Management (Firestore doc or local)
  // ==========================================
  async getSettings(): Promise<AppSettings> {
    try {
      const settingsRef = doc(db, 'settings', 'general');
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        return { ...DEFAULT_SETTINGS, ...snap.data() } as AppSettings;
      }
    } catch (e) {
      console.warn('Error getting settings from Firestore, returning defaults:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(settingsRef, settings, { merge: true });
      return true;
    } catch (e) {
      console.warn('Error saving settings to Firestore:', e);
      return false;
    }
  }
}

export const adminService = new AdminService();

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { sessionUserToRequestContext } from '@fightbox/shared';
import type {
  CreditLedgerEntryDto,
  CreditWalletDto,
  PaymentOrderDto,
  PaymentProductDto,
} from '@fightbox/shared';
import { useAuth } from '../../auth/AuthContext';
import { getFightboxClientPermissionsForUser } from '../../workout-program-builder/services/fightboxPermissions';
import {
  adminAdjustCredits,
  adminListWallets,
  BillingApiError,
  createPaymentOrder,
  getMyLedger,
  getMyWallet,
  listMyPaymentOrders,
  listPaymentProducts,
  manualCompleteOrder,
} from '../billingApiClient';
import { AdminCreditAdjustModal } from '../components/AdminCreditAdjustModal';
import { BillingSummaryCard } from '../components/BillingSummaryCard';
import { CreditLedgerTable } from '../components/CreditLedgerTable';
import { CreditPurchasePanel } from '../components/CreditPurchasePanel';
import { PaymentOrderTable } from '../components/PaymentOrderTable';
import '../billing.css';

export function BillingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [wallet, setWallet] = useState<CreditWalletDto | null>(null);
  const [allWallets, setAllWallets] = useState<CreditWalletDto[]>([]);
  const [ledger, setLedger] = useState<CreditLedgerEntryDto[]>([]);
  const [products, setProducts] = useState<PaymentProductDto[]>([]);
  const [orders, setOrders] = useState<PaymentOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const permissions = useMemo(
    () => (user ? getFightboxClientPermissionsForUser(user) : null),
    [user],
  );

  const canAccess = user && permissions?.canViewBilling;

  const showMessage = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 4000);
  }, []);

  const loadBillingData = useCallback(async () => {
    if (!user || !permissions?.canViewBilling) {
      return;
    }

    setLoading(true);
    try {
      const [walletData, ledgerData, productData, orderData] = await Promise.all([
        getMyWallet(user),
        getMyLedger(user),
        listPaymentProducts(user),
        listMyPaymentOrders(user),
      ]);
      setWallet(walletData);
      setLedger(ledgerData);
      setProducts(productData);
      setOrders(orderData);

      if (permissions.canManageBilling) {
        const wallets = await adminListWallets(user);
        setAllWallets(wallets);
      }
    } catch (error) {
      const message =
        error instanceof BillingApiError ? error.message : '결제 정보를 불러오지 못했습니다.';
      showMessage(message);
    } finally {
      setLoading(false);
    }
  }, [user, permissions, showMessage]);

  useEffect(() => {
    void loadBillingData();
  }, [loadBillingData]);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const manual = searchParams.get('manual');
    if (orderId && manual === '1') {
      showMessage(`주문 ${orderId.slice(0, 12)}… — 아래에서 수동 결제 완료를 진행하세요.`);
    }
  }, [searchParams, showMessage]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handlePurchase = async (productId: string) => {
    if (!user) return;
    setPurchasingProductId(productId);
    try {
      const result = await createPaymentOrder(user, { productId });
      showMessage('주문이 생성되었습니다. manual provider에서는 수동 결제 완료를 진행하세요.');
      setOrders((prev) => [result.order, ...prev]);
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      showMessage(error instanceof BillingApiError ? error.message : '주문 생성에 실패했습니다.');
    } finally {
      setPurchasingProductId(null);
    }
  };

  const handleManualComplete = async (orderId: string) => {
    if (!user) return;
    setCompletingOrderId(orderId);
    try {
      const updated = await manualCompleteOrder(user, orderId);
      showMessage('결제가 완료되어 크레딧이 충전되었습니다.');
      setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
      await loadBillingData();
    } catch (error) {
      showMessage(error instanceof BillingApiError ? error.message : '결제 완료 처리에 실패했습니다.');
    } finally {
      setCompletingOrderId(null);
    }
  };

  const handleAdminAdjust = async (input: {
    gymId: string;
    amount: number;
    reason: string;
  }) => {
    if (!user) return;
    await adminAdjustCredits(user, input);
    showMessage('크레딧이 조정되었습니다.');
    await loadBillingData();
  };

  if (!user || !permissions) {
    return null;
  }

  if (!canAccess) {
    return (
      <div className="billing-page billing-page--denied">
        <div className="billing-denied-card">
          <h1>결제 관리</h1>
          <p>결제 관리 권한이 없습니다.</p>
          <Link to="/dashboard" className="billing-btn billing-btn--primary">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isSuperAdmin = sessionUserToRequestContext(user).role === 'super_admin';

  return (
    <div className="billing-page">
      <header className="billing-page-header">
        <div>
          <Link to="/dashboard" className="billing-back-link">
            ← 대시보드
          </Link>
          <h1>{isSuperAdmin ? '결제/크레딧 관리' : '크레딧 충전/결제'}</h1>
        </div>
        <button type="button" className="billing-btn" onClick={handleLogout}>
          로그아웃
        </button>
      </header>

      <div className="billing-page-body">
        <BillingSummaryCard wallet={wallet} loading={loading} />

        {permissions.canManageBilling ? (
          <section className="billing-card">
            <div className="billing-card-head-row">
              <h2>전체 체육관 지갑</h2>
              <button
                type="button"
                className="billing-btn billing-btn--primary"
                onClick={() => setIsAdjustModalOpen(true)}
              >
                수동 지급/차감
              </button>
            </div>
            <div className="billing-table-wrap">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>gymId</th>
                    <th>잔액</th>
                    <th>누적 구매</th>
                    <th>누적 지급</th>
                    <th>누적 사용</th>
                  </tr>
                </thead>
                <tbody>
                  {allWallets.map((item) => (
                    <tr key={item.id}>
                      <td>{item.gymId}</td>
                      <td>{item.balance.toLocaleString('ko-KR')}</td>
                      <td>{item.lifetimePurchased.toLocaleString('ko-KR')}</td>
                      <td>{item.lifetimeGranted.toLocaleString('ko-KR')}</td>
                      <td>{item.lifetimeSpent.toLocaleString('ko-KR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {permissions.canPurchaseCredits ? (
          <CreditPurchasePanel
            products={products}
            loading={loading}
            purchasingProductId={purchasingProductId}
            onPurchase={handlePurchase}
          />
        ) : null}

        <PaymentOrderTable
          orders={orders}
          loading={loading}
          completingOrderId={completingOrderId}
          onManualComplete={handleManualComplete}
        />

        <CreditLedgerTable entries={ledger} loading={loading} />
      </div>

      <AdminCreditAdjustModal
        isOpen={isAdjustModalOpen}
        wallets={allWallets.length > 0 ? allWallets : wallet ? [wallet] : []}
        onClose={() => setIsAdjustModalOpen(false)}
        onSubmit={handleAdminAdjust}
      />

      {statusMessage ? (
        <p className="billing-status-toast" role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
